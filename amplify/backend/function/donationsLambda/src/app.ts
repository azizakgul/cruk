/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const AWS = require('aws-sdk')
// import AWS from "aws-sdk"
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const bodyParser = require('body-parser')
const express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "donationsTable";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "id";
const partitionKeyType = "S";
const sortKeyName = "timestamp";
const sortKeyType = "N";
const hasSortKey = true;
const path = "/donations";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
}

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path + hashKeyPath, function(req, res) {
  const condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.statusCode = 500;
      res.json({error: 'Wrong column type ' + err});
    }
  }

  const email = req.params[partitionKeyName]
  if(validateEmail(email) === false){
    console.error(`Error loading items: Wrong email format `, email)
    res.statusCode = 400;
    res.json({error: "Wrong email format"});
    return

  }
  let queryParams = {
    TableName: tableName,
    KeyConditions: condition
  }

  console.log("Getting donations for ", email)

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
        console.error(`Error loading items`, err)
      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});
    } else {

      const message = createGetDonationsMessage(data.Items as DonationItem[], true)
      res.json({message : message});
    }
  });
});


function validateEmail(email : string){
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function createGetDonationsMessage(items : DonationItem[], check? : boolean){

  const donationTimes = items.length

  const totalDonationAmount = items.reduce((t, v) => t + v.donation, 0)

  if(check){
    return `You have made ${donationTimes} donation totalling £${totalDonationAmount}`
  }
   
  const text = donationTimes < 2 ? `You have made ${donationTimes} donation totalling £${totalDonationAmount}` : `You have made ${donationTimes} donations totalling £${totalDonationAmount}. We just sent you a thank you mail :)`
  return text
}

function validateDonationAmount(amount : number){
    if(!amount || typeof amount !== "number" || amount < 1) return false

    return true
}

interface DonationItem {
    id          : string
    donation    : number
    timestamp   : number
}


/************************************
* HTTP post method for insert object *
*************************************/

app.post(path, function(req, res) {

  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  let email     = req.body["id"]
  const amount  = req.body["donation"]

  console.log("Making a donation", req.body)

  if(!email || !amount){
    res.statusCode = 400;
    res.json({error: "Missing data"});
    return
  }

  email = email.toLowerCase().trim()


  if(validateEmail(email) === false){

    res.statusCode = 400;
    res.json({error: "Wrong email format"});
    return
  }

  if(validateDonationAmount(amount) === false){

    res.statusCode = 400;
    res.json({error: "Wrong amount"});
    return
  }

  const now = Math.floor(Date.now() / 1000)
  
  const item = {
    id          : email,
    donation    : amount,
    timestamp   : now 
}

  console.log(`Saving new donation`, item)

  let putItemParams = {
    TableName: tableName,
    Item: item
  }

  dynamodb.put(putItemParams, (err, data) => {
    if (err) {

      console.error(`Error saving donation`, err)

      res.statusCode = 500;
      res.json({error: err, url: req.url, body: req.body});

      return
    }

    // Saved the donation 
    // Get total donations to notify user
    // Send email if donations are more than 1

    let queryParams = {
        TableName: tableName,
        KeyConditionExpression: "id = :e",
        ExpressionAttributeValues: {
            ":e": email
        }
    }
    
    dynamodb.query(queryParams, async (err, data) => {
        if (err) {
            console.error(`Error loading items`, err)

            res.statusCode = 500;
            res.json({error: 'Could not load items: ' + err});
        } else {

            const message = createGetDonationsMessage(data.Items as DonationItem[])
            
            if(data.Items.length > 1){
                // Send Email

                var ses = new AWS.SES({ region: "us-east-1" });

                var params = {
                    Destination: {
                    ToAddresses: [email],
                    },
                    Message: {
                    Body: {
                        Text: { Data: `Hi, thank you for your donation of £${amount} :)` },
                    },

                    Subject: { Data: "Thank you for your donation" },
                    },
                    Source: "hello@punchline.ai",
                };
                
                ses.sendEmail(params).send((err, data) =>{
                    if(err){
                        console.error("Error sending email", err)
                        res.json({message : message});
                    }
                    
                    console.log("Mail sent: ", data)

                    res.json({message : message});
                    
                }) 

                console.log("email is sent")
                    
                
                
            }else{
                res.json({message : message});
            }
            
            
            
        }
    })




    // res.json({success: 'post call succeed!', url: req.url, data: data})
    
  });
});



app.listen(3000, function() {
  console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app

/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var AWS = require('aws-sdk');
// import AWS from "aws-sdk"
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
var bodyParser = require('body-parser');
var express = require('express');
AWS.config.update({ region: process.env.TABLE_REGION });
var dynamodb = new AWS.DynamoDB.DocumentClient();
var tableName = "donationsTable";
if (process.env.ENV && process.env.ENV !== "NONE") {
    tableName = tableName + '-' + process.env.ENV;
}
var userIdPresent = false; // TODO: update in case is required to use that definition
var partitionKeyName = "id";
var partitionKeyType = "S";
var sortKeyName = "timestamp";
var sortKeyType = "N";
var hasSortKey = true;
var path = "/donations";
var UNAUTH = 'UNAUTH';
var hashKeyPath = '/:' + partitionKeyName;
var sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
// declare a new express app
var app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());
// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
// convert url string param to expected Type
var convertUrlType = function (param, type) {
    switch (type) {
        case "N":
            return Number.parseInt(param);
        default:
            return param;
    }
};
/********************************
 * HTTP Get method for list objects *
 ********************************/
app.get(path + hashKeyPath, function (req, res) {
    var condition = {};
    condition[partitionKeyName] = {
        ComparisonOperator: 'EQ'
    };
    if (userIdPresent && req.apiGateway) {
        condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH];
    }
    else {
        try {
            condition[partitionKeyName]['AttributeValueList'] = [convertUrlType(req.params[partitionKeyName], partitionKeyType)];
        }
        catch (err) {
            res.statusCode = 500;
            res.json({ error: 'Wrong column type ' + err });
        }
    }
    var email = req.params[partitionKeyName];
    if (validateEmail(email) === false) {
        console.error("Error loading items: Wrong email format ", email);
        res.statusCode = 400;
        res.json({ error: "Wrong email format" });
        return;
    }
    var queryParams = {
        TableName: tableName,
        KeyConditions: condition
    };
    console.log("Getting donations for ", email);
    dynamodb.query(queryParams, function (err, data) {
        if (err) {
            console.error("Error loading items", err);
            res.statusCode = 500;
            res.json({ error: 'Could not load items: ' + err });
        }
        else {
            var message = createGetDonationsMessage(data.Items);
            res.json({ message: message });
        }
    });
});
function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}
function createGetDonationsMessage(items) {
    var donationTimes = items.length;
    var totalDonationAmount = items.reduce(function (t, v) { return t + v.donation; }, 0);
    var text = donationTimes < 2 ? "You have made ".concat(donationTimes, " donation totalling \u00A3").concat(totalDonationAmount) : "You have made ".concat(donationTimes, " donations totalling \u00A3").concat(totalDonationAmount, ". We just sent you a thank you mail :)");
    return text;
}
function validateDonationAmount(amount) {
    if (!amount || typeof amount !== "number" || amount < 1)
        return false;
    return true;
}
/************************************
* HTTP post method for insert object *
*************************************/
app.post(path, function (req, res) {
    var _this = this;
    if (userIdPresent) {
        req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
    }
    var email = req.body["id"];
    var amount = req.body["donation"];
    console.log("Making a donation", req.body);
    if (!email || !amount) {
        res.statusCode = 400;
        res.json({ error: "Missing data" });
        return;
    }
    email = email.toLowerCase().trim();
    if (validateEmail(email) === false) {
        res.statusCode = 400;
        res.json({ error: "Wrong email format" });
        return;
    }
    if (validateDonationAmount(amount) === false) {
        res.statusCode = 400;
        res.json({ error: "Wrong amount" });
        return;
    }
    var now = Math.floor(Date.now() / 1000);
    var item = {
        id: email,
        donation: amount,
        timestamp: now
    };
    console.log("Saving new donation", item);
    var putItemParams = {
        TableName: tableName,
        Item: item
    };
    dynamodb.put(putItemParams, function (err, data) {
        if (err) {
            console.error("Error saving donation", err);
            res.statusCode = 500;
            res.json({ error: err, url: req.url, body: req.body });
            return;
        }
        // Saved the donation 
        // Get total donations to notify user
        // Send email if donations are more than 1
        var queryParams = {
            TableName: tableName,
            KeyConditionExpression: "id = :e",
            ExpressionAttributeValues: {
                ":e": email
            }
        };
        dynamodb.query(queryParams, function (err, data) { return __awaiter(_this, void 0, void 0, function () {
            var message_1, ses, params;
            return __generator(this, function (_a) {
                if (err) {
                    console.error("Error loading items", err);
                    res.statusCode = 500;
                    res.json({ error: 'Could not load items: ' + err });
                }
                else {
                    message_1 = createGetDonationsMessage(data.Items);
                    if (data.Items.length > 1) {
                        ses = new AWS.SES({ region: "us-east-1" });
                        params = {
                            Destination: {
                                ToAddresses: [email]
                            },
                            Message: {
                                Body: {
                                    Text: { Data: "Hi, thank you for your donation of \u00A3".concat(amount, " :)") }
                                },
                                Subject: { Data: "Thank you for your donation" }
                            },
                            Source: "hello@punchline.ai"
                        };
                        ses.sendEmail(params).send(function (err, data) {
                            if (err) {
                                console.error("Error sending email", err);
                                res.json({ message: message_1 });
                            }
                            console.log("Mail sent: ", data);
                            res.json({ message: message_1 });
                        });
                        console.log("email is sent");
                    }
                    else {
                        res.json({ message: message_1 });
                    }
                }
                return [2 /*return*/];
            });
        }); });
        // res.json({success: 'post call succeed!', url: req.url, data: data})
    });
});
app.listen(3000, function () {
    console.log("App started");
});
// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;

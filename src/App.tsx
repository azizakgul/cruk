import React, {useEffect, useState}  from 'react';
import './App.css';
import {Grid, Container, Button, Typography, TextField, InputAdornment} from '@mui/material';
import * as Axios from "axios"

function App() {

  /**
   * Hi, welcome to the React client
   * - Here the form takes and validates the inputs. Normally more validation such as email validation should be done here as well but currently it's being handled on the API
   * - User can submit a new donation. Response will be a message with the total donations to date for the user
   * - User can get the donations of an email
   */

  const [email, setEmail] = useState<string>()
  const [amount, setAmount] = useState<string>()
  const [userMessage, setUserMessage] = useState<string>()
  

  const axios = Axios.default


  useEffect(() => {
        
  }, []);

  async function getDonations(email:string):Promise<DonationResponse|undefined>{

    const lambdaUrl = "https://g3kfr51f9h.execute-api.us-east-1.amazonaws.com/staging/donations/"
      
    try {
      const response = await axios.get(`${lambdaUrl}${email}`);
      console.log(response.data);
      return response.data as DonationResponse
      
    } catch (error) {
      console.error(error);
      return
    }
  }

  async function saveDonation(donation:Donation):Promise<DonationResponse|undefined>{

    const lambdaUrl = "https://g3kfr51f9h.execute-api.us-east-1.amazonaws.com/staging/donations/"
      
    try {
      const response = await axios.post(lambdaUrl, {
        id: donation.email,
        donation: donation.amount
      });

      console.log(response.data);
      return response.data as DonationResponse
      
    } catch (error) {
      console.error(error);
      return
    }
  }

  function handleNewTextField(event : React.ChangeEvent<HTMLInputElement>){

    const id    = event.currentTarget.id
    const value = event.currentTarget.value

    if(userMessage || userMessage !== "") setUserMessage("")

    if(id === "email") setEmail(value)
    if(id === "amount") setAmount(value)

   
}

  async function handleButtonSubmit( event: React.MouseEvent<HTMLElement>){

    const id = event.currentTarget.id

    if(!email || email.trim() === ""){
      setUserMessage("Please enter your email")
      return
    }

    if(id === "newDonation"){

      if(!amount){
        setUserMessage("Please enter an amount")
        return
      }

      const amountNumber = parseInt(amount)

      if(!amountNumber){
        setUserMessage("Please enter an amount as a number")
        return
      }

      try {
        const result = await saveDonation({email : email, amount : amountNumber})

        if(!result){
          setUserMessage("Oops, please try again")
          return
        }

        if(result.error){
          setUserMessage(`An error occured: ${result.error}`)
          return
        }

        if(result.message){
          setUserMessage(result.message)
          return
        }

      } catch (error) {
        console.error(error)
        setUserMessage("Oops, please try again")      
      }
    }

    if(id === "getDonations"){

      console.log("getting donations")
      try {
        const result = await getDonations(email)

        if(!result){
          setUserMessage("Oops, please try again")
          return
        }

        if(result.error){
          setUserMessage(`An error occured: ${result.error}`)
          return
        }

        if(result.message){
          setUserMessage(result.message)
          return
        }

      } catch (error) {

        console.error(error)
        setUserMessage("Oops, please try again")      
        
      }

    }    
  }


  return (    
    <Container>

      <Grid container justifyContent={"center"} spacing={3}>

        <Grid item xs={12} style={{marginTop:"20px"}}>
          <Typography variant="h2" style={{textAlign:"center"}}>
            Welcome to Cancer Research UK
          </Typography>
        </Grid>

        <Grid item> 
          <TextField
            id="email"
          //  key={field.id}
            label="Email"
            // defaultValue="Default Value"
            helperText="Please enter your email"
            variant="outlined"
            onChange={handleNewTextField}
            placeholder="superman@cruk.org"
            fullWidth
            value={email}
          />
        </Grid>

        <Grid item>

        <TextField
            id="amount"
          //  key={field.id}
            label="Donation Amount"
            // defaultValue="Default Value"
            helperText="Please be generous :)"
            variant="outlined"
            onChange={handleNewTextField}
            placeholder="1000"
            InputProps={{
            startAdornment: <InputAdornment position="start">£</InputAdornment>,
          }}
            fullWidth
            value={amount}
          />
          
          </Grid>

          <Grid item>
            <Button id="newDonation" onClick={handleButtonSubmit} color="primary" >Make a donation</Button>
          
          </Grid>

          <Grid item>
            <Button id="getDonations" onClick={handleButtonSubmit} color="primary">Check donations</Button>
          
          </Grid>


          {
            userMessage &&

            <Grid item xs={12} style={{marginTop:"20px"}}>
            <Typography variant="h6" style={{textAlign:"center"}}>
              {userMessage}
            </Typography>
          </Grid>

          }
      </Grid>
    </Container>
  );
}


interface Donation {
  email  : string
  amount : number
}

interface DonationResponse {
  error?   : string 
  message? : string
}

export default App;

import React, {useEffect, useState, useRef}  from 'react';
import logo from './logo.svg';
import './App.css';
import {Button} from '@mui/material';
import * as Axios from "axios"

function App() {

  const axios = Axios.default


  useEffect(() => {
        
    

  }, []);

  async function getDonations(email:string):Promise<GetDonations|undefined>{

    const lambdaUrl = "https://g3kfr51f9h.execute-api.us-east-1.amazonaws.com/staging/donations/"
      
    try {
      const response = await axios.get(`${lambdaUrl}${email}`);
      return response as GetDonations
      console.log(response);
    } catch (error) {
      console.error(error);
      return
    }
  }

  async function saveDonation(donation:Donation):Promise<GetDonations|undefined>{

    const lambdaUrl = "https://g3kfr51f9h.execute-api.us-east-1.amazonaws.com/staging/donations/"
      
    try {
      const response = await axios.post(lambdaUrl, {
        id: donation.email,
        donation: donation.amount
      });
      return response as GetDonations
      console.log(response);
    } catch (error) {
      console.error(error);
      return
    }
  }




  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Button>Make a donation</Button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}


interface Donation {
  email  : string
  amount : number

}

interface GetDonations {
  error?  : string
  amount? : number
  times?  : number
}

export default App;

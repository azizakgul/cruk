# Welcome to Cancer Research UK Demo App

You can see a live demo from [this link](https://master.d2iajqb0qmrxwq.amplifyapp.com/)

- You can make a donation by entering an email and a donation amount.
- If you make more than 1 donation, an email will be sent to the email address.
- You can also check the total amount of donations given an email address.

## App
The app is built with React as a web app and AWS Amplify on the backend using Nodejs and Typescript.
Dynamodb is used as the database and a lambda function is handling the backend logic.
Donations are saved with the email of the donor, donation amount and timestamp.
The logs are added and can be viewed from Cloudwatch.
So currently the app is pretty scalable although in a production environment there would be more checks and details (like auth) and the db schema would be very different ofcourse. (email would not be the primary key for example :)

## Deployment
You can deploy the app by making a new Amplify app and connecting to this repo.

To test the Web react app you can follow the instructions below

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

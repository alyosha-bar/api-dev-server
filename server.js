// const express = require('express')
const cors = require('cors');
// require('dotenv').config()
// const mongoose = require('mongoose')

// const TokenSchema = require('./models/tokenInfo')
// const {updateToken} = require('./controllers/token')

// const ApiSchema = require('./models/api')


// // firebase set up
const admin = require("firebase-admin");
var serviceAccount = require("./firebase/api-dev-auth-firebase-adminsdk-mwlnx-70a08bf9d2.json");
// const { MongoClient } = require('mongodb');


// const url = process.env.MONGO_DB_URI

// const client = new MongoClient(url)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// Initialize Firestore
const db = admin.firestore();


// // routes


// async function createCollection(uid, dbName) {
//     try {
//       // Connect to the MongoDB server
//       await client.connect();
      
//       // Select the database
//       const db = client.db(dbName);
      
//       // Create a collection with the user ID or token as the name
//       await db.createCollection(uid);
      
//       console.log(`Collection created with name: ${uid}`);
//     } catch (err) {
//       console.error('Error creating collection:', err);
//     }
// }


// app.use('/generateApiInfo', async (req, res) => {
//   const {uid, name, limit, description} = req.body

//   console.log(name)
//   console.log(limit)
//   console.log(description)


//   // save to db
//   console.log("Adding to APIs!");
  
//     try {
//       // Connect to the MongoDB client
//       await client.connect();
  
//       // Access the specific database
//       const db = client.db('usage');
      
//       // Access the specific collection based on the user ID
//       const collection = db.collection(uid); // Use uid to specify the correct collection
  
//       // Update the tokenInfo document in the collection for the given user
//       const updatedApiInfo = await collection.updateOne(
//         { _id: 'apis' },  // Ensure this matches the actual document in the collection
//         { $push: {
//           names: name,
//           descriptions: description,
//           limits: limit
//         }
//       });   // Use $set with the object containing the fields to update
  
//       if (updatedApiInfo.modifiedCount === 0) {
//         return res.status(404).send('Token info not found or already updated');
//       }
  
//       // Return the token
//       res.status(200).json({ "message": "Insert Successful!" });
//     } catch (err) {
//       console.log(err.message);
//       res.status(500).send('Server Error');
//     } finally {
//       // Close the MongoDB connection when done
//       await client.close();
//     }
// })



// // Function to dynamically get the collection based on the user ID
// function getTokenModelByUserId(userId) {
//   // Check if a model for this userId already exists
//   if (mongoose.modelNames().includes(userId)) {
//     // If it exists, return the existing model
//     console.log('here')
//     return mongoose.model(userId);
//   }

//   // If it doesn't exist, create a new model and return it
//   return mongoose.model(userId, TokenSchema, userId);
// }



// // generate token route
// app.use('/generate', updateToken)

// app.use('/regenerate', async (req, res) => {



//   res.status(200).json({"message": "Invalidated Old Token. Generated New Token."})
// })

// app.use('/invalidate', async (req, res) => {


//   res.status(200).json({"message": "Invalidated Token"})
// })


// // run the server
// mongoose.connect(url).then( () => {
//   // listen for requests
//   app.listen(port, () => {
//       console.log('Connected to DB & Listening on port', port)
//   })
// }).catch( (err) => {
//   console.log(err)
// })


// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');  // Or use Client if you prefer a single connection

const app = express();


app.use(express.json())

// Enable CORS for all routes
app.use(cors());

app.use( (req, res, next) => {
    next()
})


// Create a new pool using the DATABASE_URL from the .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessary for Neon connections due to SSL
  }
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log(result.rows);  // Should log the current timestamp from the database
  });
});

// Define your Express routes here
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error querying the database');
  }
});

// token routes
// generate
// regenerate

// api routes
// fetch all apis from user
app.use('/home/:id', async (req, res) => {

    const uid = req.params.id

    let id = -1;

    // get id which references uid
    try {

      const query = 'SELECT id FROM Users WHERE uid = $1'

      id = await pool.query(query, uid)
      console.log(id)


    } catch (err) {
      res.status(500).json({"message": "Internal Server Error."})
    } 

    try {
      // fetch all from APIs where uid = Users.uid
  
      const query = 'SELECT * FROM Apis WHERE userid = $1'

      // const result = await pool.query(query, id)
      console.log("running query: ")
      console.log(query)
      console.log(id)


    } catch (err) {

        res.status(500).json({ message: 'Server error' });
    }
})


// generate an api

// get analytics for specific API


// user routes
// signup places some info into DB
app.use('/signup', async (req, res) => {
    const uid = req.body.uid;
    const email = req.body.email;
  
    if (!uid) {
      return res.status(400).json({ message: 'UID is required' });
    }
  
    console.log("UID: " + uid);
  
    // Create a collection dynamically based on UID
    try {

      // insert the user record
      console.log("inserting a user")

      // Insert into a table called 'users' with columns 'name' and 'age'
      const query = 'INSERT INTO Users (uid, email, firstname, lastname) VALUES ($1, $2, $3, $4) RETURNING *';
      const values = [uid, email, "test", "test"];
      
      // Execute query
      const result = await pool.query(query, values);
  
      // Send success response
      res.status(201).json({ message: 'Sign up successful! Collection and document created.'});
    } catch (err) {
      console.error('Error inserting document into collection:', err);
      res.status(500).json({ message: 'Server error' });
    }
})



// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

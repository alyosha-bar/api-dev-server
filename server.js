const express = require('express')
const cors = require('cors');
const port = 3000;
const app = express()


// firebase set up
const admin = require("firebase-admin");
var serviceAccount = require("./firebase/api-dev-auth-firebase-adminsdk-mwlnx-70a08bf9d2.json");
const { MongoClient } = require('mongodb');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const url = process.env.MONGO_DB_URI
const dbname = "usage"

const client = new MongoClient("dbstring")

async function createCollection(uid, dbName) {
    try {
      // Connect to the MongoDB server
      await client.connect();
      console.log('Connected to MongoDB');
  
      // Access the database
      const db = client.db(dbName);
  
      // Create a new collection
      await db.createCollection(uid);
      console.log(`Collection "${uid}" created successfully!`);
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      // Close the MongoDB connection
      await client.close();
    }
  }

// Initialize Firestore
const db = admin.firestore();


app.use(express.json())

// Enable CORS for all routes
app.use(cors());

app.use( (req, res, next) => {
    next()
})

// routes
app.use('/home/:id', async (req, res) => {

    console.log("getting test data")

    const id = req.params.id


    // fetch from database
    const testData = [
        {
            "id": 1,
            "title": "Cat-Facts",
            "description": "Simple API to get random cat facts!"
        },
        {
            "id": 2,
            "title": "News API",
            "description": "Gets the newest stories from a variety of news sources"
        },
        {
            "id": 3,
            "title": "Open AI",
            "description": "API to access OpenAI's LLM and ChatGPT"
        },
        {
            "id": 4,
            "title": "Google Maps API",
            "description": "API for accessing Google Maps services, including geocoding, directions, and place search."
        },
        {
            "id": 5,
            "title": "Twitter API",
            "description": "API to interact with Twitter's social media platform, allowing access to tweets, user data, and posting capabilities."
        },
        {
            "id": 6,
            "title": "Stripe API",
            "description": "API for payment processing, providing features for accepting online payments, managing subscriptions, and handling refunds."
        },
        {
            "id": 7,
            "title": "Spotify API",
            "description": "API to access Spotify's music data, including track information, playlists, user profiles, and music streaming capabilities."
        },
        // {
        //     "id": 8,
        //     "title": "Weather API",
        //     "description": "API that provides weather data, including current conditions, forecasts, historical data, and weather alerts."
        // },
        // {
        //     "id": 9,
        //     "title": "Firebase API",
        //     "description": "API to access Firebase services, offering tools for real-time databases, authentication, hosting, and push notifications."
        // },
        // {
        //     "id": 10,
        //     "title": "GitHub API",
        //     "description": "API for interacting with GitHub repositories, enabling actions like repository management, pull requests, and issue tracking."
        // },
        // {
        //     "id": 11,
        //     "title": "Twilio API",
        //     "description": "API for SMS, voice, and video communication services, enabling messaging and call integration within applications."
        // },
        // {
        //     "id": 12,
        //     "title": "YouTube Data API",
        //     "description": "API to retrieve and manage YouTube content such as videos, channels, and playlists, and to integrate YouTube features into apps."
        // },
        // {
        //     "id": 13,
        //     "title": "Amazon S3 API",
        //     "description": "API for Amazon's Simple Storage Service (S3), providing scalable object storage for data and media file hosting."
        // } 
    ]     

    console.log("ID: " + id)

    const rightDoc = [];

    try {
        const usersCollection = db.collection(id);
        const snapshot = await usersCollection.get();

    if (snapshot.empty) {
        console.log("No data found.")
        res.status(404).json({"message": "You have no APIs Registered."});
        return;
    }

    snapshot.forEach(doc => {
        if (doc.id === 'apis') {  // Check if the document ID is "apis"
            const docData = { id: doc.id, ...doc.data() };  // Combine the ID and document data
            rightDoc.push(docData);  // Push it into the array or handle it as needed
            console.log(docData);  // Log the document data
        }
    });
    
    
    console.log(rightDoc[0].names)
    console.log(rightDoc[0].descriptions)
    // res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }

    res.json(rightDoc[0])
})

app.use('/login', async (req, res) => {
    console.log("Logging in...")
    console.log(req.body)
    
    // check against firebase auth

    // return the user object (id, and user name - NO PASSWORD)


    if (req.body.Email === "alyosha@gmail.com" && req.body.Password === '123') {

        const user = {
            Email: "alyosha@gmail.com",
            id : 1,
        }
        

        res.status(200).json(user)
    } else {
        res.status(400).json("Invalid Credentials")
    }
})

app.use('/signup', async (req, res) => {
    const uid = req.body.uid

    console.log("UID" + uid)


    // make a new collection with the user id/token as the name
    createCollection(uid, dbname)

    // create a api doc

    // return status code
    res.status(200).json({"message": "Sign up succesful!. Collection Created."})
})

// run the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
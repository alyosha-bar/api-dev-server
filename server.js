const express = require('express')
const cors = require('cors');
const port = 3000;
const app = express()
require('dotenv').config()
const mongoose = require('mongoose')

const TokenSchema = require('./models/tokenInfo')
const {updateToken} = require('./controllers/token')

const ApiSchema = require('./models/api')


// firebase set up
const admin = require("firebase-admin");
var serviceAccount = require("./firebase/api-dev-auth-firebase-adminsdk-mwlnx-70a08bf9d2.json");
const { MongoClient } = require('mongodb');


const url = process.env.MONGO_DB_URI

const client = new MongoClient(url)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


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

    const id = req.params.id

    // search in API doc from the Collection (ID)
    // return the apis info
    const dbName = 'usage';      // Database name
    
    try {
        // Connect to the MongoDB server
        await client.connect();
        
        // Access the database and collection
        const db = client.db(dbName);
        const collection = db.collection(id);  // Collection name based on uid

        // Query the collection for the document with the specific _id
        const document = await collection.findOne({ _id: "apis" });

        // If the document is found, return it
        if (document) {
            res.status(200).json(document);
        } else {
        // If no document is found
            res.status(404).json({ message: 'Document not found' });
        }

    } catch (err) {
        console.error('Error querying collection:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        // Optionally, close the client connection if not using pooling
        await client.close();
    }
    



    // const rightDoc = [];

    // try {
    //     const usersCollection = db.collection(id);
    //     const snapshot = await usersCollection.get();

    // if (snapshot.empty) {
    //     console.log("No data found.")
    //     res.status(404).json({"message": "You have no APIs Registered."});
    //     return;
    // }

    // snapshot.forEach(doc => {
    //     if (doc.id === 'apis') {  // Check if the document ID is "apis"
    //         const docData = { id: doc.id, ...doc.data() };  // Combine the ID and document data
    //         rightDoc.push(docData);  // Push it into the array or handle it as needed
    //         console.log(docData);  // Log the document data
    //     }
    // });
    
    
    // console.log(rightDoc[0].names)
    // console.log(rightDoc[0].descriptions)
    // // res.status(200).json(users);
    // } catch (error) {
    //     console.error('Error fetching users:', error);
    //     res.status(500).send('Error fetching users');
    // }

    // res.json(rightDoc[0])
})


async function createCollection(uid, dbName) {
    try {
      // Connect to the MongoDB server
      await client.connect();
      
      // Select the database
      const db = client.db(dbName);
      
      // Create a collection with the user ID or token as the name
      await db.createCollection(uid);
      
      console.log(`Collection created with name: ${uid}`);
    } catch (err) {
      console.error('Error creating collection:', err);
    }
}

app.use('/signup', async (req, res) => {
  const uid = req.body.uid;
  const dbName = 'usage';  // Database name

  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  console.log("UID: " + uid);

  // Create a collection dynamically based on UID
  await createCollection(uid, dbName);

  // Insert a document into the newly created collection
  try {
    // Select the database and collection
    const db = client.db(dbName);
    const collection = db.collection(uid); // Collection named after UID

    // Document to insert --> make it empty by defaut.
    const doc = {
      _id: "apis",
      names: [],  // Example names
      descriptions: [],  // Example descriptions
      limits: [],  // Example limits
      createdAt: new Date()  // Add a timestamp
    };

    const tokenDoc = {
      _id: "tokenInfo",
      userVersion: 0,
      userToken: "",
      revoked: false, 
    }

    // Insert the document into the collection
    const result = await collection.insertOne(doc);
    const anotherResult = await collection.insertOne(tokenDoc)


    console.log('Document inserted:', result.insertedId);
    console.log('Document inserted:', anotherResult.insertedId);

    // Send success response
    res.status(201).json({ message: 'Sign up successful! Collection and document created.', doc });
  } catch (err) {
    console.error('Error inserting document into collection:', err);
    res.status(500).json({ message: 'Server error' });
  }
})


app.use('/generateApiInfo', async (req, res) => {
  const {uid, name, limit, description} = req.body

  console.log(name)
  console.log(limit)
  console.log(description)


  // save to db
  console.log("Adding to APIs!");
  
    try {
      // Connect to the MongoDB client
      await client.connect();
  
      // Access the specific database
      const db = client.db('usage');
      
      // Access the specific collection based on the user ID
      const collection = db.collection(uid); // Use uid to specify the correct collection
  
      // Update the tokenInfo document in the collection for the given user
      const updatedApiInfo = await collection.updateOne(
        { _id: 'apis' },  // Ensure this matches the actual document in the collection
        { $push: {
          names: name,
          descriptions: description,
          limits: limit
        }
      });   // Use $set with the object containing the fields to update
  
      if (updatedApiInfo.modifiedCount === 0) {
        return res.status(404).send('Token info not found or already updated');
      }
  
      // Return the token
      res.status(200).json({ "message": "Insert Successful!" });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    } finally {
      // Close the MongoDB connection when done
      await client.close();
    }
})



// Function to dynamically get the collection based on the user ID
function getTokenModelByUserId(userId) {
  // Check if a model for this userId already exists
  if (mongoose.modelNames().includes(userId)) {
    // If it exists, return the existing model
    console.log('here')
    return mongoose.model(userId);
  }

  // If it doesn't exist, create a new model and return it
  return mongoose.model(userId, TokenSchema, userId);
}


// async function updateToken(req, res) {
//   console.log("Generating Token!");

//   try {
//     const uid = req.body.uid;
//     const version = 1; // Ensure you're getting the secret from the request
    
//     const data = `${uid}:${version}`;

//     // Generate token using HMAC
//     const token = createHmac('sha256', secret).update(data).digest('hex');

//     // Connect to the MongoDB client
//     await client.connect();

//     // Access the specific database
//     const db = client.db('usage');
    
//     // Access the specific collection based on the user ID
//     const collection = db.collection(uid); // Use uid to specify the correct collection

//     // New data to update
//     const updateData = {
//       userVersion: version,
//       userToken: token
//     };

//     console.log(updateData);

//     // Update the tokenInfo document in the collection for the given user
//     const updatedTokenInfo = await collection.updateOne(
//       { _id: 'tokenInfo' },  // Ensure this matches the actual document in the collection
//       { $set: updateData }   // Use $set with the object containing the fields to update
//     );

//     if (updatedTokenInfo.modifiedCount === 0) {
//       return res.status(404).send('Token info not found or already updated');
//     }

//     // Return the token
//     res.status(200).json({ "token": token });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send('Server Error');
//   } finally {
//     // Close the MongoDB connection when done
//     await client.close();
//   }
// }



// generate token route


app.use('/generate', updateToken)

app.use('/regenerate', async (req, res) => {



  res.status(200).json({"message": "Invalidated Old Token. Generated New Token."})
})

app.use('/invalidate', async (req, res) => {


  res.status(200).json({"message": "Invalidated Token"})
})


// run the server
mongoose.connect(url).then( () => {
  // listen for requests
  app.listen(port, () => {
      console.log('Connected to DB & Listening on port', port)
  })
}).catch( (err) => {
  console.log(err)
})

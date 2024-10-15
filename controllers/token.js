const { createHmac } = require('node:crypto') 
const { MongoClient } = require('mongodb');
const secret = process.env.SECRET_KEY;
const url = process.env.MONGO_DB_URI

const client = new MongoClient(url)

async function updateToken(req, res) {
    console.log("Generating Token!");
  
    try {
      const uid = req.body.uid;
      const version = 1; // Ensure you're getting the secret from the request
      
      const data = `${uid}:${version}`;
  
      // Generate token using HMAC
      const token = createHmac('sha256', secret).update(data).digest('hex');
  
      // Connect to the MongoDB client
      await client.connect();
  
      // Access the specific database
      const db = client.db('usage');
      
      // Access the specific collection based on the user ID
      const collection = db.collection(uid); // Use uid to specify the correct collection
  
      // New data to update
      const updateData = {
        userVersion: version,
        userToken: token
      };
  
      console.log(updateData);
  
      // Update the tokenInfo document in the collection for the given user
      const updatedTokenInfo = await collection.updateOne(
        { _id: 'tokenInfo' },  // Ensure this matches the actual document in the collection
        { $set: updateData }   // Use $set with the object containing the fields to update
      );
  
      if (updatedTokenInfo.modifiedCount === 0) {
        return res.status(404).send('Token info not found or already updated');
      }
  
      // Return the token
      res.status(200).json({ "token": token });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    } finally {
      // Close the MongoDB connection when done
      await client.close();
    }
  }
  
module.exports = {
    updateToken
}
// classic requires
require('dotenv').config();
const cors = require('cors');
const express = require('express');

// auth
const KJUR = require('jsrsasign');

// db
const { Pool } = require('pg');

// encoding
const jwt = require('jsonwebtoken')
const secret = process.env.SECRET;

const app = express();

// middleware
app.use(express.json())
// Enable CORS for all routes
app.use(cors({
  origin: 'https://api-track.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
},
{
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));


// move to authentication
// Middleware to check if the user is authenticated
function authenticateToken(req, res, next) {
  // Check if the Authorization header is present and has the format 'Bearer <token>'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from header

  if (!token) {
      return res.status(401).json({ message: 'Token is missing or invalid' });
  }

  // Verify the token using the secret key
  jwt.verify(token, process.env.AUTH_SECRET, (err, user) => {
      if (err) {
          return res.status(403).json({ message: 'Forbidden: Invalid token' });
      }

      // Store the user information in request object (optional)
      req.user = user;
      next(); // Proceed to the next middleware or route handler
  });
}



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

// routes

// unprotected route

// generate user information in NEON as well
// move to authentication
app.post('/generate-token', (req, res) => {

  console.log("Making token.")

  const uid = req.body.uid

  // Generate the token, for example using jwt
  const token = generateJWT(uid); // Replace this with your token generation logic

  // Send the token in the response
  res.json({ token });
});

// move to authentication
app.post('/generate-user-token', (req, res) => {
  console.log("making USER token")

  res.status(200).json({"token": "testtesttokentoken"})
})


const generateJWT = (userId) => {
  const secret = process.env.AUTH_SECRET
  const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expires in 1 hour
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const token = KJUR.jws.JWS.sign("HS256", JSON.stringify(header), JSON.stringify(payload), secret);

  return token
}


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
// user token
// app.use('/regenerate', async (req, res) => {})
// app.use('/invalidate', async (req, res) => {})

// api token --> could combine with above
// regenerate
// invalidate 


// move to utils
// make into a decorator or middleware?
const getDBID = async (uid) => {
  const id_query = 'SELECT id FROM Users WHERE uid = $1';
  
  try {
    const result = await pool.query(id_query, [uid]);

    if (result.rows.length === 0) {
      return -1; // No matching UID found
    }

    const db_id = result.rows[0].id; // Get the ID from the first row
    return db_id;
  } catch (error) {
    console.error('Error executing query', error);
    return -1; // Return -1 in case of an error
  }
}

// move to api
// all user apis
app.use('/home/:id', authenticateToken, async (req, res) => {

    const id = req.params.id
    // console.log(id)
    // get id which references uid
      
      getDBID(id)
      .then( async (id) => {
        try {
          // fetch all from APIs where uid = Users.uid
          const query = 'SELECT * FROM api WHERE user_id = $1'

          result = await pool.query(query, [id])

          // console.log(result.rows)
          res.status(200).json({"apis": result.rows})
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: 'Server error' });
        }
      })

      
})

// move to api
// generate an api (INCLUDING TOKEN GENERATION)
app.use('/generateApiInfo', authenticateToken, async (req, res) => {
  const uid = req.body.uid;
  const name = req.body.name;
  const description = req.body.description;
  const limit = req.body.limit;
  
  // generate the token from the api name.
  console.log("Generating Token!");

  const version = 1; // Ensure you're getting the secret from the request
  const data = { name, version }; // perchance change from name to the api id --> DO NOT HAVE ACCESS TO API ID.

  // Generate token using HMAC --> change to JWT
  // const token = createHmac('sha256', secret).update(data).digest('hex');

  // console.log(data)

  const token = jwt.sign(data, secret)
  console.log(token)

  // insert into DB
  getDBID(uid)
  .then( async (id) => {
    try {
      // fetch all from APIs where uid = Users.uid
      if (id === -1) {
        res.status(500).json({"message": "no active account."})
      }
  
      const query = 'INSERT INTO api (token, version, name, description, user_id, limitreq) VALUES ($1, $2, $3, $4, $5, $6);'
  
      console.log("HERE IS BLUDY ID: " + id)
      result = await pool.query(query, [token, version, name, description, id, limit])

      res.status(200).json({
        "message": "successful api insert",
        "token": token
      })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' });
    }
  })
})

// move to api
// get analytics for specific API
app.use('/trackinfo/:id', authenticateToken,  async (req, res) => {
  const api_id = req.params.id;

  // fetch info from database
  try {

    const query = 'SELECT ap.name, ap.description, ap.limitreq, au.start_date, au.end_date, au.total_req, au.errorcount FROM api_usage au INNER JOIN api ap ON au.api_id = ap.id WHERE au.api_id = $1 ORDER BY au.start_date ASC;'

    result = await pool.query(query, [api_id])

    if (result.rows === undefined) {
      res.status(400).json({"message": "Invalid API id."})
    }
    // console.log(result.rows)
    res.status(200).json(result.rows)
  } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Server error' });
  }

})

// USER ROUTES
// signup places some info into DB
// move to authentication
app.use('/signup', authenticateToken, async (req, res) => {
    const uid = req.body.uid;

    console.log("creating user token based on uid" + uid)



    const email = req.body.email;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const username = req.body.username;


    console.log("YOYOYO")

    if (!uid) {
      return res.status(400).json({ message: 'UID is required' });
    }
  
    console.log("UID: " + uid);
  
    // Create a collection dynamically based on UID
    try {

      // insert the user record
      console.log("inserting a user")

      // Insert into a table called 'users' with columns 'name' and 'age'
      const query = 'INSERT INTO Users (uid, email, firstname, lastname, username) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      const values = [uid, email, firstname, lastname, username];
      
      // Execute query
      const result = await pool.query(query, values);
  
      // Send success response
      res.status(201).json({ message: 'Sign up successful! DB record created.'});
    } catch (err) {
      console.error('Error inserting document into collection:', err);
      res.status(500).json({ message: 'Server error' });
    }
})

// account route
// move to authentication
app.use('/account/:uid', authenticateToken, async (req, res) => {
  const uid = req.params.uid
  
  console.log("account info.")

  getDBID(uid)
  .then( async (id) => {
    try {
      // fetch all from APIs where uid = Users.uid
      if (id === -1) {
        res.status(500).json({"message": "no active account."})
      }
  
      const query = 'SELECT firstname, lastname, email, uid, token, username FROM users WHERE id = $1'
  
      console.log("HERE IS BLUDY ID: " + id)
      result = await pool.query(query, [id])
  
      console.log(result.rows)
      res.status(200).json(result.rows)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' });
    }
  })  
})


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

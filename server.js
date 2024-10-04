const express = require('express')
const cors = require('cors');
const port = 3000;
const app = express()

app.use(express.json())

// Enable CORS for all routes
app.use(cors());

app.use( (req, res, next) => {
    next()
})

// routes
app.use('/home', (req, res) => {

    console.log("getting test data")


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
        {
            "id": 8,
            "title": "Weather API",
            "description": "API that provides weather data, including current conditions, forecasts, historical data, and weather alerts."
        },
        {
            "id": 9,
            "title": "Firebase API",
            "description": "API to access Firebase services, offering tools for real-time databases, authentication, hosting, and push notifications."
        },
        {
            "id": 10,
            "title": "GitHub API",
            "description": "API for interacting with GitHub repositories, enabling actions like repository management, pull requests, and issue tracking."
        },
        {
            "id": 11,
            "title": "Twilio API",
            "description": "API for SMS, voice, and video communication services, enabling messaging and call integration within applications."
        },
        {
            "id": 12,
            "title": "YouTube Data API",
            "description": "API to retrieve and manage YouTube content such as videos, channels, and playlists, and to integrate YouTube features into apps."
        },
        {
            "id": 13,
            "title": "Amazon S3 API",
            "description": "API for Amazon's Simple Storage Service (S3), providing scalable object storage for data and media file hosting."
        } 
    ]

    res.json(testData)
})

app.use('/login', async (req, res) => {
    console.log("Logging in...")
    console.log(req.body)
    
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
    const email = req.body.Email
    const pass = req.body.Password

    // hash the password


    // save to db


    // return status code
    console.log(`Email: ${email} : Password: ${pass}`)
    res.status(200).json({"message": "Sign up succesful!"})
})

// run the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
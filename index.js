const express = require('express');
const cors = require('cors');
//jwt token
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//From mongodb atlas database connection.....
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oxkzx.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        // console.log('Database Connected!');
        const partsCollection = client.db('manufacturer_site').collection('parts');
        //review collection
        const reviewsCollection = client.db('manufacturer_site').collection('reviews');
        //user collection
        const userCollection = client.db('manufacturer_site').collection('users');

        //creating api
        //get all parts
        app.get('/part', async (req, res) => {
            const query = {};//get all parts
            const cursor = partsCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        })
        //get all reviews
        app.get('/review', async (req, res) => {
            const query = {};//get all reviews
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        //for user authentication
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to manufacturer website!')
})

app.listen(port, () => {
    console.log(`Server app listening on port ${port}`);
})
const express = require('express');
const cors = require('cors');
//jwt token
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//From mongodb atlas database connection.....
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oxkzx.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//verify jwt....................
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        // console.log(decoded);
        next();
    });
}



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
        //get single part
        app.get('/part/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const part = await partsCollection.findOne(query);
            res.send(part);
        })

        //add new parts or products
        app.post('/part', async (req, res) => {
            const newProduct = req.body;
            const result = await partsCollection.insertOne(newProduct);
            res.send(result);
        })

        //get all reviews
        app.get('/review', async (req, res) => {
            const query = {};//get all reviews
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        //all users
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        //to check status...if found admin then send true otherwise send false
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

        //role for user .....admin
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email; //from verifyJWT-----decoded.email
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
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

        //add new review
        app.post('/review', async (req, res) => {
            const newReview = req.body;
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
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
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");


const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4muq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
    }

    try {
        const decodedUser = await admin.auth().verifyIdToken(token);
        console.log(decodedUser);
        req.decodedEmail = decodedUser.email;
    }
    catch {

    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db("doctorsDb");
        const appointCollections = database.collection("appointment");
        const userCollections = database.collection("users");

        // Get appointments api
        app.get('/appointments', async (req, res) => {
            const email = req.query.email;
            const date = req.query.date;

            const query = { email: email, date: date };

            const cursor = appointCollections.find(query);
            const appointments = await cursor.toArray();
            res.send(appointments)
        });

        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointCollections.insertOne(appointment);
            res.json(result)
        });

        // user post api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollections.insertOne(user);

            res.send(result)
        });
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollections.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // add admin role to user api
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            console.log('PUT', req.decodedEmail);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await userCollections.updateOne(filter, updateDoc);
            res.json(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollections.findOne(query);
            let isAdmin = false;
            if (result?.role === 'admin') {
                isAdmin = true;
            };
            res.send({ admin: isAdmin });
        })

    }
    catch {
        // await client.close();
    }
}
run().catch(console.dir)





app.get('/', (req, res) => {
    res.send('Welcome to doctors portal');
});
app.listen(port, () => {
    console.log('listening port at', port)
})
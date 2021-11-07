const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4muq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("doctorsDb");
        const appointCollections = database.collection("appointment");

        app.post('/appointments', async (req, res) => {
            const appointment = req.body;
            const result = await appointCollections.insertOne(appointment);
            console.log(result);
            res.json(result)
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
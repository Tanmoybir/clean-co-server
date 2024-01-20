const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

// middleWare
app.use(cors())
app.use(express.json())
app.use(cookieParser())

const secret = 'veryveryscretamikaokadivona'

// user:clean-co 
// pass:u6gEMp6PVGpoJsI0

const uri = "mongodb+srv://clean-co:u6gEMp6PVGpoJsI0@cluster0.xmlybhe.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('clean-co').collection('services')
        const bookingCollection = client.db('clean-co').collection('bookings')

        const gateman = (req,res,next) => {
            const {token} = req.cookies
            // console.log(token);

            if(!token) {
                return res.status(401).send({message:"you are not authorize"})
            }

            jwt.verify(token, secret, function(err, decoded) {
                if(err){
                    return res.status(401).send({message:"you are not authorize"})
                }
                req.user = decoded
                // console.log(decoded);
                next()
              });
        }

        app.get('/api/v1/services',gateman, async (req, res) => {
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/api/v1/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.findOne(query)
            res.send(result)
        })
       
        app.post('/api/v1/user/create-booking', async (req, res) => {
            const booking = req.body
            // console.log(booking);
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })

        // user specific booking

        app.get('/api/v1/user/booking',gateman, async (req, res) => {
            const queryEmail = req.query.email
            const tokenEmail = req.user.email
            // console.log(queryEmail);
            if(queryEmail !== tokenEmail) {
                return res.status(403).send({message: 'Forbidden Access'})
            }
            let query = {}
            if(queryEmail) {
                query.email = queryEmail
            }
            const result = await bookingCollection.find(query).toArray()
                res.send(result)         
        })

        app.delete('/api/v1/user/cancel-booking/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })


        app.post('/api/v1/auth/access-token', (req, res) => {
            // creating token and send to client
            const user = req.body
            const token = jwt.sign(user, secret)
            // console.log(token);
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: false
            }).send({ success: true })
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello World War')
})

app.listen(port, () => {
    console.log(`clean-co-server is running on port ${port}`);
})
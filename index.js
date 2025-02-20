const express = require('express')
const app = express()
const cors = require("cors");
const jwt = require("jsonwebtoken");
require('dotenv').config()
const port = process.env.PORT || 8000

app.use(express.json());
app.use(cors());
// MONGODB STARTS

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.zpuvg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const taskDb = client.db("task_now");
    const usersCollection = taskDb.collection("users");  
    const tasksCollection = taskDb.collection("task");  
//    crud operation starts here  --


// Create Jwt Token 
app.post('/jwt' , async(req, res) => {
  const user = req.body
  const token = jwt.sign(user, process.env.JWT_TOKEN , 
    {expiresIn: "365d",
  })
  console.log(token)
res.send(token)
})

// verify Token 
const verifyToken = (req, res, next) => {
  if(!req.headers.authorization) {
    return res.status(401).send({message : 'unauthorized access'}) 
  }

  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token , process.env.JWT_TOKEN , (err , decoded) => {
    if(err) {
      return res.status(401).send({message : 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  } )

}

// Add User Collections -  

app.post('/users' , async(req,res) => {
  const users = req.body;
  const query = {email : users.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser) {
    return res.send({message : 'user already exists'})
  }
  const result = await usersCollection.insertOne(users)
  res.send(result)
})



// Add Task Collections
app.post('/task' ,verifyToken, async(req, res) => {
  const task = req.body
  const result = await tasksCollection.insertOne(task)
  res.send(result)
})

//    crud operation ends here  --
  } finally {
 
  }
}
run().catch(console.dir);

// MONGODB ENDS


app.get('/' , ( res) => {
    res.send('Task Managment Server is running')
})
app.listen(port ,() => {
    console.log(`Runnig Port is ${port}`)
})
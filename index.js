const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());
// MONGODB STARTS

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.zpuvg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const taskDb = client.db("task_now");
    const usersCollection = taskDb.collection("users");
    const tasksCollection = taskDb.collection("task");
    //    crud operation starts here  --

    // Create Jwt Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "365d",
      });
      res.send(token);
    });

    // verify Token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Add User Collections -

    app.post("/users", async (req, res) => {
      const users = req.body;
      const query = { email: users.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    // Add Task Collections
    app.post("/task", verifyToken, async (req, res) => {
      const task = req.body;
      const result = await tasksCollection.insertOne(task);
      res.send(result);
    });

    // Get  Speacipic User All Task using email
    app.get("/task-email",verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await tasksCollection.find(query).toArray();
      res.send(result);
    });
    // Get Speacipic User Task using email
    app.get("/task-id/:id",verifyToken, async (req, res) => {
      const id = req.params.id
     
      const filter = {_id : new ObjectId(id)}
      const result = await tasksCollection.findOne(filter)
      res.send(result)
    });

    // Update Speacipic User Task Patch 

     app.patch("/task-update/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const bodyData = req.body;
      const updatedDoc = {
        $set: {
          title: bodyData.title,
          category: bodyData.category,
          description: bodyData.description,
         
        },
      };
      const result = await tasksCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // React DND Status Update Patch Api

    app.patch("/task-status/:id", verifyToken, async (req, res) => {
      const taskId = req.params.id;
      const { status } = req.body;
    
      try {
        const filter = { _id: new ObjectId(taskId) };
        const updateDoc = {
          $set: {
            status: status,
          },
        };
    
        const result = await tasksCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).send({ message: "Failed to update task status" });
      }
    });
    

    // Delete Speacipic User Task using email

    app.delete("/task-delete/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await tasksCollection.deleteOne(filter);
      res.send(result);
    });

    //    crud operation ends here  --
  } finally {
  }
}
run().catch(console.dir);

// MONGODB ENDS

app.get("/", (res) => {
  res.send("Task Managment Server is running");
});
app.listen(port, () => {
  console.log(`Runnig Port is ${port}`);
});

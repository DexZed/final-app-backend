 // index.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { MongoClient, ServerApiVersion } from "mongodb";
import cookieParser from 'cookie-parser';
import setupSessionRoutes from "./session.js";
import verifyToken from './middleware.js';
import userRoutes from './users.js';
import donationsRoutes from './donations.js';
import postRoutes from './blog.js';
// Load environment variables
dotenv.config();

const app = express();

// Firebase Admin Initialization



// MongoDB Initialization

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



// Middleware
const allowedDomains = ['http://localhost:5173', 'https://anotherdomain.com'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, server-to-server)
      if (!origin || allowedDomains.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// Custom Morgan Logger
morgan.token('body', (req) => JSON.stringify(req.body, null, 2));
morgan.token('statusColor', (_, res) => {
  const status = res.statusCode;
  if (status >= 500) return '\x1b[31m'; // Red
  if (status >= 400) return '\x1b[33m'; // Yellow
  if (status >= 300) return '\x1b[36m'; // Cyan
  if (status >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m';  // Reset
});

app.use(
  morgan(
    (tokens, req, res) =>
      `${tokens.method(req, res)} ${tokens.url(req, res)}\n` +
      `  ${tokens.statusColor(req, res)}Status: ${tokens.status(req, res)}\x1b[0m\n` +
      `  Body: ${tokens.body(req, res) || 'None'}`
  )
);

// Routes
app.get('/', (req, res) => {
  res.json({ message: '🚀 Express Server Running!' });
});

async function run() {
    await client.connect();
    await client.db("final").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    const database = client.db("final");
    const sessionCollection = database.collection("sess");
    const userCollection = database.collection("users");
    const donationCollection = database.collection("donations");
    const postCollection = database.collection("posts");
    app.use("/api", setupSessionRoutes(sessionCollection, verifyToken));
    app.use("/api", userRoutes(userCollection, verifyToken));
    app.use("/api", donationsRoutes(donationCollection, verifyToken));
    app.use("/api", postRoutes(postCollection, verifyToken));
  }

run()








// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server is running on http://localhost:${PORT}`);
});

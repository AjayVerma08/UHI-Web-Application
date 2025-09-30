import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import prcessRoute from './routes/process.js';
import authenticateRoute from './routes/authorize.js';
import reportRoute from './routes/report.js';
import ee from "@google/earthengine";
import fs from "fs";

const app = express();
app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const port = process.env.PORT;
const private_key = process.env.GEE_PRIVATE_KEY;
let projectId = process.env.PROJECT_ID;

app.use(express.json());
app.get('/health', (req, res)=> {
    res.status(200).send('ok');
})
app.use('/auth', authenticateRoute);
app.use("/process", prcessRoute);
app.use('download', reportRoute);

async function initializeEE() {
  try {
    const serviceAccountKey = JSON.parse(fs.readFileSync(private_key, "utf8"));
    projectId = serviceAccountKey.project_id;

    await new Promise((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(
        serviceAccountKey,
        () => resolve(),
        (error) => reject(new Error(`Authentication failed: ${error}`))
      );
    });
    
    await new Promise((resolve, reject) => {
      ee.initialize(
        null,
        null,
        () => resolve(),
        (error) => reject(new Error(`Initialization failed: ${error}`)),
        projectId
      );
    });

    console.log('✅ Earth Engine initialized successfully');
    console.log('📊 Project ID:', projectId);
  } catch (error) {
    console.error('❌ Earth Engine initialization failed:', error.message);
    throw error;
  }
}

async function startServer() {
    try {
        await initializeEE();
        app.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        })
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
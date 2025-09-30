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
    const serviceAccountKey = process.env.GEE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GEE_SERVICE_ACCOUNT_KEY)
    : JSON.parse(fs.readFileSync(private_key, "utf8"));
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
        console.log('🔧 Initializing Earth Engine...');
        await initializeEE();
        console.log('✅ Earth Engine ready');
        
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        });

        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error('Stack trace:', error.stack);
        // Don't exit - start server anyway for health checks
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`⚠️  Server running on port ${port} (without Earth Engine)`);
        });
    }
}

startServer();
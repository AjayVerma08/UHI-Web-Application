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
    let serviceAccountKey;
    
    console.log('📋 Checking for GEE credentials...');
    
    // Check if GEE credentials are in environment variable (for production)
    if (process.env.GEE_SERVICE_ACCOUNT_KEY) {
      console.log('🔑 Found GEE_SERVICE_ACCOUNT_KEY in environment');
      try {
        serviceAccountKey = JSON.parse(process.env.GEE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Successfully parsed GEE credentials');
        console.log('📊 Project ID from key:', serviceAccountKey.project_id);
      } catch (parseError) {
        console.error('❌ Failed to parse GEE_SERVICE_ACCOUNT_KEY:', parseError.message);
        throw parseError;
      }
    } 
    // Otherwise read from file (for local development)
    else if (private_key && fs.existsSync(private_key)) {
      serviceAccountKey = JSON.parse(fs.readFileSync(private_key, "utf8"));
      console.log('✅ Using GEE credentials from file');
    } 
    // No credentials found
    else {
      throw new Error('No Google Earth Engine credentials found');
    }
    
    projectId = projectId;
    console.log('🔐 Authenticating with Earth Engine...');

    // Add timeout to authentication
    await Promise.race([
      new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
          serviceAccountKey,
          () => {
            console.log('✅ Authentication successful');
            resolve();
          },
          (error) => {
            console.error('❌ Authentication failed:', error);
            reject(new Error(`Authentication failed: ${error}`));
          }
        );
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout after 10s')), 10000)
      )
    ]);
    
    console.log('🌍 Initializing Earth Engine...');
    
    // Add timeout to initialization
    await Promise.race([
      new Promise((resolve, reject) => {
        ee.initialize(
          null,
          null,
          () => {
            console.log('✅ Initialization successful');
            resolve();
          },
          (error) => {
            console.error('❌ Initialization failed:', error);
            reject(new Error(`Initialization failed: ${error}`));
          },
          projectId
        );
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout after 10s')), 10000)
      )
    ]);

    console.log('✅ Earth Engine fully initialized');
    console.log('📊 Using Project ID:', projectId);
    
  } catch (error) {
    console.error('❌ Earth Engine initialization failed:', error.message);
    console.error('Stack:', error.stack);
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
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import companyRoutes from './routes/company.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler } from './middlewares/errorHandler';
import { seedSuperAdmin } from './utils/seed';
import { migrateCompanyStatus } from './utils/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/joblink';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
.then(() => {
  seedSuperAdmin(); // Seed SuperAdmin after successful connection
  migrateCompanyStatus(); // Migrate existing companies to new status fields
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  console.error('MongoDB URI used:', MONGO_URI);
});

// Middleware
const allowedOrigins = [
  'https://job-platform-lake.vercel.app',
  'https://job-platform-lake.vercel.app/',
  'http://localhost:3000',
  'http://localhost:3001'
];

// CORS configuration - more robust setup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Request with no origin - allowing');
      return callback(null, true);
    }
    
    console.log('Checking origin:', origin);
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle OPTIONS preflight requests explicitly
app.options('*', (req, res) => {
  console.log('OPTIONS preflight request received for:', req.path);
  console.log('Origin:', req.headers.origin);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.status(204).end();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for debugging
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  console.log('Request origin:', req.headers.origin);
  console.log('Request headers:', req.headers);
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    allowedOrigins: allowedOrigins,
    origin: req.headers.origin,
    headers: req.headers,
    message: 'CORS should be working now'
  });
});

// Simple test endpoint for CORS debugging
app.get('/api/test', (req, res) => {
  console.log('Test endpoint requested');
  console.log('Request origin:', req.headers.origin);
  
  res.json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// CORS test endpoint with POST method
app.post('/api/test-cors', (req, res) => {
  console.log('POST test endpoint requested');
  console.log('Request origin:', req.headers.origin);
  console.log('Request body:', req.body);
  
  res.json({ 
    message: 'POST CORS test successful',
    origin: req.headers.origin,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Comprehensive debugging middleware for all environments
app.use((req, res, next) => {
  console.log(`=== REQUEST DEBUG ===`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Origin: ${req.headers.origin}`);
  console.log(`User-Agent: ${req.headers['user-agent']}`);
  console.log(`Authorization: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  console.log(`Content-Type: ${req.headers['content-type']}`);
  console.log(`=====================`);
  
  next();
});

// Swagger setup
const swaggerOptions = {
definition: {
  openapi: '3.0.0',
  info: {
    title: 'Job-Link Platform API',
    version: '1.0.0',
    description: 'API documentation for the Job-Link Platform backend',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{
    bearerAuth: [],
  }],
},
apis: [
  path.join(__dirname, 'routes', '*.ts'),
  path.join(__dirname, 'routes', '*.js'),
  path.join(__dirname, 'models', '*.ts'),
  path.join(__dirname, 'models', '*.js')
], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Debug: Log the generated spec to see if paths are included
console.log('Swagger spec paths:', Object.keys((swaggerSpec as any).paths || {}));

// Serve the JSON specification separately
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

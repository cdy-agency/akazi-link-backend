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
import employerRoutes from './routes/employer.routes';
import housekeeperRoutes from './routes/housekeeper.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middlewares/errorHandler';
import { seedSuperAdmin } from './utils/seed';
import { migrateCompanyStatus } from './utils/seed';
import publicFlyerRes from './routes/publicFlyer.route'

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
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

console.log(process.env.FRONTEND_URL)
// Body parsing middleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ limit: '10mb', extended: true })); 


// Debug middleware for development
// if (process.env.NODE_ENV !== 'production') {
//   app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin} - Authorization: ${req.headers.authorization ? 'Present' : 'Missing'}`);
//     // next();
//   });
// }

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
app.use('/api/employers', employerRoutes);
app.use('/api/housekeepers', housekeeperRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/flyer', publicFlyerRes)

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

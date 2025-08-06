import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import companyRoutes from './routes/company.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middlewares/errorHandler';
import { seedSuperAdmin } from './utils/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/joblink';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
.then(() => {
  console.log('MongoDB connected successfully');
  seedSuperAdmin(); // Seed SuperAdmin after successful connection
})
.catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

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
apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
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

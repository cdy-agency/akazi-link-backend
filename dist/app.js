"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const seed_1 = require("./utils/seed");
const seed_2 = require("./utils/seed");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/joblink';
// Connect to MongoDB
mongoose_1.default.connect(MONGO_URI)
    .then(() => {
    console.log('MongoDB connected successfully');
    (0, seed_1.seedSuperAdmin)(); // Seed SuperAdmin after successful connection
    (0, seed_2.migrateCompanyStatus)(); // Migrate existing companies to new status fields
})
    .catch((err) => console.error('MongoDB connection error:', err));
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        path_1.default.join(__dirname, 'routes', '*.ts'),
        path_1.default.join(__dirname, 'routes', '*.js'),
        path_1.default.join(__dirname, 'models', '*.ts'),
        path_1.default.join(__dirname, 'models', '*.js')
    ], // Path to the API docs
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Debug: Log the generated spec to see if paths are included
console.log('Swagger spec paths:', Object.keys(swaggerSpec.paths || {}));
// Serve the JSON specification separately
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Routes
app.use('/api', public_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/employee', employee_routes_1.default);
app.use('/api/company', company_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api', users_routes_1.default); // provides /api/users with admin protection
// Error handling middleware
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

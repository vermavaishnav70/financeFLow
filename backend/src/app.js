const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { env } = require('./config/env');
const { prisma } = require('./config/prisma');
const { swaggerSpec } = require('./config/swagger');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { requestId } = require('./middleware/requestId');
const { errorHandler } = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// Route imports
const authRoutes = require('./routes/auth.routes');
const auditRoutes = require('./routes/audit.routes');
const userRoutes = require('./routes/user.routes');
const recordRoutes = require('./routes/record.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Trust the first proxy so express-rate-limit can see the X-Forwarded-For IP address
app.set('trust proxy', 1);

// --- Global Middleware ---
app.use(helmet());
app.use(requestId);
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(ApiError.forbidden('CORS origin not allowed'));
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(generalLimiter);

// --- Swagger Docs ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FinanceFlow API Docs',
}));

// --- Health Check ---
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  const status = dbStatus === 'healthy' ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    success: status === 'healthy',
    statusCode,
    message: 'FinanceFlow API is running',
    data: {
      status,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// --- API Routes ---
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;

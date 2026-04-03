require('dotenv').config();
const app = require('./src/app');
const { env } = require('./src/config/env');
const logger = require('./src/utils/logger');

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`🚀 FinanceFlow server running on port ${PORT}`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health:   http://localhost:${PORT}/api/v1/health`);
  logger.info(`🌍 Env:      ${env.NODE_ENV}`);
});

/* istanbul ignore file */
import createServer from './http/server.js';
import './services/mqtt/SensorsService.js';
import './services/cron/CleanExpiredRental.js';
import './services/cron/dailyResetUsage.js';
import './services/cron/deviceLimitEnforcer.js';
import setupSwagger from './utils/swagger.js';

const app = createServer();
setupSwagger(app);

// Middleware jika rute tidak ditemukan (404)
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Rute tidak ditemukan',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

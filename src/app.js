/* istanbul ignore file */
import createServer from './http/server.js';
import './services/mqtt/SensorsService.js';
import './services/cron/CleanExpiredRental.js';

const app = createServer();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

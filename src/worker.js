/* istanbul ignore file */
import './services/mqtt/SensorsService.js';
import './services/cron/CleanExpiredRental.js';
import './services/cron/dailyResetUsage.js';
import './services/cron/deviceLimitEnforcer.js';
import './services/cron/detectRentalEnd.js';
import './services/cron/cleanExpiredExtensions.js';

console.log('Worker started: MQTT subscriber and cron jobs are running.');

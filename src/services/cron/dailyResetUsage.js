import cron from 'node-cron';
import pkg from 'pg';

const { Pool } = pkg;
const pool = new Pool();

cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Reset log pemakaian harian perangkat...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await pool.query(`
      DELETE FROM device_usage_logs
      WHERE end_time IS NOT NULL AND end_time < $1;

    `, [today]);
    await this._pool.query(`UPDATE devices 
      SET first_session_flag = FALSE`);

    console.log('[Cron] Reset log harian berhasil.');
  } catch (err) {
    console.error('[Cron] Gagal mereset log:', err);
  }
});

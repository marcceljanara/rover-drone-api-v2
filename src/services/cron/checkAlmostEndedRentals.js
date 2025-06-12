/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import cron from 'node-cron';
import pkg from 'pg';
import ProducerService from '../rabbitmq/ProducerService.js';

const { Pool } = pkg;
const pool = new Pool();

async function checkAndNotifyAlmostEndedRentals() {
  const client = await pool.connect();

  try {
    const now = new Date();
    const fourteenDaysLater = new Date(now);
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);

    const query = `
      SELECT r.id, r.user_id, r.end_date, u.username, u.email, u.fullname
      FROM rentals r
      JOIN users u ON u.id = r.user_id
      WHERE r.rental_status = 'active'
        AND r.end_date >= $1
        AND r.end_date <= $2
    `;

    const result = await client.query(query, [now, fourteenDaysLater]);

    if (result.rowCount > 0) {
      console.log(`[${now.toISOString()}] Found ${result.rowCount} rental(s) ending within 14 days`);

      for (const rental of result.rows) {
        const payload = {
          to: rental.email,
          subject: 'Masa Sewa Akan Berakhir',
          type: 'almost-end',
          data: {
            fullname: rental.fullname,
            username: rental.username,
            rentalId: rental.id,
            endDate: rental.end_date,
          },
        };

        await ProducerService.sendMessage('rental:almost-end', JSON.stringify(payload));
        console.log(`→ Notification queued for rental ${rental.id} (${rental.username})`);
      }
    } else {
      console.log(`[${now.toISOString()}] No rentals ending in the next 14 days.`);
    }
  } catch (err) {
    console.error('❌ Error in checkAndNotifyAlmostEndedRentals:', err);
  } finally {
    client.release();
  }
}

// Cron schedule: Setiap hari jam 00:10
cron.schedule('10 0 * * *', () => {
  console.log('⏰ Running task: check rentals ending in 14 days');
  checkAndNotifyAlmostEndedRentals();
});

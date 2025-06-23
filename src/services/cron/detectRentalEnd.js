/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import cron from 'node-cron';
import pkg from 'pg';
import { nanoid } from 'nanoid';
import ProducerService from '../rabbitmq/ProducerService.js';

const { Pool } = pkg;
const pool = new Pool();

async function checkAndMarkEndedRentals() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const now = new Date();
    // Ambil rental yg belum pernah dinotifikasi
    const { rows: rentals } = await client.query(`
      SELECT id, user_id, end_date
      FROM rentals
      WHERE rental_status = 'active'
        AND end_date < $1
      FOR UPDATE
    `, [now]);

    for (const rental of rentals) {
      // update status + flag dalam satu transaksi
      await client.query(`
        UPDATE rentals
        SET rental_status = 'awaiting-return'
        WHERE id = $1
      `, [rental.id]);

      const { rows: [user] } = await client.query(
        'SELECT username, email, fullname FROM users WHERE id = $1',
        [rental.user_id],
      );

      const { rows: [addr] } = await client.query(`
        SELECT id FROM user_addresses
        WHERE user_id = $1 AND is_default AND NOT is_deleted
        ORDER BY created_at ASC
        LIMIT 1
      `, [rental.user_id]);

      await client.query(`
        INSERT INTO return_shipping_info (
          id, rental_id, pickup_address_id, status, pickup_method
        ) VALUES ($1, $2, $3, 'requested', 'pickup')
      `, [`return-${nanoid(10)}`, rental.id, addr?.id ?? null]);

      if (user) {
        const payload = {
          to: user.email,
          subject: 'Masa Sewa Perangkat Telah Selesai',
          type: 'awaiting-return',
          data: {
            fullname: user.fullname,
            username: user.username,
            rentalId: rental.id,
            endDate: rental.end_date,
          },
        };
        await ProducerService.sendMessage('rental:awaitingreturn', JSON.stringify(payload));
      }
    }

    await client.query('COMMIT');
    console.log(`[${now.toISOString()}] Processed ${rentals.length} rental(s)`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error in rental return checker:', err);
  } finally {
    client.release();
  }
}

cron.schedule('5 0 * * *', () => {
  console.log('⏰ Running task: check ended rentals & notify users');
  checkAndMarkEndedRentals();
}, { timezone: 'Asia/Jakarta' });

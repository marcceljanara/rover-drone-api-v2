import cron from 'node-cron';
import pkg from 'pg';
import { nanoid } from 'nanoid'; // gunakan nanoid untuk ID unik

import ProducerService from '../rabbitmq/ProducerService.js';

const { Pool } = pkg;
const pool = new Pool();

async function checkAndMarkEndedRentals() {
  const client = await pool.connect();

  try {
    const now = new Date();

    const query = `
      UPDATE rentals
      SET rental_status = 'awaiting-return'
      WHERE rental_status = 'active'
        AND end_date < $1
      RETURNING id, user_id, end_date;
    `;

    const result = await client.query(query, [now]);

    if (result.rowCount > 0) {
      console.log(`[${now.toISOString()}] Updated ${result.rowCount} rental(s) to 'awaiting-return'`);

      await Promise.all(result.rows.map(async (rental) => {
        const userRes = await client.query('SELECT username, email, fullname FROM users WHERE id = $1', [rental.user_id]);
        const user = userRes.rows[0];

        // Ambil alamat pengiriman awal dari tabel user_addresses
        //  (misalnya berdasarkan rental_id, atau default address user)
        const addrRes = await client.query(`
    SELECT id FROM user_addresses 
    WHERE user_id = $1 AND is_default = TRUE AND is_deleted = FALSE
    ORDER BY is_primary DESC, created_at ASC 
    LIMIT 1
  `, [rental.user_id]);

        const pickup_address_id = addrRes.rows[0]?.id || null;

        // Insert ke return_shipping_info
        const returnId = `return-${nanoid(10)}`;
        await client.query(`
    INSERT INTO return_shipping_info (
      id, rental_id, pickup_address_id, status, pickup_method
    ) VALUES ($1, $2, $3, 'requested', 'pickup')
  `, [returnId, rental.id, pickup_address_id]);

        console.log(`→ Created return_shipping_info for rental ${rental.id}`);

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
          console.log(`→ Email notification queued for ${user.username}`);
        }
      }));
    } else {
      console.log(`[${now.toISOString()}] No rentals ended today.`);
    }
  } catch (err) {
    console.error('❌ Error in rental return checker:', err);
  } finally {
    client.release();
  }
}

// Cron schedule: setiap hari jam 00:05
cron.schedule('5 0 * * *', () => {
  console.log('⏰ Running task: check ended rentals & notify users');
  checkAndMarkEndedRentals();
});

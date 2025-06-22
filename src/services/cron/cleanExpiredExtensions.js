/* eslint-disable import/no-extraneous-dependencies */
import cron from 'node-cron';
import pkg from 'pg';
import ProducerService from '../rabbitmq/ProducerService.js';

const { Pool } = pkg;
const pool = new Pool();

// jalan tiap 10 detik
cron.schedule('*/10 * * * * *', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* 1️⃣  Ganti status perpanjangan yg pending > 1 hari → failed */
    const extFailRes = await client.query(`
      UPDATE rental_extensions
      SET    status      = 'failed',
             updated_at  = NOW()
      WHERE  status      = 'pending_payment'
        AND  created_at  < NOW() - INTERVAL '1 day'
      RETURNING id, rental_id
    `);

    if (extFailRes.rowCount === 0) {
      await client.query('COMMIT');
      return; // tak ada yg kedaluwarsa
    }

    console.log(`${extFailRes.rowCount} perpanjangan → failed`);

    const rentalIds = extFailRes.rows.map((r) => r.rental_id);

    /* 2️⃣  Update payments by rental_id */
    const payFailRes = await client.query(
      `
      UPDATE payments
      SET    payment_status = 'failed'
      WHERE  rental_id      = ANY($1::VARCHAR[])
        AND  payment_status = 'pending'
      `,
      [rentalIds],
    );

    if (payFailRes.rowCount) console.log(`${payFailRes.rowCount} payment → failed`);

    /* 3️⃣  Ambil email user & kirim notifikasi */
    const userRes = await client.query(
      `
      SELECT u.email, u.fullname, r.id AS rental_id
      FROM   rentals r
      JOIN   users   u ON u.id = r.user_id
      WHERE  r.id = ANY($1::VARCHAR[])
      `,
      [rentalIds],
    );

    const tasks = userRes.rows.map((u) => {
      const msg = {
        email: u.email,
        fullname: u.fullname,
        rentalId: u.rental_id,
      };
      return ProducerService.sendMessage('payment:failed', JSON.stringify(msg))
        .then(() => console.log(`Notifikasi dikirim ke ${u.email}`));
    });

    await Promise.all(tasks); // ✅ cepat & aman

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cron rental_extensions error:', err);
  } finally {
    client.release();
  }
});

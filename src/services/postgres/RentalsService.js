/* eslint-disable max-len */
import { nanoid } from 'nanoid';
import NotFoundError from '../../exceptions/NotFoundError.js';
import AuthorizationError from '../../exceptions/AuthorizationError.js';
import InvariantError from '../../exceptions/InvariantError.js';
import calculateRentalCost from '../../utils/calculatorUtils.js';
import pool from '../../config/postgres/pool.js';

class RentalsService {
  constructor() {
    this._pool = pool;
  }

  async changeStatusRental(id, rentalStatus) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN'); // Mulai transaksi

      // Update status rental terlebih dahulu
      const updateRentalQuery = {
        text: 'UPDATE rentals SET rental_status = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING id, rental_status',
        values: [rentalStatus, id],
      };
      const rentalResult = await client.query(updateRentalQuery);
      if (rentalResult.rowCount === 0) {
        throw new NotFoundError('rental tidak ditemukan');
      }

      // Jika status diubah menjadi 'active', perbarui rental_id pada devices
      if (rentalStatus === 'active') {
        const updateDeviceQuery = {
          text: `
            WITH cte AS (
              SELECT id
              FROM devices
              WHERE rental_id IS NULL AND is_deleted = FALSE
              LIMIT 1
            )
            UPDATE devices
            SET rental_id = $1, reserved_until = NULL, reserved_rental_id = NULL
            FROM cte
            WHERE devices.id = cte.id AND is_deleted = FALSE
            RETURNING devices.id, devices.rental_id;
          `,
          values: [id],
        };
        const deviceResult = await client.query(updateDeviceQuery);

        if (deviceResult.rowCount === 0) {
          throw new NotFoundError('Tidak ada perangkat yang dapat dihubungkan dengan rental ini');
        }
      }

      // Jika status diubah menjadi 'completed', hapus rental_id
      // pada devices dan set reserved fields ke NULL
      if (rentalStatus === 'completed') {
        const updateDeviceQuery = {
          text: 'UPDATE devices SET rental_id = NULL, reserved_until = NULL, reserved_rental_id = NULL WHERE rental_id = $1 AND is_deleted = FALSE',
          values: [id],
        };
        await client.query(updateDeviceQuery);
      }

      await client.query('COMMIT'); // Komit transaksi
      return rentalResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback transaksi jika terjadi kesalahan
      throw error;
    } finally {
      client.release(); // Lepaskan koneksi client
    }
  }

  async deleteRental(id) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN'); // Mulai transaksi

      // Cek apakah rental_status masih "active"
      const checkRentalStatusQuery = {
        text: 'SELECT rental_status FROM rentals WHERE id = $1 AND is_deleted = FALSE',
        values: [id],
      };
      const rentalStatusResult = await client.query(checkRentalStatusQuery);
      if (rentalStatusResult.rowCount === 0) {
        throw new NotFoundError('Rental tidak ditemukan');
      }

      const rentalStatus = rentalStatusResult.rows[0].rental_status;
      if (rentalStatus === 'active') {
        throw new InvariantError('Tidak dapat menghapus rental dengan status active');
      }

      // Hapus reservasi dari devices jika ada
      const clearDeviceReservationQuery = {
        text: `
          UPDATE devices
          SET reserved_until = NULL, reserved_rental_id = NULL
          WHERE reserved_rental_id = $1 AND is_deleted = FALSE
        `,
        values: [id],
      };
      await client.query(clearDeviceReservationQuery);

      // Update payments: jika masih pending, ubah menjadi failed
      const updatePaymentStatusQuery = {
        text: `
          UPDATE payments
          SET payment_status = 'failed'
          WHERE rental_id = $1 AND payment_status = 'pending'
        `,
        values: [id],
      };
      await client.query(updatePaymentStatusQuery);

      // Tandai rental sebagai terhapus
      const deleteRentalQuery = {
        text: 'UPDATE rentals SET is_deleted = TRUE WHERE id = $1 RETURNING id',
        values: [id],
      };
      const deleteResult = await client.query(deleteRentalQuery);

      await client.query('COMMIT'); // Komit transaksi
      return deleteResult.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback transaksi jika terjadi kesalahan
      throw error;
    } finally {
      client.release(); // Lepaskan koneksi client
    }
  }

  async addRental(userId, interval, role, sensorIds = []) {
    const client = await this._pool.connect(); // Dapatkan client dari pool untuk transaksi
    try {
      const id = `rental-${nanoid(6)}`;

      // Tentukan start_date dan end_date berdasarkan interval (bulan)
      const start_date = new Date(); // Waktu saat ini
      const end_date = new Date(start_date);
      end_date.setMonth(start_date.getMonth() + interval); // Tambah interval bulan

      // Validasi role
      if (role === 'admin') {
        throw new AuthorizationError('Admin tidak bisa melakukan aksi mengajukan rental');
      }

      await client.query('BEGIN'); // Mulai transaksi

      // Cek apakah ada perangkat yang tersedia
      const availableDeviceQuery = {
        text: `
          SELECT id FROM devices
          WHERE (rental_id IS NULL AND is_deleted = FALSE) 
            AND (reserved_until IS NULL OR reserved_until < NOW())
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `,
      };
      const availableDeviceResult = await client.query(availableDeviceQuery);

      if (availableDeviceResult.rowCount === 0) {
        throw new NotFoundError('Tidak ada perangkat yang tersedia untuk disewakan');
      }

      const deviceId = availableDeviceResult.rows[0].id;

      // Reservasi perangkat dengan TTL 1 hari
      const reserveDeviceQuery = {
        text: `
          UPDATE devices 
          SET reserved_until = NOW() + INTERVAL '1 day', reserved_rental_id = $2 
          WHERE id = $1
        `,
        values: [deviceId, id],
      };
      await client.query(reserveDeviceQuery);

      // Hitung durasi biaya rental
      const baseCost = calculateRentalCost(interval).finalCost;

      let sensorCost = 0;
      if (sensorIds.length > 0) {
        const sensorQuery = `
        SELECT cost FROM sensors
        WHERE id = ANY($1::text[])
      `;
        const sensorResult = await client.query(sensorQuery, [sensorIds]);
        sensorCost = sensorResult.rows.reduce((acc, { cost }) => acc + Number(cost), 0);
      }

      const totalCost = baseCost + sensorCost;

      // Tambahkan rental
      const rentalQuery = {
        text: `
          INSERT INTO rentals (id, user_id, start_date, end_date, cost, reserved_until) 
          VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 day') 
          RETURNING id, cost, start_date, end_date
        `,
        values: [id, userId, start_date, end_date, totalCost],
      };
      const rentalResult = await client.query(rentalQuery);

      const sensorInsertPromises = sensorIds.map((sensorId) => client.query(
        'INSERT INTO rental_sensors (rental_id, sensor_id) VALUES ($1, $2)',
        [id, sensorId],
      ));

      await Promise.all(sensorInsertPromises);

      // Tambahkan pembayaran terkait rental
      const paymentId = `payment-${nanoid(16)}`;
      const paymentQuery = {
        text: 'INSERT INTO payments (id, rental_id, amount) VALUES ($1, $2, $3)',
        values: [paymentId, rentalResult.rows[0].id, totalCost],
      };
      await client.query(paymentQuery);

      await client.query('COMMIT'); // Commit transaksi jika sukses
      rentalResult.rows[0].payment_id = paymentId;
      return rentalResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback jika ada kesalahan
      throw error;
    } finally {
      client.release(); // Selalu release client ke pool
    }
  }

  async getAllRental(role, userId) {
    if (role === 'admin') {
      const query = {
        text: `SELECT id, start_date, end_date, rental_status, cost 
               FROM rentals 
               WHERE is_deleted = FALSE`,
        values: [],
      };
      const result = await this._pool.query(query);
      return result.rows;
    }

    const query = {
      text: `SELECT id, start_date, end_date, rental_status, cost 
             FROM rentals 
             WHERE user_id = $1 AND is_deleted = FALSE`,
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getDetailRental(id, role, userId) {
    if (role === 'admin') {
      const query = {
        text: `SELECT *, start_date, end_date, reserved_until, created_at, updated_at 
               FROM rentals 
               WHERE id = $1 AND is_deleted = FALSE`,
        values: [id],
      };
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('rental tidak ditemukan');
      }
      return result.rows[0];
    }

    const query = {
      text: `SELECT *, start_date, end_date, reserved_until, created_at, updated_at 
             FROM rentals 
             WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
      values: [id, userId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('rental tidak ditemukan');
    }
    return result.rows[0];
  }

  async cancelRental({ userId, id, rentalStatus }, role) {
    if (role === 'admin') {
      throw new AuthorizationError('admin tidak bisa membatalkan pengajuan rental');
    }

    const client = await this._pool.connect();
    try {
      await client.query('BEGIN'); // Mulai transaksi

      // Update status rental
      const query = {
        text: 'UPDATE rentals SET rental_status = $1 WHERE id = $2 AND user_id = $3 AND is_deleted = FALSE RETURNING rental_status, id',
        values: [rentalStatus, id, userId],
      };
      const result = await client.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('rental tidak ditemukan');
      }

      // Hapus reservasi pada devices jika rental dibatalkan
      const clearDeviceReservationQuery = {
        text: `
          UPDATE devices 
          SET reserved_until = NULL, reserved_rental_id = NULL 
          WHERE reserved_rental_id = $1 AND is_deleted = FALSE
        `,
        values: [id],
      };
      await client.query(clearDeviceReservationQuery);

      await client.query('COMMIT'); // Komit transaksi jika berhasil
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback jika terjadi kesalahan
      throw error;
    } finally {
      client.release(); // Lepaskan koneksi client
    }
  }

  async getAllSensors() {
    const query = {
      text: `SELECT id, cost 
               FROM sensors`,
      values: [],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  // async upgradeRentalSensors(rentalId, newSensorIds) {
  //   const client = await this._pool.connect();
  //   try {
  //     await client.query('BEGIN');

  //     // Pastikan rental ada dan masih aktif
  //     const rentalCheck = await client.query(
  //       'SELECT id, cost FROM rentals WHERE id = $1 AND is_deleted = FALSE AND rental_status = $2',
  //       [rentalId, 'active'],
  //     );

  //     if (rentalCheck.rowCount === 0) {
  //       throw new NotFoundError('Rental tidak ditemukan atau sudah tidak aktif');
  //     }

  //     const existingSensorRows = await client.query(
  //       'SELECT sensor_id FROM rental_sensors WHERE rental_id = $1',
  //       [rentalId],
  //     );

  //     const existingSensorIds = existingSensorRows.rows.map((row) => row.sensor_id);
  //     const uniqueNewSensorIds = newSensorIds.filter((id) => !existingSensorIds.includes(id));

  //     if (uniqueNewSensorIds.length === 0) {
  //       throw new InvariantError('Sensor yang diajukan sudah terdaftar sebelumnya');
  //     }

  //     // Ambil biaya sensor baru dari tabel sensors
  //     const costResult = await client.query(
  //       'SELECT id, cost FROM sensors WHERE id = ANY($1::text[])',
  //       [uniqueNewSensorIds],
  //     );

  //     if (costResult.rowCount !== uniqueNewSensorIds.length) {
  //       throw new NotFoundError('Beberapa sensor tidak ditemukan');
  //     }

  //     const totalAdditionalCost = costResult.rows.reduce((sum, row) => sum + Number(row.cost), 0);

  //     // Tambahkan relasi rental-sensor
  //     const insertPromises = uniqueNewSensorIds.map((sensorId) => client.query(
  //       'INSERT INTO rental_sensors (rental_id, sensor_id) VALUES ($1, $2)',
  //       [rentalId, sensorId],
  //     ));
  //     await Promise.all(insertPromises);

  //     // Update total biaya sewa
  //     await client.query(
  //       'UPDATE rentals SET cost = cost + $1 WHERE id = $2',
  //       [totalAdditionalCost, rentalId],
  //     );

  //     // Tambahkan catatan tambahan biaya ke pembayaran
  //     const paymentId = `payment-${nanoid(16)}`;
  //     await client.query(
  //       'INSERT INTO payments (id, rental_id, amount) VALUES ($1, $2, $3)',
  //       [paymentId, rentalId, totalAdditionalCost],
  //     );

  //     await client.query('COMMIT');
  //     return { addedSensors: uniqueNewSensorIds, additionalCost: totalAdditionalCost, paymentId };
  //   } catch (err) {
  //     await client.query('ROLLBACK');
  //     throw err;
  //   } finally {
  //     client.release();
  //   }
  // }
}

export default RentalsService;

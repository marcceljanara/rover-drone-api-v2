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
    const shipmentId = `ship-${nanoid(15)}`; // atau pakai nanoid
    try {
      await client.query('BEGIN'); // Mulai transaksi
      // Ambil rental saat ini untuk validasi
      const currentRentalQuery = {
        text: 'SELECT rental_status FROM rentals WHERE id = $1 AND is_deleted = FALSE',
        values: [id],
      };
      const currentResult = await client.query(currentRentalQuery);
      if (currentResult.rowCount === 0) {
        throw new NotFoundError('Rental tidak ditemukan');
      }

      const currentStatus = currentResult.rows[0].rental_status;

      // Validasi status jika ingin mengganti menjadi 'completed'
      if (
        rentalStatus === 'completed'
      && !['pending', 'awaiting-return'].includes(currentStatus)
      ) {
        throw new InvariantError(
          `Rental hanya bisa diselesaikan jika status saat ini adalah 'pending' atau 'awaiting-return', status saat ini: '${currentStatus}'`,
        );
      }

      // Update status rental terlebih dahulu
      const updateRentalQuery = {
        text: 'UPDATE rentals SET rental_status = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING id, rental_status',
        values: [rentalStatus, id],
      };
      const rentalResult = await client.query(updateRentalQuery);

      // Jika status diubah menjadi 'active', perbarui rental_id pada devices
      // ...sebelumnya tetap
      if (rentalStatus === 'active') {
        // 1. Update device dan hubungkan ke rental
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

        // 2. Ambil shipping_address_id dari rental
        const rentalAddressQuery = {
          text: 'SELECT shipping_address_id FROM rentals WHERE id = $1',
          values: [id],
        };
        const addressResult = await client.query(rentalAddressQuery);
        const shippingAddressId = addressResult.rows?.[0]?.shipping_address_id;

        const courierQuery = {
          text: `
    SELECT courier_name, courier_service, etd
    FROM rental_shipping_infos
    WHERE rental_id = $1
  `,
          values: [id],
        };
        const { rows } = await client.query(courierQuery);
        const courier = rows[0];
        if (!courier) throw new NotFoundError('Ongkir belum tersedia untuk rental ini');

        const estimatedDeliveryDate = new Date();
        const estimatedShippingDate = new Date();
        estimatedShippingDate.setDate(estimatedShippingDate.getDate() + 2);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + courier.etd + 2); // Tambah 2 hari buffer

        // 3. Generate baris shipment_orders baru (default: waiting)

        const insertShipmentQuery = {
          text: `
    INSERT INTO shipment_orders (
      id, rental_id, shipping_address_id,
      courier_name, courier_service, shipping_status,
      estimated_delivery_date, estimated_shipping_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
          values: [
            shipmentId,
            id,
            shippingAddressId,
            courier.courier_name,
            courier.courier_service,
            'waiting',
            estimatedDeliveryDate,
            estimatedShippingDate,
          ],
        };

        await client.query(insertShipmentQuery);
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

      rentalResult.rows[0].shipmentId = shipmentId;
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

  async addRental(userId, interval, role, shippingAddressId, shippingInfo, sensorIds = ['temperature']) {
    const client = await this._pool.connect(); // Dapatkan client dari pool untuk transaksi
    try {
      const id = `rental-${nanoid(6)}`;
      const {
        shippingName, serviceName, shippingCost, etd,
      } = shippingInfo;

      // ✅ Normalisasi sensorIds di sini
      let normalizedSensorIds = Array.isArray(sensorIds) ? [...sensorIds] : [];

      if (!normalizedSensorIds.includes('temperature')) {
        normalizedSensorIds.unshift('temperature');
      }

      if (normalizedSensorIds.length === 0) {
        normalizedSensorIds = ['temperature'];
      }

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
      const setupCost = 1000000;
      if (normalizedSensorIds.length > 0) {
        const sensorQuery = `
        SELECT cost FROM sensors
        WHERE id = ANY($1::text[])
      `;
        const sensorResult = await client.query(sensorQuery, [normalizedSensorIds]);
        sensorCost = sensorResult.rows.reduce((acc, { cost }) => acc + Number(cost), 0);
      }

      // Tambahkan rental
      const rentalQuery = {
        text: `
    INSERT INTO rentals (
      id, user_id, start_date, end_date, reserved_until, shipping_address_id
    ) 
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 day', $5)
    RETURNING id, start_date, end_date
  `,
        values: [id, userId, start_date, end_date, shippingAddressId],
      };

      const rentalResult = await client.query(rentalQuery);

      const sensorInsertPromises = normalizedSensorIds.map((sensorId) => client.query(
        'INSERT INTO rental_sensors (rental_id, sensor_id) VALUES ($1, $2)',
        [id, sensorId],
      ));

      await Promise.all(sensorInsertPromises);

      // Tambahkan semua biaya terkait penyewaan
      const totalCost = baseCost + sensorCost + shippingCost + setupCost;
      const costQuery = {
        text: `
    INSERT INTO rental_costs (
      rental_id, base_cost, sensor_cost, shipping_cost, setup_cost, total_cost
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `,
        values: [id, baseCost, sensorCost, shippingCost, setupCost, totalCost],
      };
      await client.query(costQuery);
      await client.query({
        text: `
    INSERT INTO rental_shipping_infos (id, rental_id, courier_name, courier_service, etd)
    VALUES ($1, $2, $3, $4, $5)
  `,
        values: [`ship-info-${nanoid(10)}`, rentalResult.rows[0].id, shippingName, serviceName, parseInt(etd, 10)],
      });

      // Tambahkan pembayaran terkait rental
      const paymentId = `payment-${nanoid(16)}`;
      const paymentQuery = {
        text: 'INSERT INTO payments (id, rental_id, amount, payment_type) VALUES ($1, $2, $3, $4)',
        values: [paymentId, rentalResult.rows[0].id, totalCost, 'initial'],
      };

      await client.query(paymentQuery);

      await client.query('COMMIT'); // Commit transaksi jika sukses
      rentalResult.rows[0].payment_id = paymentId;
      rentalResult.rows[0].cost = totalCost;
      return rentalResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback jika ada kesalahan
      throw error;
    } finally {
      client.release(); // Selalu release client ke pool
    }
  }

  async getAllRental(role, userId) {
    let query;

    if (role === 'admin') {
      query = {
        text: `
        SELECT r.id, r.start_date, r.end_date, r.rental_status, rc.total_cost
        FROM rentals r
        LEFT JOIN rental_costs rc ON rc.rental_id = r.id
        WHERE r.is_deleted = FALSE
        ORDER BY r.created_at DESC
      `,
        values: [],
      };
    } else {
      query = {
        text: `
        SELECT r.id, r.start_date, r.end_date, r.rental_status, rc.total_cost
        FROM rentals r
        LEFT JOIN rental_costs rc ON rc.rental_id = r.id
        WHERE r.is_deleted = FALSE AND r.user_id = $1
        ORDER BY r.created_at DESC
      `,
        values: [userId],
      };
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getDetailRental(id, role, userId) {
    const baseQuery = `
    SELECT 
      r.*, 
      rc.total_cost, rc.base_cost, rc.sensor_cost, rc.shipping_cost, rc.setup_cost,
      ua.nama_penerima,
      ua.no_hp,
      CONCAT_WS(', ',
        ua.alamat_lengkap,
        ua.kelurahan,
        ua.kecamatan,
        ua.kabupaten_kota,
        ua.provinsi,
        ua.kode_pos
      ) AS full_address
    FROM rentals r
    LEFT JOIN rental_costs rc ON rc.rental_id = r.id
    LEFT JOIN user_addresses ua ON ua.id = r.shipping_address_id AND ua.is_deleted = FALSE
    WHERE r.id = $1 AND r.is_deleted = FALSE
  `;

    let query;
    if (role === 'admin') {
      query = { text: baseQuery, values: [id] };
    } else {
      query = {
        text: `${baseQuery} AND r.user_id = $2`,
        values: [id, userId],
      };
    }

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
      await client.query('BEGIN'); // ──⭢ mulai transaksi ───────────────

      /* 1. Update status rental */
      const rentalUpdateQuery = {
        text: `
        UPDATE rentals
        SET rental_status = $1
        WHERE id = $2
          AND user_id = $3
          AND is_deleted = FALSE
        RETURNING id, rental_status
      `,
        values: [rentalStatus, id, userId],
      };
      const rentalRes = await client.query(rentalUpdateQuery);

      if (rentalRes.rowCount === 0) {
        throw new NotFoundError('rental tidak ditemukan');
      }

      /* 2. Update status pembayaran → failed */
      const paymentUpdateQuery = {
        text: `
        UPDATE payments
        SET payment_status = 'failed' 
        WHERE rental_id   = $1
          AND is_deleted  = FALSE
      `,
        values: [id],
      };
      await client.query(paymentUpdateQuery);

      /* 3. Kosongkan reservasi device kalau ada */
      const clearDeviceReservationQuery = {
        text: `
        UPDATE devices
        SET reserved_until     = NULL,
            reserved_rental_id = NULL
        WHERE reserved_rental_id = $1
          AND is_deleted        = FALSE
      `,
        values: [id],
      };
      await client.query(clearDeviceReservationQuery);

      await client.query('COMMIT'); // ──⭢ commit jika semua OK ─────────
      return rentalRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK'); // ──⭢ batalkan bila ada error ────
      throw err;
    } finally {
      client.release(); // lepas koneksi pool
    }
  }

  async getAllSensors() {
    const query = {
      text: `SELECT id, cost 
               FROM sensors WHERE NOT id = 'temperature'`,
      values: [],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async extensionRental(userId, rentalId, interval, role) {
    if (role === 'admin') {
      throw new AuthorizationError('Admin tidak diperbolehkan mengajukan perpanjangan rental');
    }

    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      // Cek apakah rental dimiliki oleh user dan masih aktif
      const rentalCheck = await client.query(
        `
        SELECT id, end_date FROM rentals
        WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE AND rental_status = $3
      `,
        [rentalId, userId, 'active'],
      );

      if (rentalCheck.rowCount === 0) {
        throw new NotFoundError('Rental tidak ditemukan, tidak aktif, atau bukan milik Anda');
      }

      const currentEndDate = rentalCheck.rows[0].end_date;
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + interval);

      // Hitung biaya tambahan
      const additionalCost = calculateRentalCost(interval).finalCost;

      // Tambahkan ekstensi rental
      const extensionId = `ext-${nanoid(10)}`;
      const insertExtensionQuery = {
        text: `
        INSERT INTO rental_extensions (id, rental_id, duration_months, new_end_date, amount)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, new_end_date, status, amount
      `,
        values: [extensionId, rentalId, interval, newEndDate, additionalCost],
      };
      const extensionResult = await client.query(insertExtensionQuery);

      // Tambahkan biaya tambahan ke pembayaran
      const paymentId = `payment-${nanoid(16)}`;
      await client.query(
        'INSERT INTO payments (id, rental_id, amount, payment_type) VALUES ($1, $2, $3 , $4)',
        [paymentId, rentalId, additionalCost, 'extension'],
      );

      await client.query('COMMIT');
      return { ...extensionResult.rows[0], paymentId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async completeExtension(rentalId) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      // Ambil perpanjangan dengan status pending_payment
      const pendingResult = await client.query(
        'SELECT * FROM rental_extensions WHERE rental_id = $1 AND status = $2',
        [rentalId, 'pending_payment'],
      );
      const extension = await pendingResult.rows[0];
      // console.log(extension)
      if (!extension) {
        throw new NotFoundError('No pending extension found');
      }

      // Update tanggal akhir penyewaan
      await client.query(
        'UPDATE rentals SET end_date = $1 WHERE id = $2',
        [extension.new_end_date, rentalId],
      );

      // Tambahkan biaya extension ke total cost
      await client.query(
        'UPDATE rental_costs SET total_cost = total_cost + $1, updated_at = NOW() WHERE rental_id = $2',
        [extension.amount, rentalId],
      );

      // Tandai perpanjangan sebagai completed
      await client.query(
        'UPDATE rental_extensions SET status = $1, updated_at = NOW() WHERE id = $2',
        ['completed', extension.id],
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllRentalExtensions(rentalId, userId, role) {
    const values = [rentalId];
    let queryText = `
    SELECT re.id, re.duration_months, re.new_end_date, re.amount, 
           re.status, re.created_at, re.updated_at
    FROM rental_extensions re
    JOIN rentals r ON re.rental_id = r.id
    WHERE re.rental_id = $1
  `;

    if (role !== 'admin') {
      queryText += ' AND r.user_id = $2';
      values.push(userId);
    }

    queryText += ' ORDER BY re.created_at DESC';

    const query = {
      text: queryText,
      values,
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getRentalExtensionById(extensionId, userId, role) {
    const values = [extensionId];
    let queryText = `
    SELECT re.id, re.rental_id, re.duration_months, re.new_end_date, 
           re.amount, re.status, re.created_at, re.updated_at
    FROM rental_extensions re
    JOIN rentals r ON re.rental_id = r.id
    WHERE re.id = $1
  `;

    if (role !== 'admin') {
      queryText += ' AND r.user_id = $2';
      values.push(userId);
    }

    const query = {
      text: queryText,
      values,
    };

    const result = await this._pool.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError('Perpanjangan rental tidak ditemukan');
    }

    return result.rows[0];
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

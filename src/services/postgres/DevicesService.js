/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable import/no-extraneous-dependencies */
import json2csv from 'json2csv';
import { nanoid } from 'nanoid';
import NotFoundError from '../../exceptions/NotFoundError.js';
import pool from '../../config/postgres/pool.js';
import InvariantError from '../../exceptions/InvariantError.js';

class DevicesService {
  constructor() {
    this._pool = pool;
  }

  async addDevice() {
    const id = `device-${nanoid(6)}`;
    const mqttControlTopic = `control/${id}/${nanoid(10)}`;
    const mqttSensorTopic = `sensor/${id}/${nanoid(10)}`;
    const status = 'inactive'; // default

    const query = {
      text: 'INSERT INTO devices (id, status, sensor_topic, control_topic) VALUES ($1, $2, $3, $4) RETURNING id',
      values: [id, status, mqttSensorTopic, mqttControlTopic],
    };
    const result = await this._pool.query(query);
    return result.rows[0].id;
  }

  async deleteDevice(id) {
    const query = {
      text: `
        UPDATE devices 
        SET is_deleted = TRUE 
        WHERE id = $1 
          AND rental_id IS NULL 
          AND status != 'active'
        RETURNING id
      `,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError('device tidak ditemukan, masih terkait rental, atau masih aktif');
    }
    return result.rows[0];
  }

  async changeStatusDevice(id, status) {
    const query = {
      text: 'UPDATE devices SET status = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING id',
      values: [status, id],
    };
    const result = await this._pool.query(query);
    if (result.rowCount === 0) {
      throw new NotFoundError('device tidak ditemukan');
    }
    return result.rows[0];
  }

  async changeMqttSensor(id) {
    const mqttSensorTopic = `sensor/${id}/${nanoid(12)}`;
    const query = {
      text: 'UPDATE devices SET sensor_topic = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING id',
      values: [mqttSensorTopic, id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('device tidak ditemukan');
    }
    return result.rows[0];
  }

  async changeMqttControl(id) {
    const mqttControlTopic = `control/${id}/${nanoid(12)}`;
    const query = {
      text: 'UPDATE devices SET control_topic = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING id',
      values: [mqttControlTopic, id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('device tidak ditemukan');
    }
    return result.rows[0];
  }

  async getAllDevice(userId, role) {
    // Jika role adalah admin, user dapat mengakses semua device
    if (role === 'admin') {
      const query = {
        text: `
          SELECT 
            id, 
            rental_id, 
            status, 
            last_reported_issue, 
            TO_CHAR(
              make_interval(secs => last_active), 
              'DD "Hari" HH24:MI:SS'
            ) AS last_active
          FROM devices 
          WHERE is_deleted = FALSE
        `,
      };
      const result = await this._pool.query(query);
      return result.rows;
    }

    // Untuk user biasa, hanya akses device berdasarkan rental aktif miliknya
    const query = {
      text: `
        SELECT 
          devices.id, 
          devices.rental_id, 
          devices.status, 
          devices.last_reported_issue, 
          TO_CHAR(
            make_interval(secs => devices.last_active), 
            'DD "Hari" HH24:MI:SS'
          ) AS last_active
        FROM devices
        INNER JOIN rentals ON devices.rental_id = rentals.id
        WHERE rentals.user_id = $1 
          AND rentals.rental_status = 'active' 
          AND devices.is_deleted = FALSE
      `,
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getAvailableDevices() {
    const query = {
      text: `
          SELECT 
            id, 
            rental_id, 
            status, 
            last_reported_issue, 
            TO_CHAR(
              make_interval(secs => last_active), 
              'DD "Hari" HH24:MI:SS'
            ) AS last_active
          FROM devices
          WHERE rental_id IS NULL 
            AND is_deleted = FALSE
        `,
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getDevice(userId, role, deviceId) {
    // Default query untuk user biasa
    let query = {
      text: `
        SELECT 
          devices.*,
          devices.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS created_at, 
          TO_CHAR(
            make_interval(secs => devices.last_active), 
            'DD "Hari" HH24:MI:SS'
          ) AS last_active
        FROM devices
        INNER JOIN rentals ON devices.rental_id = rentals.id
        WHERE devices.id = $1 
          AND rentals.user_id = $2 
          AND rentals.rental_status = 'active' 
          AND devices.is_deleted = FALSE
      `,
      values: [deviceId, userId],
    };

    // Jika role adalah admin, gunakan query berbeda
    if (role === 'admin') {
      query = {
        text: `
          SELECT 
            *,
            devices.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS created_at, 
            TO_CHAR(
              make_interval(secs => last_active), 
              'DD "Hari" HH24:MI:SS'
            ) AS last_active
          FROM devices 
          WHERE id = $1 
            AND is_deleted = FALSE
        `,
        values: [deviceId],
      };
    }

    // Eksekusi query
    const result = await this._pool.query(query);

    // Validasi hasil query
    if (!result.rowCount) {
      throw new NotFoundError('Device tidak ditemukan');
    }

    // Kembalikan data device
    return result.rows[0];
  }

  async deviceControl(userId, role, { id, action }) {
    const logId = `log-${nanoid(6)}`;
    const status = action === 'on' ? 'active' : 'inactive';

    // Cek batas penggunaan harian hanya saat perangkat akan dinyalakan
    if (action === 'on') {
      await this._checkDailyUsageLimit(id);
    }

    let query;

    if (role === 'admin') {
      query = {
        text: `
        UPDATE devices 
        SET status = $1 
        WHERE id = $2 AND is_deleted = FALSE 
        RETURNING id, status, control_topic
      `,
        values: [status, id],
      };
    } else {
      query = {
        text: `
        UPDATE devices 
        SET status = $1 
        WHERE id = $2 
        AND rental_id IN (
          SELECT id FROM rentals WHERE user_id = $3 AND rental_status = 'active'
        )
        AND is_deleted = FALSE 
        RETURNING id, status, control_topic
      `,
        values: [status, id, userId],
      };
    }

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Device tidak ditemukan atau Anda tidak memiliki akses');
    }

    // Logging pemakaian perangkat
    if (action === 'on') {
      // Tutup sesi sebelumnya jika masih terbuka
      await this._pool.query(`
    UPDATE device_usage_logs
    SET end_time = NOW() AT TIME ZONE 'Asia/Jakarta'
    WHERE device_id = $1 AND end_time IS NULL
  `, [id]);

      // Buat sesi baru
      await this._pool.query(`
    INSERT INTO device_usage_logs (id, device_id, start_time)
    VALUES ($1, $2, NOW() AT TIME ZONE 'Asia/Jakarta')
  `, [logId, id]);
    }

    if (action === 'off') {
      await this._pool.query(`
    UPDATE device_usage_logs
    SET end_time = NOW() AT TIME ZONE 'Asia/Jakarta'
    WHERE id IN (
      SELECT id FROM device_usage_logs
      WHERE device_id = $1 AND end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    )
  `, [id]);
    }

    return result.rows[0];
  }

  async _checkDailyUsageLimit(deviceId) {
    const now = new Date();
    const todayStartJakarta = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );
    todayStartJakarta.setHours(0, 0, 0, 0);

    const { rows } = await this._pool.query(`
  SELECT 
    SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) AS total_hours,
    MAX(end_time) AS last_usage_end
  FROM device_usage_logs
  WHERE device_id = $1 
    AND start_time >= $2
`, [deviceId, todayStartJakarta]);

    const totalHours = parseFloat(rows[0].total_hours || 0);
    const lastEnd = rows[0].last_usage_end ? new Date(rows[0].last_usage_end) : null;

    // Aturan 1: maksimal 8 jam per hari
    if (totalHours >= 8) { // 8
      throw new InvariantError('Batas penggunaan perangkat 8 jam per hari telah tercapai');
    }
    // Aturan 2: jika sudah lebih dari 4 jam, wajib jeda 1 jam sebelum lanjut
    if (totalHours >= 4 && totalHours < 8 && lastEnd) {
      const nextAllowed = new Date(lastEnd.getTime() + 60 * 60 * 1000); // jeda 1 jam // 60 *60*1000
      if (now < nextAllowed) {
        throw new InvariantError(`Sesi ke-2 hanya dapat dimulai setelah pukul ${nextAllowed.toLocaleTimeString('id-ID')}`);
      }
    }
  }

  async getDevicesOverFirstSession() {
    const now = new Date();
    const todayStartJakarta = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );
    todayStartJakarta.setHours(0, 0, 0, 0);

    const { rows: logs } = await this._pool.query(`
    SELECT d.id AS device_id, dul.start_time, dul.end_time
    FROM devices d
    JOIN device_usage_logs dul ON d.id = dul.device_id
    WHERE d.status = 'active' AND dul.start_time >= $1 AND d.first_session_flag = FALSE
    ORDER BY d.id, dul.start_time
  `, [todayStartJakarta]);

    const deviceSessions = {};
    const result = [];

    for (const log of logs) {
      const deviceId = log.device_id;
      const start = new Date(log.start_time);
      const end = log.end_time ? new Date(log.end_time) : new Date(); // log masih aktif?

      if (!deviceSessions[deviceId]) {
        deviceSessions[deviceId] = {
          totalHours: 0,
          done: false,
        };
      }

      const session = deviceSessions[deviceId];
      if (session.done) continue;

      const durationHours = (end - start) / (1000 * 60 * 60); // convert ms to hours
      session.totalHours += durationHours;

      if (session.totalHours >= 4) {
        result.push(deviceId);
        session.done = true; // stop akumulasi untuk device ini
      }
    }

    return result;
  }

  async markFirstSessionHandled(deviceId) {
    await this._pool.query(`
    UPDATE devices
    SET first_session_flag = TRUE
    WHERE id = $1
  `, [deviceId]);
  }

  async getOverusedActiveDevices() {
    const now = new Date();
    const todayStartJakarta = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    );
    todayStartJakarta.setHours(0, 0, 0, 0);

    const result = await this._pool.query(`
  SELECT d.id
  FROM devices d
  JOIN (
    SELECT device_id, SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW() AT TIME ZONE 'Asia/Jakarta') - start_time)) / 3600) AS used_hours
    FROM device_usage_logs
    WHERE start_time >= $1
    GROUP BY device_id
  ) AS usage ON d.id = usage.device_id
  WHERE usage.used_hours >= 8 AND d.status = 'active'
`, [todayStartJakarta]);

    return result.rows.map((row) => row.id);
  }

  async getDailyUsedHours(deviceId) {
    const result = await this._pool.query(`
    SELECT 
      SUM(
        EXTRACT(EPOCH FROM (
          LEAST(
            COALESCE(end_time, (NOW() AT TIME ZONE 'Asia/Jakarta')), 
            (NOW() AT TIME ZONE 'Asia/Jakarta')::date + INTERVAL '1 day'
          ) - 
          GREATEST(
            start_time, 
            (NOW() AT TIME ZONE 'Asia/Jakarta')::date
          )
        )) / 3600
      ) AS used_hours
    FROM device_usage_logs
    WHERE device_id = $1 
      AND start_time < ((NOW() AT TIME ZONE 'Asia/Jakarta')::date + INTERVAL '1 day')
      AND COALESCE(end_time, (NOW() AT TIME ZONE 'Asia/Jakarta')) > (NOW() AT TIME ZONE 'Asia/Jakarta')::date
  `, [deviceId]);

    const rawValue = result.rows[0]?.used_hours;
    const usedHours = rawValue ? parseFloat(rawValue) : 0;

    // Jaga-jaga kalau hasil negatif karena log data tidak lengkap
    return Math.max(0, Number(usedHours.toFixed(3)));
  }

  async getSensorData(userId, role, deviceId, interval) {
    const client = await this._pool.connect();
    try {
      const intervalMap = {
        '15m': '15 minutes',
        '1h': '1 hour',
        '6h': '6 hours',
        '12h': '12 hours',
        '24h': '1 day',
        '7d': '7 days',
        '30d': '30 days',
        '60d': '60 days',
        '90d': '90 days',
      };
      const sqlInterval = intervalMap[interval];

      let queryText;
      let queryValues;

      if (role === 'admin') {
      // Admin: ambil semua kolom
        queryText = `
        SELECT *
        FROM sensordata
        WHERE device_id = $1
          AND timestamp >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') - INTERVAL '${sqlInterval}'
        ORDER BY timestamp DESC
      `;
        queryValues = [deviceId];
      } else {
      // User: Ambil rental_id
        const rentalRes = await client.query(`
        SELECT r.id AS rental_id
        FROM rentals r
        JOIN devices d ON r.id = d.rental_id
        WHERE r.user_id = $1 AND d.id = $2
      `, [userId, deviceId]);

        if (rentalRes.rowCount === 0) {
          throw new NotFoundError('Rental tidak ditemukan untuk user dan perangkat ini');
        }

        const rentalId = rentalRes.rows[0].rental_id;

        // Ambil sensor type
        const sensorTypeRes = await client.query(`
        SELECT s.id
        FROM rental_sensors rs
        JOIN sensors s ON rs.sensor_id = s.id
        WHERE rs.rental_id = $1
      `, [rentalId]);

        const allowedSensors = sensorTypeRes.rows.map((row) => row.id);

        // Susun kolom SELECT
        const selectedFields = ['timestamp', ...allowedSensors];

        queryText = `
        SELECT ${selectedFields.join(', ')}
        FROM sensordata
        WHERE device_id = $1
          AND timestamp >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') - INTERVAL '${sqlInterval}'
        ORDER BY timestamp DESC
      `;
        queryValues = [deviceId];
      }

      // Eksekusi query
      const dataRes = await client.query(queryText, queryValues);
      return dataRes.rows;
    } finally {
      client.release();
    }
  }

  async getSensorDataLimit(userId, role, deviceId, limit) {
    const client = await this._pool.connect();
    try {
      if (role === 'admin') {
      // Admin: ambil semua kolom
        const result = await client.query(`
        SELECT * 
        FROM sensordata 
        WHERE device_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `, [deviceId, limit]);

        return result.rows;
      }

      // User biasa: hanya kolom sensor yang disewa
      // 1. Ambil rental ID berdasarkan user dan device
      const rentalRes = await client.query(`
      SELECT r.id AS rental_id
      FROM rentals r
      JOIN devices d ON r.id = d.rental_id
      WHERE r.user_id = $1 AND d.id = $2
    `, [userId, deviceId]);

      if (rentalRes.rowCount === 0) {
        throw new NotFoundError('Rental tidak ditemukan untuk user dan perangkat ini');
      }

      const rentalId = rentalRes.rows[0].rental_id;

      // 2. Ambil sensor yang disewa
      const sensorTypeRes = await client.query(`
      SELECT s.id
      FROM rental_sensors rs
      JOIN sensors s ON rs.sensor_id = s.id
      WHERE rs.rental_id = $1
    `, [rentalId]);

      const allowedSensors = sensorTypeRes.rows.map((row) => row.id);

      // 3. Tentukan field yang akan dipilih
      const selectedFields = ['timestamp', ...allowedSensors];

      // 4. Ambil data dengan kolom yang diperbolehkan
      const dataRes = await client.query(`
      SELECT ${selectedFields.join(', ')}
      FROM sensordata
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [deviceId, limit]);

      return dataRes.rows;
    } finally {
      client.release();
    }
  }

  async getSensorDataDownload(userId, role, deviceId, interval) {
    const client = await this._pool.connect();
    try {
      const intervalMap = {
        '1h': '1 hour',
        '6h': '6 hours',
        '12h': '12 hours',
        '1d': '1 day',
        '7d': '7 days',
        '30d': '30 days',
        '60d': '60 days',
        '90d': '90 days',
        '180d': '180 days',
        '365d': '365 days',
      };

      const sqlInterval = intervalMap[interval];

      let queryText;
      let queryValues;
      let fields;

      if (role === 'admin') {
      // Admin: ambil semua kolom
        queryText = `
        SELECT *
        FROM sensordata
        WHERE device_id = $1
          AND timestamp >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') - INTERVAL '${sqlInterval}'
        ORDER BY timestamp DESC
      `;
        queryValues = [deviceId];
      } else {
      // Ambil rental ID terkait user & device
        const rentalRes = await client.query(`
        SELECT r.id AS rental_id
        FROM rentals r
        JOIN devices d ON r.id = d.rental_id
        WHERE r.user_id = $1 AND d.id = $2
      `, [userId, deviceId]);

        if (rentalRes.rowCount === 0) {
          throw new NotFoundError('Rental tidak ditemukan untuk user dan perangkat ini');
        }

        const rentalId = rentalRes.rows[0].rental_id;

        // Ambil tipe sensor yang disewa
        const sensorTypeRes = await client.query(`
        SELECT s.id
        FROM rental_sensors rs
        JOIN sensors s ON rs.sensor_id = s.id
        WHERE rs.rental_id = $1
      `, [rentalId]);

        const allowedSensors = sensorTypeRes.rows.map((row) => row.id);
        fields = ['timestamp', ...allowedSensors];

        // Buat query hanya dengan kolom yang diizinkan
        queryText = `
        SELECT ${fields.join(', ')}
        FROM sensordata
        WHERE device_id = $1
          AND timestamp >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') - INTERVAL '${sqlInterval}'
        ORDER BY timestamp DESC
      `;
        queryValues = [deviceId];
      }

      const result = await client.query(queryText, queryValues);
      if (result.rowCount === 0) {
        throw new NotFoundError('Data tidak ditemukan untuk perangkat ini');
      }

      const data = result.rows;

      // Generate CSV
      const csv = json2csv.parse(data);

      return csv;
    } finally {
      client.release();
    }
  }
}

export default DevicesService;

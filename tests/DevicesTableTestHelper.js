/* istanbul ignore file */
import pool from '../src/config/postgres/pool.js';

const DevicesTableTestHelper = {

  async addDevice({
    id = 'device-123', status = 'inactive', last_active = null, sensor_topic = 'sensor-123', control_topic = 'control-123',
  }) {
    const query = {
      text: 'INSERT INTO devices(id, status, last_active, sensor_topic, control_topic) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      values: [id, status, last_active, sensor_topic, control_topic],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async deleteDevice(id) {
    const query = {
      text: 'UPDATE devices SET is_deleted = TRUE WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async findDeviceById(id) {
    const query = {
      text: 'SELECT * FROM devices WHERE id = $1 AND is_deleted = FALSE',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  },

  async cleanTable() {
    await pool.query('DELETE FROM devices WHERE 1=1');
  },
};

export default DevicesTableTestHelper;

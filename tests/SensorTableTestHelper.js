/* istanbul ignore file */

import pool from '../src/config/postgres/pool.js';

function generateRandomSensor(min = 20, max = 40) {
  return (Math.random() * (max - min) + min).toFixed(2); // 2 desimal
}

const SensorTableTestHelper = {
  async addDataSensor({ sensorId = 'sensor-123', deviceId = 'device-123' }) {
    const temperature = generateRandomSensor(20, 40);
    const humidity = generateRandomSensor(40, 99);
    const lux = generateRandomSensor(1, 65535);
    const date = new Date();
    const timestamp = date.toISOString();

    const query = {
      text: 'INSERT INTO sensordata(id, device_id, timestamp, temperature, humidity, light_intensity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [sensorId, deviceId, timestamp, temperature, humidity, lux],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async findDataSensor(id) {
    const query = {
      text: 'SELECT * FROM sensordata WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE from sensordata WHERE 1=1');
  },
};

export default SensorTableTestHelper;

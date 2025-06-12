/* istanbul ignore file */
import pool from '../src/config/postgres/pool.js';

const RentalsTableTestHelper = {
  async findRentalById(id) {
    const query = {
      text: 'SELECT * FROM rentals WHERE id = $1 AND is_deleted = FALSE',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM rentals WHERE 1=1');
    await pool.query('DELETE FROM rental_sensors WHERE 1=1');
    await pool.query('DELETE FROM shipment_orders WHERE 1=1');
    await pool.query('DELETE FROM rental_shipping_infos WHERE 1=1');
    await pool.query('DELETE FROM rental_extensions WHERE 1=1');
  },

  async findRentalExtensionById(id) {
    const query = {
      text: 'SELECT * FROM rental_extensions WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  },

  async findRentalCostById(id) {
    const query = {
      text: 'SELECT * FROM rental_costs WHERE rental_id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  },
};
export default RentalsTableTestHelper;

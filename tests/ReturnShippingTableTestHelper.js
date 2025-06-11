/* istanbul ignore file */
import pool from '../src/config/postgres/pool.js';

const ReturnShippingTableTestHelper = {
  async addReturnShippingInfo({
    id = 'return-123',
    rental_id = 'rental-123',
    pickup_address_id = 'address-123',
    status = 'requested',
    pickup_method = 'pickup',
    courier_name = null,
    courier_service = null,
    tracking_number = null,
    notes = null,
  }) {
    const query = {
      text: `INSERT INTO return_shipping_info (
        id, rental_id, pickup_address_id, status, pickup_method, courier_name, courier_service, tracking_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      values: [id, rental_id, pickup_address_id, status,
        pickup_method, courier_name, courier_service, tracking_number, notes],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async findById(id) {
    const query = {
      text: 'SELECT * FROM return_shipping_info WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  },

  async cleanTable() {
    await pool.query('DELETE FROM return_shipping_info WHERE 1=1');
  },
};

export default ReturnShippingTableTestHelper;

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
  },
};

export default RentalsTableTestHelper;

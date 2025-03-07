/* istanbul ignore file */
import pool from '../src/config/postgres/pool.js';

const PaymentsTableTestHelper = {
  async findPaymentById(id) {
    const query = {
      text: 'SELECT * FROM payments WHERE id = $1 AND is_deleted = FALSE',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0];
  },

  async cleanTable() {
    await pool.query('DELETE FROM payments WHERE 1=1');
  },
};

export default PaymentsTableTestHelper;

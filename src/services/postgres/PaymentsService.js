import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import pool from '../../config/postgres/pool.js';

class PaymentsService {
  constructor() {
    this._pool = pool;
  }

  async getAllPayments() {
    const query = {
      text: 'SELECT id, rental_id, amount, payment_status from payments WHERE is_deleted = FALSE',
      values: [],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getDetailPayment(id) {
    const query = {
      text: 'SELECT * from payments WHERE id = $1 AND is_deleted = FALSE',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('pembayaran tidak ditemukan');
    }
    return result.rows[0];
  }

  async getUserByPaymentId(paymentId, transaction = null) {
    const query = {
      text: `
      SELECT r.user_id, u.email, u.fullname 
      FROM rentals r
      JOIN payments p ON p.rental_id = r.id
      JOIN users u ON u.id = r.user_id
      WHERE p.id = $1
      `,
      values: [paymentId],
    };
    const rental = transaction
      ? await transaction.query(query.text, query.values)
      : await this._pool.query(query);

    if (!rental.rows.length) {
      throw new NotFoundError('User not found for the payment.');
    }

    return rental.rows[0]; // Return user data
  }

  /**
   * Verifikasi pembayaran berdasarkan ID dan memperbarui data pembayaran.
   * @param {Object} payload - Objek berisi data pembayaran.
   * @param {Object} transaction - Opsi transaksi (untuk penggunaan di dalam transaksi database).
   * @returns {Object} - Data pembayaran yang telah diverifikasi.
   */
  async verificationPayment(payload, transaction = null) {
    const {
      id, paymentStatus, paymentMethod, transactionDescription,
    } = payload;

    // Periksa apakah pembayaran ada
    const checkQuery = {
      text: 'SELECT * FROM payments WHERE id = $1 AND is_deleted = FALSE',
      values: [id],
    };

    const checkResult = transaction
      ? await transaction.query(checkQuery.text, checkQuery.values)
      : await this._pool.query(checkQuery);

    if (checkResult.rowCount === 0) {
      throw new NotFoundError(`Pembayaran dengan ID ${id} tidak ditemukan`);
    }

    // Perbarui pembayaran
    const updateQuery = {
      text: `UPDATE payments
             SET payment_date = NOW(), payment_status = $1, payment_method = $2, transaction_description = $3
             WHERE id = $4
             RETURNING id, rental_id, payment_status`,
      values: [paymentStatus, paymentMethod, transactionDescription, id],
    };

    const updateResult = transaction
      ? await transaction.query(updateQuery.text, updateQuery.values)
      : await this._pool.query(updateQuery);

    if (updateResult.rowCount === 0) {
      throw new InvariantError('Gagal memperbarui pembayaran');
    }

    return updateResult.rows[0];
  }

  async deletePayment(id) {
    const query = {
      text: 'UPDATE payments SET is_deleted = TRUE WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('pembayaran tidak ditemukan');
    }
    return result.rows[0];
  }

  /**
   * Membuat transaksi baru.
   * @param {Function} callback - Fungsi callback yang menjalankan operasi di dalam transaksi.
   * @returns {any} - Hasil dari fungsi callback.
   */
  async transaction(callback) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default PaymentsService;

import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import AuthorizationError from '../../exceptions/AuthorizationError.js';
import pool from '../../config/postgres/pool.js';

class AdminsService {
  constructor() {
    this._pool = pool;
  }

  async registerUser({
    username, password, fullname, email,
  }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = `user-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO users (id, username, password, fullname, email, is_verified) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, username, hashedPassword, fullname, email, true],
    };

    const result = await this._pool.query(query);
    return result.rows[0].id;
  }

  async getAllUser(searchCondition, limit, offset) {
    const query = {
      text: `
          SELECT id, username, email, is_verified
          FROM users
          WHERE
            $1 = '' OR (
              username ILIKE $1 OR
              email ILIKE $1 OR
              id ILIKE $1
            )
          ORDER BY username ASC
          LIMIT $2 OFFSET $3;
        `,
      values: [searchCondition, limit, offset],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getCountData(searchCondition) {
    const query = {
      text: `
          SELECT COUNT(*) AS total_count
          FROM users
          WHERE
            $1 = '' OR (
              username ILIKE $1 OR
              email ILIKE $1 OR
              id ILIKE $1
            );
        `,
      values: [searchCondition],
    };
    const result = await this._pool.query(query);
    return parseInt(result.rows[0].total_count, 10);
  }

  async getDetailUser(id) {
    const query = {
      text: 'SELECT id, username, email, fullname, is_verified, otp_code, otp_expiry, role, created_at, updated_at FROM users WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('User tidak ditemukan');
    }
    return result.rows[0];
  }

  async checkIsAdmin(id) {
    const query = {
      text: 'SELECT role FROM users WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    // Periksa apakah user ditemukan
    if (!result.rowCount) {
      throw new NotFoundError('User tidak ditemukan');
    }

    // Periksa apakah user adalah admin
    if (result.rows[0].role === 'admin') {
      throw new AuthorizationError('Anda tidak diperbolehkan menghapus sesama admin');
    }
  }

  async deleteUser(id) {
    // Periksa apakah user yang akan dihapus adalah admin
    await this.checkIsAdmin(id);

    const query = {
      text: 'DELETE FROM users WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async changePasswordUser(id, newPassword, confPassword) {
    await this.checkIsAdmin(id);
    if (newPassword !== confPassword) {
      throw new InvariantError('Password dan Konfirmasi Password Tidak Cocok');
    }
    const salt = await bcrypt.genSalt(10);
    const hashNewPassword = await bcrypt.hash(newPassword, salt);
    const query = {
      text: 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      values: [hashNewPassword, id],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

export default AdminsService;

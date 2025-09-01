import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import AuthorizationError from '../../exceptions/AuthorizationError.js';
import pool from '../../config/postgres/pool.js';

class AdminsService {
  constructor(cacheService) {
    this._pool = pool;
    this._cacheService = cacheService;
  }

  async registerUser({
    username, password, fullname, email,
  }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = `user-${nanoid(16)}`;
    const providerId = `auth-${nanoid(16)}`;

    // Gunakan transaksi biar konsisten
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      // Insert ke users
      const userQuery = {
        text: `INSERT INTO users (id, username, fullname, email, is_verified) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        values: [userId, username, fullname, email, true],
      };
      const userResult = await client.query(userQuery);
      if (!userResult.rows.length) {
        throw new InvariantError('Gagal menambahkan user');
      }

      // Insert ke auth_providers
      const authQuery = {
        text: `INSERT INTO auth_providers (id, user_id, provider, provider_id, password) 
             VALUES ($1, $2, $3, $4, $5)`,
        values: [providerId, userId, 'local', username, hashedPassword],
      };
      await client.query(authQuery);

      await client.query('COMMIT');
      return userId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
    try {
      const result = await this._cacheService.get(`user:${id}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: 'SELECT id, username, email, fullname, is_verified, role, created_at, updated_at FROM users WHERE id = $1',
        values: [id],
      };
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('User tidak ditemukan');
      }
      await this._cacheService.set(`user:${id}`, JSON.stringify(result.rows[0]));
      return result.rows[0];
    }
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
    const client = await this._pool.connect();

    try {
    // Mulai transaction
      await client.query('BEGIN');

      // Periksa apakah user yang akan dihapus adalah admin
      await this.checkIsAdmin(id);

      // Hapus record di auth_providers
      await client.query('DELETE FROM auth_providers WHERE user_id = $1', [id]);

      // Hapus user dari tabel users
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id],
      );

      // Commit transaction
      await client.query('COMMIT');
      await this._cacheService.delete(`user:${id}`);
      return result.rows;
    } catch (err) {
    // Rollback jika ada error
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async changePasswordUser(id, newPassword, confPassword) {
    await this.checkIsAdmin(id);
    if (newPassword !== confPassword) {
      throw new InvariantError('Password dan Konfirmasi Password Tidak Cocok');
    }
    const salt = await bcrypt.genSalt(10);
    const hashNewPassword = await bcrypt.hash(newPassword, salt);
    const query = {
      text: 'UPDATE auth_providers SET password = $1 WHERE user_id = $2 RETURNING user_id',
      values: [hashNewPassword, id],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

export default AdminsService;

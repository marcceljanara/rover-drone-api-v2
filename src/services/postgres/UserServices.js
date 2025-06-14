import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import InvariantError from '../../exceptions/InvariantError.js';
import AuthenticationError from '../../exceptions/AuthenticationError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import pool from '../../config/postgres/pool.js';

class UserService {
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
      values: [id, username, hashedPassword, fullname, email, false],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan user');
    }
    return result.rows[0].id;
  }

  async checkExistingUser({ email, username }) {
    const query = {
      text: 'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      values: [username, email],
    };

    const result = await this._pool.query(query);
    if (result.rows.length > 0) {
      throw new InvariantError('Email atau username sudah terdaftar. Silakan gunakan email atau username lain.');
    }
  }

  async generateOtp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const query = {
      text: 'UPDATE users SET otp_code = $1, otp_expiry = NOW() + INTERVAL \'15 minutes\' WHERE email = $2 AND is_verified = FALSE RETURNING otp_code',
      values: [otp, email],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Email tidak ditemukan atau akun telah terverifikasi');
    }
    return otp;
  }

  async verifyOtp(email, otp) {
    const query = {
      text: 'SELECT otp_code, otp_expiry FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Email tidak ditemukan');
    }

    const { otp_code: storedOtp, otp_expiry: otpExpiresAt } = result.rows[0];

    if (otp !== storedOtp) {
      throw new AuthenticationError('Kode OTP salah');
    }

    if (new Date() > new Date(otpExpiresAt)) {
      throw new AuthenticationError('Kode OTP telah kadaluarsa');
    }

    const updateQuery = {
      text: 'UPDATE users SET is_verified = $1, otp_code = NULL, otp_expiry = NULL WHERE email = $2',
      values: [true, email],
    };

    await this._pool.query(updateQuery);
  }

  async addAddress(userId, {
    namaPenerima, noHp, alamatLengkap,
    provinsi, kabupatenKota, kecamatan, kelurahan, kodePos, isDefault,
  }) {
    const client = await this._pool.connect();
    const id = `address-${nanoid(5)}`;

    try {
      await client.query('BEGIN');

      if (isDefault) {
      // Reset semua alamat user yang sudah default ke false
        await client.query(
          `UPDATE user_addresses 
         SET is_default = false 
         WHERE user_id = $1`,
          [userId],
        );
      }

      const insertQuery = {
        text: `INSERT INTO user_addresses (
        id, user_id, nama_penerima, no_hp, alamat_lengkap, 
        provinsi, kabupaten_kota, kecamatan, kelurahan, kode_pos, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
        values: [
          id, userId, namaPenerima, noHp, alamatLengkap,
          provinsi, kabupatenKota, kecamatan, kelurahan, kodePos, isDefault,
        ],
      };

      const result = await client.query(insertQuery);

      await client.query('COMMIT');
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllAddress(userId) {
    const query = {
      text: 'SELECT id, nama_penerima, no_hp, alamat_lengkap, kelurahan, is_default FROM user_addresses WHERE user_id = $1 AND is_deleted = $2 ORDER BY updated_at DESC',
      values: [userId, false],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Belum ada alamat pengiriman!');
    }

    return result.rows;
  }

  async getDetailAddress(userId, id) {
    const query = {
      text: `SELECT id, nama_penerima, no_hp, alamat_lengkap, provinsi, kabupaten_kota, kecamatan, kelurahan, kode_pos, is_default 
      FROM user_addresses WHERE user_id = $1 AND id = $2 AND is_deleted = $3`,
      values: [userId, id, false],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengguna atau alamat tidak ditemukan');
    }

    return result.rows[0];
  }

  async updateAddress(userId, id, {
    namaPenerima, noHp, alamatLengkap,
    provinsi, kabupatenKota, kecamatan, kelurahan, kodePos, isDefault,
  }) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      // Jika ingin menjadikan alamat ini sebagai default
      if (isDefault) {
      // Reset semua alamat user lain agar bukan default
        await client.query(
          `UPDATE user_addresses 
         SET is_default = false 
         WHERE user_id = $1 AND id <> $2`,
          [userId, id],
        );
      }

      // Update alamat ini
      const result = await client.query(
        `UPDATE user_addresses
       SET 
         nama_penerima = $1,
         no_hp = $2,
         alamat_lengkap = $3,
         provinsi = $4,
         kabupaten_kota = $5,
         kecamatan = $6,
         kelurahan = $7,
         kode_pos = $8,
         is_default = $9,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11 AND is_deleted = $12
       RETURNING id`,
        [
          namaPenerima, noHp, alamatLengkap,
          provinsi, kabupatenKota, kecamatan, kelurahan,
          kodePos, isDefault, id, userId, false,
        ],
      );

      if (!result.rowCount) {
        throw new NotFoundError('Gagal memperbarui alamat. Alamat tidak ditemukan atau bukan milik user.');
      }

      await client.query('COMMIT');
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setDefaultAddress(userId, id) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      // Reset semua alamat user lain agar bukan default
      await client.query(
        `UPDATE user_addresses 
         SET is_default = false 
         WHERE user_id = $1 AND id <> $2`,
        [userId, id],
      );

      const result = await client.query(
        `UPDATE user_addresses
        SET 
        is_default = $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3 AND is_deleted = $4
        RETURNING id`,
        [true, id, userId, false],
      );
      if (!result.rowCount) {
        throw new NotFoundError('Gagal memperbarui alamat. Alamat tidak ditemukan atau bukan milik user.');
      }
      await client.query('COMMIT');
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAddress(userId, id) {
    const query = {
      text: `
        UPDATE user_addresses 
        SET is_deleted = $1
        WHERE user_id = $2 
          AND id = $3 AND is_deleted = $4 
        RETURNING id`,
      values: [true, userId, id, false],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus alamat. Alamat tidak ditemukan atau bukan milik user.');
    }
  }
}

export default UserService;

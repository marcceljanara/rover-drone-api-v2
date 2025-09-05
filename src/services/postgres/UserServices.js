/* eslint-disable no-useless-escape */
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import InvariantError from '../../exceptions/InvariantError.js';
import AuthenticationError from '../../exceptions/AuthenticationError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import pool from '../../config/postgres/pool.js';

function generateUsernameFromEmail(email) {
  const [localPart] = email.split('@'); // ambil bagian sebelum @
  const base = localPart.slice(0, 12); // ambil maksimal 12 char
  const randomNum = Math.floor(Math.random() * 1_000_000) // 0–999
    .toString()
    .padStart(6, '0'); // selalu 6 digit

  return base + randomNum;
}

class UserService {
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
        values: [userId, username, fullname, email, false],
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

  async registerOrLoginGoogle({
    email, fullname, googleId, aud,
  }) {
    const userId = `user-${nanoid(16)}`;
    const authId = `auth-${nanoid(16)}`;

    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const existingUser = await this.findByEmail(email);

      // Cek apakah sudah ada user dengan email ini
      if (aud !== process.env.GOOGLE_CLIENT_ID) {
        throw new AuthenticationError('Akun Google tidak valid');
      }

      // Cek apakah sudah ada auth_providers dengan provider_id Google
      const checkQuery = {
        text: `SELECT u.id, u.role, u.is_verified 
        FROM users u 
             JOIN auth_providers ap ON ap.user_id = u.id 
             WHERE ap.provider = $1 AND ap.provider_id = $2`,
        values: ['google', googleId],
      };
      const existing = await client.query(checkQuery);
      if (existing.rows.length) {
        await client.query('COMMIT');
        return existing.rows[0]; // Sudah ada user, langsung return
      }

      // Kalau email sudah ada → link ke akun lokal
      if (existingUser) {
        await client.query(
          `INSERT INTO auth_providers (id, user_id, provider, provider_id) 
     VALUES ($1, $2, $3, $4)`,
          [authId, existingUser.id, 'google', googleId],
        );
        await client.query('COMMIT');
        return {
          id: existingUser.id,
        };
      }

      const username = generateUsernameFromEmail(email);

      // Insert ke users
      await client.query(
        `INSERT INTO users (id, username, fullname, email, is_verified) 
       VALUES ($1, $2, $3, $4, $5)`,
        [userId, username, fullname, email, true],
      );

      // Insert ke auth_providers
      await client.query(
        `INSERT INTO auth_providers (id, user_id, provider, provider_id) 
       VALUES ($1, $2, $3, $4)`,
        [authId, userId, 'google', googleId],
      );

      await client.query('COMMIT');
      return { id: userId, role: 'user', is_verified: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async checkExistingEmail({ email }) {
    const query = {
      text: 'SELECT email FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);
    if (result.rows.length > 0) {
      throw new InvariantError('Email sudah terdaftar. Silakan gunakan email lain.');
    }
  }

  async checkExistingUsername({ username }) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);
    if (result.rows.length > 0) {
      throw new InvariantError('Username sudah terdaftar. Silakan gunakan username lain.');
    }
  }

  async findByEmail(email) {
    const query = {
      text: 'SELECT id from users WHERE email = $1',
      values: [email],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async generateOtp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const query = {
      text: `UPDATE auth_providers ap 
      SET otp_code = $1, otp_expiry = NOW() + INTERVAL \'15 minutes\'
      FROM users u 
      WHERE u.email = $2 AND u.is_verified = FALSE 
      RETURNING ap.otp_code`,
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
      text: `SELECT ap.otp_code, ap.otp_expiry 
      FROM auth_providers ap 
      JOIN users u ON ap.user_id = u.id
      WHERE u.email = $1`,
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

    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const updateQueryAuth = {
        text: `UPDATE auth_providers ap
        SET otp_code = NULL, otp_expiry = NULL
        FROM users u
        WHERE u.email = $1`,
        values: [email],
      };
      await client.query(updateQueryAuth);
      const updateQueryUser = {
        text: `UPDATE users
        SET is_verified = $1
        WHERE email = $2`,
        values: [true, email],
      };
      await client.query(updateQueryUser);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  // Forgot Password
  async changePassword(userId, newPassword, confPassword) {
    if (newPassword !== confPassword) {
      throw new InvariantError('Password dan Konfirmasi Password Tidak Cocok');
    }
    const salt = await bcrypt.genSalt(10);
    const hashNewPassword = await bcrypt.hash(newPassword, salt);
    const query = {
      text: `UPDATE auth_providers
      SET password = $1
      WHERE user_id = $2 AND provider = 'local'
      RETURNING user_id`,
      values: [hashNewPassword, userId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Email tidak ditemukan atau akun bukan lokal');
    }
  }

  async generateTokenResetPassword(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this._pool.query({
      text: 'DELETE FROM password_resets WHERE user_id = $1 and used = $2',
      values: [userId, false],
    });

    const query = {
      text: 'INSERT INTO password_resets (user_id, hashed_token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
      values: [userId, hashedToken],
    };
    await this._pool.query(query);
    return `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  }

  async verifyResetToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const query = {
      text: 'SELECT id FROM password_resets WHERE hashed_token = $1 AND expires_at > NOW() AND used = $2 LIMIT 1',
      values: [hashedToken, false],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new AuthenticationError('Token invalid atau sudah tidak berlaku');
    }
    return result.rows[0].id;
  }

  async verifySession(sessionId) {
    const query = {
      text: 'SELECT user_id FROM password_resets WHERE id = $1 AND expires_at > NOW() AND used = $2',
      values: [sessionId, false],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new AuthenticationError('Token invalid atau sudah tidak berlaku');
    }
    return result.rows[0].user_id;
  }

  async flagSession(sessionId) {
    const query = {
      text: 'UPDATE password_resets SET used = $1 WHERE id = $2',
      values: [true, sessionId],
    };
    await this._pool.query(query);
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
      await this._cacheService.delete(`addresses:user:${userId}`);
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllAddress(userId) {
    try {
      const result = await this._cacheService.get(`addresses:user:${userId}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: 'SELECT id, nama_penerima, no_hp, alamat_lengkap, kelurahan, is_default FROM user_addresses WHERE user_id = $1 AND is_deleted = $2 ORDER BY updated_at DESC',
        values: [userId, false],
      };
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Belum ada alamat pengiriman!');
      }
      await this._cacheService.set(`addresses:user:${userId}`, JSON.stringify(result.rows));
      return result.rows;
    }
  }

  async getDetailAddress(userId, id) {
    try {
      const result = await this._cacheService.get(`address:user:${userId}:address:${id}`);
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `SELECT id, nama_penerima, no_hp, alamat_lengkap, provinsi, kabupaten_kota, kecamatan, kelurahan, kode_pos, is_default 
      FROM user_addresses WHERE user_id = $1 AND id = $2 AND is_deleted = $3`,
        values: [userId, id, false],
      };

      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Pengguna atau alamat tidak ditemukan');
      }
      await this._cacheService.set(`address:user:${userId}:address:${id}`, JSON.stringify(result.rows[0]));
      return result.rows[0];
    }
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
      await this._cacheService.delete(`addresses:user:${userId}`);
      await this._cacheService.delete(`address:user:${userId}:address:${id}`);
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
      await this._cacheService.delete(`addresses:user:${userId}`);
      await this._cacheService.delete(`address:user:${userId}:address:${id}`);
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
    await this._cacheService.delete(`addresses:user:${userId}`);
    await this._cacheService.delete(`address:user:${userId}:address:${id}`);
  }
}

export default UserService;

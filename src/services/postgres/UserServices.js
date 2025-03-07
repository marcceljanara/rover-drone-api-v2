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
}

export default UserService;

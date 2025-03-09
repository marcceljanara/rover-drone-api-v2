import bcrypt from 'bcrypt';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import AuthenticationError from '../../exceptions/AuthenticationError.js';
import pool from '../../config/postgres/pool.js';
import AuthorizationError from '../../exceptions/AuthorizationError.js';

class AuthenticationsService {
  constructor() {
    this._pool = pool;
  }

  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await this._pool.query(query);
  }

  async verifyRefreshToken(token) {
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Refresh token tidak valid');
    }
  }

  async deleteRefreshToken(token) {
    await this.verifyRefreshToken(token);

    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    await this._pool.query(query);
  }

  async verifyUserCredential(email, password) {
    const query = {
      text: 'SELECT id, password, role FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    const { id, password: hashedPassword, role } = result.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    return { id, role };
  }

  async checkStatusAccount(email) {
    const query = {
      text: 'SELECT is_verified FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);
    if (result.rows.length === 0) {
      // Jika email tidak ditemukan
      throw new NotFoundError('Email tidak ditemukan');
    }
    const { is_verified } = result.rows[0];

    // Jika is_verified adalah false, maka lemparkan error
    if (!is_verified) {
      throw new AuthorizationError('Anda belum melakukan verifikasi email, silahkan lakukan verifikasi terlebih dahulu');
    }
  }
}

export default AuthenticationsService;

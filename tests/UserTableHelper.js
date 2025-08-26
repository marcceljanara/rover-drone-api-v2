/* istanbul ignore file */
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import pool from '../src/config/postgres/pool.js';

const UsersTableTestHelper = {

  async addUser({
    id = 'user-123', username = 'marccel', email = 'email@gmail.com', fullname = 'Marccel Janara', password = 'superpassword', is_verified = true, role = 'user',
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Insert ke users
      const userQuery = {
        text: 'INSERT INTO users (id, username, email, fullname, is_verified, role) VALUES ($1, $2, $3, $4, $5, $6)',
        values: [id, username, email, fullname, is_verified, role],
      };
      await client.query(userQuery);

      // Insert ke auth_providers
      const authQuery = {
        text: 'INSERT INTO auth_providers (id, user_id, provider, provider_id, password) VALUES ($1, $2, $3, $4, $5)',
        values: [nanoid(22), id, 'local', username, hashedPassword],
      };
      await client.query(authQuery);
      await client.query('COMMIT');
      return id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async addAdmin({
    id = 'admin-54321', username = 'admin', email = 'email@gmail.com', fullname = 'Marccel Janara', password = 'superpassword', is_verified = true, role = 'admin',
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Insert ke users
      const userQuery = {
        text: 'INSERT INTO users (id, username, email, fullname, is_verified, role) VALUES ($1, $2, $3, $4, $5, $6)',
        values: [id, username, email, fullname, is_verified, role],
      };
      await client.query(userQuery);

      // Insert ke auth_providers
      const authQuery = {
        text: 'INSERT INTO auth_providers (id, user_id, provider, provider_id, password) VALUES ($1, $2, $3, $4, $5)',
        values: [nanoid(22), id, 'local', username, hashedPassword],
      };
      await client.query(authQuery);
      await client.query('COMMIT');
      return id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findUsersById(id) {
    const query = {
      text: 'SELECT * FROM users WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findOtpUserById(id) {
    const query = {
      text: 'SELECT otp_code FROM auth_providers WHERE user_id = $1',
      values: [id],
    };
    const result = await pool.query(query);
    return result.rows[0].otp_code;
  },

  async addAddress(userId, {
    id = 'address-123',
    namaPenerima = 'I Nengah Marccel',
    noHp = '085212345678',
    alamatLengkap = 'Jalan Bali Indah, depan beringin RT X/RW X',
    provinsi = 'Lampung',
    kabupatenKota = 'Lampung Timur',
    kecamatan = 'Raman Utara',
    kelurahan = 'Rejo Binangun',
    kodePos = '34371',
    isDefault = false,
  }) {
    const query = {
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
    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async findAddressById(id) {
    const query = {
      text: 'SELECT * FROM user_addresses WHERE id = $1 AND is_deleted = FALSE',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async cleanTable() {
    await pool.query('DELETE FROM auth_providers WHERE 1 =1');
    await pool.query('DELETE FROM users WHERE 1=1');
    await pool.query('DELETE FROM user_addresses WHERE 1=1');
  },
};

export default UsersTableTestHelper;

import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pkg;

const dbConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
};

const generateAdmin = async () => {
  const client = new Client(dbConfig);
  await client.connect();

  const adminId = `user-${nanoid(16)}`;
  const providerId = `auth-${nanoid(16)}`;
  const username = 'admin';
  const email = process.env.EMAIL_ADMIN;
  const fullname = 'Administrator';
  const plainPassword = process.env.PASSWORD_ADMIN;
  const role = 'admin'; // kalau tabel users Anda memang punya kolom role

  try {
    await client.query('BEGIN');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Insert ke users
    const userQuery = {
      text: `INSERT INTO users (id, username, fullname, email, role, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
      values: [adminId, username, fullname, email, role, true],
    };
    const userResult = await client.query(userQuery);

    if (!userResult.rows.length) {
      console.log('Admin sudah ada, tidak dibuat ulang.');
      await client.query('ROLLBACK');
      return;
    }

    // Insert ke auth_providers
    const authQuery = {
      text: `INSERT INTO auth_providers (id, user_id, provider, provider_id, password) 
             VALUES ($1, $2, $3, $4, $5)`,
      values: [providerId, adminId, 'local', username, hashedPassword],
    };
    await client.query(authQuery);

    await client.query('COMMIT');

    console.log(`Admin created successfully:
      ID: ${adminId}
      Username: ${username}
      Email: ${email}
      Role: ${role}
    `);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating admin:', error);
  } finally {
    await client.end();
  }
};

// Jalankan fungsi
generateAdmin();

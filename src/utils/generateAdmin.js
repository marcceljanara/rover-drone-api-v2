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
  let connected = false;
  let transactionStarted = false;

  const adminId = `user-${nanoid(16)}`;
  const providerId = `auth-${nanoid(16)}`;
  const username = 'admin';
  const email = process.env.EMAIL_ADMIN;
  const fullname = 'Administrator';
  const plainPassword = process.env.PASSWORD_ADMIN;
  const role = 'admin'; // kalau tabel users Anda memang punya kolom role

  try {
    await client.connect();
    connected = true;
    await client.query('BEGIN');
    transactionStarted = true;

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
      transactionStarted = false;
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
    transactionStarted = false;

    console.log(`Admin created successfully:
      ID: ${adminId}
      Username: ${username}
      Email: ${email}
      Role: ${role}
    `);
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back admin creation:', rollbackError);
      }
    }
    console.error('Error creating admin:', error);
    throw error;
  } finally {
    if (connected) {
      await client.end();
    }
  }
};

// Jalankan fungsi
generateAdmin().catch(() => {
  process.exitCode = 1;
});

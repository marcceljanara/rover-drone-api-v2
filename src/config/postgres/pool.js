/* istanbul ignore file */
import pkg from 'pg';

const { Pool } = pkg;

const config = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
};

const pool = new Pool(config);

export default pool;

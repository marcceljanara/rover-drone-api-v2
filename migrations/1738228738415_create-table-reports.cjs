/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('reports', {
    id: {
      type: 'VARCHAR(23)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(22)',
      notNull: false,
      references: '"users"',
      onDelete: 'SET NULL',
    },
    total_transactions: {
      type: 'INTEGER',
      notNull: true,
    },
    total_amount: {
      type: 'DECIMAL(15, 2)',
      notNull: true,
    },
    report_date: {
      type: 'TIMESTAMP',
      default: pgm.func('current_timestamp'),
    },
    start_date: {
      type: 'TIMESTAMP',
      notNull: true,
    },
    end_date: {
      type: 'TIMESTAMP',
      notNull: true,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('reports');
};

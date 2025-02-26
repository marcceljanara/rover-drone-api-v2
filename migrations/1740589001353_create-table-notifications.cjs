/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('notifications', {
    id: {
      type: 'VARCHAR(23)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(22)',
      notNull: true,
      references: '"users"',
      onDelete: 'SET NULL',
    },
    notification_type: {
      type: 'VARCHAR(20)',
      notNull: true,
      check: "notification_type IN ('INFO', 'WARNING', 'ERROR')",
    },
    notification_timestamp: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    message_content: {
      type: 'TEXT',
      notNull: true,
    },
  });

  // Buat index untuk mempercepat pencarian berdasarkan user_id
  pgm.createIndex('notifications', 'user_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('notifications');
};

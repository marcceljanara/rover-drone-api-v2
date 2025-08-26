/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable('auth_providers', {
    id: { type: 'VARCHAR(22)', primaryKey: true },
    user_id: {
      type: 'VARCHAR(22)',
      notNull: true,
      references: '"users"(id)',
      onDelete: 'CASCADE',
    },
    provider: { type: 'VARCHAR(50)', notNull: true }, // 'local', 'google', etc.
    provider_id: { type: 'TEXT' }, // ID unik dari Google/GitHub
    password: { type: 'TEXT' }, // untuk local
    otp_code: { type: 'VARCHAR(6)' }, // untuk local
    otp_expiry: { type: 'TIMESTAMP' }, // untuk local
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.addConstraint('auth_providers', 'unique_provider_per_user', {
    unique: ['provider', 'provider_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('auth_providers');
};

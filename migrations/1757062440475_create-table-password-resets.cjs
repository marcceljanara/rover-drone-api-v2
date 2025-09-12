exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('password_resets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'varchar(22)',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade',
    },
    hashed_token: {
      type: 'text',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    used: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('password_resets');
};

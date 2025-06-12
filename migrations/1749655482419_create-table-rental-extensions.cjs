exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('rental_extensions', {
    id: {
      type: 'VARCHAR(15)',
      primaryKey: true,
    },
    rental_id: {
      type: 'VARCHAR(23)',
      notNull: true,
      references: '"rentals"', // Foreign key ke tabel rentals
      onDelete: 'CASCADE', // Jika rental dihapus, pembayaran terkait ikut dihapus
    },
    duration_months: {
      type: 'integer',
      notNull: true,
      check: 'duration_months IN (6, 12, 24, 36)',
    },
    new_end_date: {
      type: 'date',
      notNull: true,
    },
    amount: {
      type: 'INTEGER',
      notNull: true,
      check: 'amount > 0',
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'pending_payment',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('rental_extensions');
};

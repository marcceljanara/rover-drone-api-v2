/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // drop kolom yang tidak dipakai
  pgm.dropColumn('users', 'password');
  pgm.dropColumn('users', 'otp_code');
  pgm.dropColumn('users', 'otp_expiry');

  // ubah username dari NOT NULL -> NULLABLE
  pgm.alterColumn('users', 'username', { notNull: false });
};

exports.down = (pgm) => {
  // kembalikan kolom
  pgm.addColumn('users', {
    password: { type: 'TEXT', notNull: false },
    otp_code: { type: 'VARCHAR(6)' },
    otp_expiry: { type: 'TIMESTAMP' },
  });

  // ubah kembali username jadi NOT NULL
  pgm.alterColumn('users', 'username', { notNull: true });
};

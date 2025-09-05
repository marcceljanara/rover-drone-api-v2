/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // drop kolom yang tidak dipakai
  pgm.dropColumn('users', 'password');
  pgm.dropColumn('users', 'otp_code');
  pgm.dropColumn('users', 'otp_expiry');
};

exports.down = (pgm) => {
  // kembalikan kolom
  pgm.addColumn('users', {
    password: { type: 'TEXT', notNull: false },
    otp_code: { type: 'VARCHAR(6)' },
    otp_expiry: { type: 'TIMESTAMP' },
  });
};

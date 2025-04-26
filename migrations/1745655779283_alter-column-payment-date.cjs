exports.shorthands = undefined;

exports.up = (pgm) => {
  // Mengubah tipe kolom payment_date dari DATE menjadi TIMESTAMP
  pgm.alterColumn('payments', 'payment_date', {
    type: 'TIMESTAMP',
    notNull: false,
  });
};

exports.down = (pgm) => {
  // Mengembalikan tipe kolom payment_date menjadi DATE
  pgm.alterColumn('payments', 'payment_date', {
    type: 'DATE',
    notNull: false,
  });
};

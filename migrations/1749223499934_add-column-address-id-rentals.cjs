exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('rentals', {
    shipping_address_id: {
      type: 'VARCHAR(15)',
      notNull: false,
      references: '"user_addresses"', // FK ke tabel user_addresses
      onDelete: 'RESTRICT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('rentals', 'shipping_address_id');
};

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('devices', {
    reserved_rental_id: {
      type: 'VARCHAR(13)',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('devices', 'reserved_rental_id');
};

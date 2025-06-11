exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropColumn('rentals', 'cost');
};

exports.down = (pgm) => {
  pgm.addColumn('rentals', {
    cost: {
      type: 'INTEGER',
      notNull: true,
      check: 'cost > 0',
    },
  });
};

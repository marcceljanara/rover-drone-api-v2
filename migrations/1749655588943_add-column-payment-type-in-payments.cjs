exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('payments', {
    payment_type: {
      type: 'VARCHAR(20)',
      notNull: true,
      default: "'initial'",
      check: "payment_type IN ('initial', 'extension')",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('payments', 'payment_type');
};

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('devices', {
    first_session_flag: {
      type: 'boolean',
      default: false,
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('devices', 'first_session_flag');
};

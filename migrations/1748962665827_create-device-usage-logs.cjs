exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('device_usage_logs', {
    id: {
      type: 'VARCHAR(11)',
      primaryKey: true,
    },
    device_id: {
      type: 'VARCHAR(23)',
      notNull: true,
      references: '"devices"',
      onDelete: 'CASCADE',
    },
    start_time: {
      type: 'TIMESTAMP',
      notNull: true,
    },
    end_time: {
      type: 'TIMESTAMP',
      notNull: false,
      default: null,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('device_usage_logs');
};

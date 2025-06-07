exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('rental_costs', {
    rental_id: {
      type: 'VARCHAR(23)',
      primaryKey: true,
      references: '"rentals"',
      onDelete: 'CASCADE',
    },
    base_cost: {
      type: 'INTEGER',
      notNull: true,
      check: 'base_cost >= 0',
    },
    sensor_cost: {
      type: 'INTEGER',
      notNull: true,
      default: 0,
      check: 'sensor_cost >= 0',
    },
    shipping_cost: {
      type: 'INTEGER',
      notNull: true,
      default: 0,
      check: 'shipping_cost >= 0',
    },
    setup_cost: {
      type: 'INTEGER',
      notNull: true,
      default: 0,
      check: 'setup_cost >= 0',
    },
    total_cost: {
      type: 'INTEGER',
      notNull: true,
      check: 'total_cost >= 0',
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TIMESTAMP',
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('rental_costs');
};

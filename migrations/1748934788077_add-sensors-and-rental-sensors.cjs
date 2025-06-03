exports.shorthands = undefined;

/**
 * Migration to add `sensors` and `rental_sensors` tables.
 */
exports.up = (pgm) => {
  // Tabel sensor
  pgm.createTable('sensors', {
    id: {
      type: 'varchar(32)',
      primaryKey: true,
    },
    name: {
      type: 'varchar(64)',
      notNull: true,
    },
    cost: {
      type: 'integer',
      notNull: true,
      check: 'cost >= 0',
    },
  });

  // Seed default sensors
  pgm.sql(`
    INSERT INTO sensors (id, name, cost) VALUES
      ('temperature', 'Temperature Sensor', 50000),
      ('humidity', 'Humidity Sensor', 60000),
      ('light_intensity', 'Light Intensity Sensor', 40000)
  `);

  // Tabel relasi rental <-> sensor
  pgm.createTable('rental_sensors', {
    rental_id: {
      type: 'varchar(23)',
      notNull: true,
      references: '"rentals"',
      onDelete: 'cascade',
    },
    sensor_id: {
      type: 'varchar(32)',
      notNull: true,
      references: '"sensors"',
      onDelete: 'cascade',
    },
  });

  // Composite primary key
  pgm.addConstraint('rental_sensors', 'pk_rental_sensors', {
    primaryKey: ['rental_id', 'sensor_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('rental_sensors');
  pgm.dropTable('sensors');
};

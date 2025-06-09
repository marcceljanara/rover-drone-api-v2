exports.up = (pgm) => {
  pgm.createTable('rental_shipping_infos', {
    id: {
      type: 'VARCHAR(25)',
      primaryKey: true,
    },
    rental_id: {
      type: 'VARCHAR(23)',
      notNull: true,
      references: '"rentals"',
      onDelete: 'CASCADE',
    },
    courier_name: {
      type: 'TEXT',
      notNull: true,
    },
    courier_service: {
      type: 'TEXT',
      notNull: true,
    },
    etd: {
      type: 'INTEGER', // Estimated Time of Delivery in days
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('rental_shipping_infos', 'unique_rental_id', {
    unique: ['rental_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('rental_shipping_infos');
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enum status pengembalian
  pgm.createType('return_status', ['requested', 'returning', 'returned', 'failed']);

  // Tabel return_shipping_info
  pgm.createTable('return_shipping_info', {
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
    pickup_address_id: {
      type: 'VARCHAR(15)',
      references: '"user_addresses"',
      onDelete: 'SET NULL',
    },
    courier_name: {
      type: 'TEXT',
    },
    courier_service: {
      type: 'TEXT',
    },
    tracking_number: {
      type: 'TEXT',
    },
    picked_up_at: {
      type: 'timestamp',
    },
    returned_at: {
      type: 'timestamp',
    },
    status: {
      type: 'return_status',
      default: 'requested',
      notNull: true,
    },
    pickup_method: {
      type: 'VARCHAR(20)',
      notNull: true,
      default: 'pickup', // bisa pickup atau dropoff (kalau masa depan butuh)
    },
    notes: {
      type: 'TEXT',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('return_shipping_info');
  pgm.dropType('return_status');
};

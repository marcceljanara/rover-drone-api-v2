exports.shorthands = undefined;

exports.up = (pgm) => {
  // Buat enum untuk status pengiriman
  pgm.createType('shipping_status', [
    'waiting', // Belum dikemas
    'packed', // Sudah dikemas
    'shipped', // Dalam pengiriman
    'delivered', // Sudah diterima
    'failed', // Gagal atau retur
  ]);

  // Buat tabel shipment_orders
  pgm.createTable('shipment_orders', {
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
    shipping_address_id: {
      type: 'VARCHAR(15)',
      notNull: true,
      references: '"user_addresses"',
      onDelete: 'RESTRICT',
    },
    courier_name: {
      type: 'TEXT',
      notNull: false,
    },
    courier_service: {
      type: 'TEXT',
      notNull: false,
    },
    tracking_number: {
      type: 'TEXT',
      notNull: false,
      default: '',
    },
    shipping_status: {
      type: 'shipping_status',
      notNull: true,
      default: 'waiting',
    },
    estimated_shipping_date: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    actual_shipping_date: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    actual_delivery_date: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    notes: {
      type: 'TEXT',
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
  pgm.dropTable('shipment_orders');
  pgm.dropType('shipping_status');
};

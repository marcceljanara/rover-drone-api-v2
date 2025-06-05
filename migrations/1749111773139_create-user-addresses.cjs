exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('user_addresses', {
    id: {
      type: 'VARCHAR(15)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(22)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    nama_penerima: {
      type: 'varchar(100)',
    },
    no_hp: {
      type: 'varchar(20)',
    },
    alamat_lengkap: {
      type: 'text',
      notNull: true,
    },
    provinsi: {
      type: 'varchar(100)',
    },
    kabupaten_kota: {
      type: 'varchar(100)',
    },
    kecamatan: {
      type: 'varchar(100)',
    },
    kelurahan: {
      type: 'varchar(100)',
    },
    kode_pos: {
      type: 'varchar(10)',
    },
    is_default: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('user_addresses');
};

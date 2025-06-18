exports.shorthands = undefined;

exports.up = (pgm) => {
  // Membuat tabel sensordata
  pgm.createTable('sensordata', {
    id: {
      type: 'VARCHAR(16)',
      primaryKey: true, // Menetapkan id sebagai primary key
    },
    device_id: {
      type: 'VARCHAR(23)',
      notNull: true, // device_id harus diisi
      references: '"devices"', // Mengacu pada tabel device
      onDelete: 'CASCADE', // Jika device dihapus, data sensor terkait ikut dihapus
    },
    timestamp: {
      type: 'TIMESTAMPZ',
      notNull: true, // timestamp harus diisi
    },
    temperature: {
      type: 'FLOAT',
      notNull: false, // temperature harus diisi
    },
    humidity: {
      type: 'FLOAT',
      notNull: false, // humidity harus diisi
    },
    light_intensity: {
      type: 'FLOAT',
      notNull: false, // light_intensity harus diisi
    },
  });
};

exports.down = (pgm) => {
  // Menghapus tabel sensordata
  pgm.dropTable('sensordata');
};

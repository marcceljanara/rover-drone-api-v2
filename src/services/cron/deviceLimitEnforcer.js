import cron from 'node-cron';
import DevicesService from '../postgres/DevicesService.js';
import PublisherService from '../mqtt/PublisherServiceMqtt.js';

const devicesService = new DevicesService(); // atau ambil dari dependency injection

cron.schedule('*/1 * * * *', async () => {
  console.log('[Cron] Mengecek perangkat aktif yang melebihi batas waktu...');

  try {
    // ---------- Sesi pertama melebihi 4 jam ----------
    const overFirstSession = await devicesService.getDevicesOverFirstSession();

    if (overFirstSession.length > 0) {
      const controlFirstSession = overFirstSession.map(async (id) => {
        try {
          const response = await devicesService.deviceControl('system', 'admin', {
            id,
            action: 'off',
          });

          await PublisherService.publishMessage(response.control_topic, { action: 'off' });
          await devicesService.markFirstSessionHandled(id);
          console.log(`[Cron] Device ${id} dinonaktifkan otomatis (lebih dari 4 jam sesi pertama)`);
        } catch (err) {
          console.error(`[Cron] Gagal mematikan device ${id} (sesi pertama):`, err.message);
        }
      });

      await Promise.all(controlFirstSession);
    }

    // ---------- Total pemakaian melebihi 8 jam ----------
    const overDailyLimit = await devicesService.getOverusedActiveDevices();

    if (overDailyLimit.length > 0) {
      const controlDailyLimit = overDailyLimit.map(async (id) => {
        try {
          const response = await devicesService.deviceControl('system', 'admin', {
            id,
            action: 'off',
          });

          await PublisherService.publishMessage(response.control_topic, { action: 'off' });
          console.log(`[Cron] Device ${id} dinonaktifkan otomatis (lebih dari 8 jam total harian)`);
        } catch (err) {
          console.error(`[Cron] Gagal mematikan device ${id} (daily limit):`, err.message);
        }
      });

      await Promise.all(controlDailyLimit);
    }
  } catch (error) {
    console.error('[Cron] Gagal menjalankan pengecekan batas waktu perangkat:', error);
  }
});

/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';
import validateContentType from '../../middleware/validateContentType.js';

const deviceRoutes = (handler) => {
  const router = express.Router();

  // Admin
  /**
   * @swagger
   * tags:
   *   name: Devices
   *   description: API untuk mengelola device
   */

  /**
   * @swagger
   * /v1/devices:
   *   post:
   *     summary: (Admin) Menambahkan perangkat baru
   *     tags: [Devices]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       201:
   *         description: Pengguna berhasil didaftarkan
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: device berhasil ditambahkan
   */
  router.post('/v1/devices', verifyToken, verifyAdmin, handler.postAddDeviceHandler);

  /**
 * @swagger
 * /v1/devices/{id}:
 *   put:
 *     summary: "(Admin) Hapus perangkat"
 *     description: "Menghapus perangkat berdasarkan ID (hanya admin)"
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID perangkat yang akan dihapus"
 *         schema:
 *           type: string
 *           example: "devices-12345678"
 *     responses:
 *       200:
 *         description: "Perangkat berhasil dihapus"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "device berhasil dihapus"
 *       404:
 *         description: Perangkat tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: device tidak ditemukan
 */
  router.put('/v1/devices/:id', verifyToken, verifyAdmin, handler.deleteDeviceHandler);
  /**
* @swagger
* /v1/devices/{id}/status:
*   put:
*     summary: (Admin) Mengubah status perangkat
*     description: Mengubah status perangkat berdasarkan ID (hanya admin)
*     tags:
*       - Devices
*     security:
*       - bearerAuth: []
*     parameters:
*       - name: id
*         in: path
*         required: true
*         description: "ID perangkat yang akan diubah status device"
*         schema:
*           type: string
*           example: "devices-12345678"
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - status
*             properties:
*               status:
*                 type: string
*                 example: pilih salah satu ['active', 'inactive', 'maintenance', 'error']
*     responses:
*       200:
*         description: "Perangkat berhasil dihapus"
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "success"
*                 message:
*                   type: string
*                   example: "status device berhasil diubah"
*       404:
*         description: Perangkat tidak ditemukan
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: fail
*                 message:
*                   type: string
*                   example: device tidak ditemukan
*/

  router.put('/v1/devices/:id/status', verifyToken, verifyAdmin, validateContentType('application/json'), handler.putStatusDeviceHandler);
  /**
 * @swagger
 * /v1/devices/{id}/mqttsensor:
 *   put:
 *     summary: "(Admin) Mengubah topik MQTT control perangkat"
 *     description: "Mengubah topik MQTT control perangkat berdasarkan ID (hanya admin)"
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID perangkat yang akan diubah topik MQTT control perangkatnya"
 *         schema:
 *           type: string
 *           example: "devices-12345678"
 *     responses:
 *       200:
 *         description: "Topik MQTT control berhasil diubah"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Topik MQTT control berhasil diubah"
 *       404:
 *         description: "Perangkat tidak ditemukan"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "device tidak ditemukan"
 */
  router.put('/v1/devices/:id/mqttsensor', verifyToken, verifyAdmin, handler.putMqttSensorHandler);

  /**
 * @swagger
 * /v1/devices/{id}/mqttcontrol:
 *   put:
 *     summary: "(Admin) Mengubah topik MQTT control perangkat"
 *     description: "Mengubah topik MQTT control perangkat berdasarkan ID (hanya admin)"
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID perangkat yang akan diubah topik MQTT control perangkatnya"
 *         schema:
 *           type: string
 *           example: "devices-12345678"
 *     responses:
 *       200:
 *         description: "Topik MQTT control berhasil diubah"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Topik MQTT control berhasil diubah"
 *       404:
 *         description: "Perangkat tidak ditemukan"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "device tidak ditemukan"
 */
  router.put('/v1/devices/:id/mqttcontrol', verifyToken, verifyAdmin, handler.putMqttControlHandler);

  // User (same id) & admin (all device)
  /**
 * @swagger
 * /v1/devices:
 *   get:
 *     summary: "Mendapatkan daftar perangkat (auth: user atau admin)"
 *     description: |
 *       Mendapatkan daftar perangkat yang terdaftar dalam sistem. Akses berdasarkan role:
 *       - **Admin**: Dapat melihat semua perangkat.
 *       - **User**: Hanya dapat melihat perangkat yang sedang disewa oleh mereka.
 *       - **Tanpa scope**: Mengembalikan daftar perangkat sesuai dengan hak akses pengguna.
 *       - **Dengan scope `available`**: Mengembalikan hanya perangkat yang belum disewa (rental_id `NULL`).
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         required: false
 *         schema:
 *           type: string
 *           enum: [available]
 *         description: |
 *           - Jika `available`, hanya mengembalikan perangkat yang belum disewa.
 *           - Jika kosong, akan mengembalikan semua perangkat sesuai hak akses pengguna.
 *     responses:
 *       200:
 *         description: "Berhasil mendapatkan daftar perangkat"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Data device berhasil diperoleh"
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "device-bNpwLE"
 *                           rental_id:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           status:
 *                             type: string
 *                             example: "inactive"
 *                           last_reported_issue:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           last_active:
 *                             type: string
 *                             example: "00 Hari 00:00:00"
 *       401:
 *         description: "Tidak diizinkan, token hilang atau tidak valid."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Akses tidak sah"
 *       403:
 *         description: "Dilarang, pengguna tidak memiliki izin untuk melihat perangkat ini."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Anda tidak memiliki izin untuk melihat perangkat ini"
 *       500:
 *         description: "Kesalahan server internal."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Kesalahan Server Internal"
 */

  router.get('/v1/devices', verifyToken, handler.getAllDeviceHandler);

  /**
 * @swagger
 * /v1/devices/{id}:
 *   get:
 *     summary: "Mendapatkan detail perangkat berdasarkan ID (auth: role user atau admin)"
 *     description: "Mendapatkan detail perangkat yang terdaftar dalam sistem berdasarkan ID. Hanya dapat diakses oleh pengguna dengan peran user atau admin."
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID perangkat yang ingin diambil detailnya"
 *         schema:
 *           type: string
 *           example: "devices-12345678"
 *     responses:
 *       200:
 *         description: "Berhasil mendapatkan detail perangkat"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     device:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "device-RvSBmi"
 *                         rental_id:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         status:
 *                           type: string
 *                           example: "inactive"
 *                         last_reported_issue:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         last_active:
 *                           type: string
 *                           example: "00 Hari 00:00:00"
 *                         sensor_topic:
 *                           type: string
 *                           example: "sensor/device-RvSBmi/7sCAZYX0NQ"
 *                         control_topic:
 *                           type: string
 *                           example: "control/device-RvSBmi/OsT6b1ndL3"
 *                         is_deleted:
 *                           type: boolean
 *                           example: false
 *                         reserved_until:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-09T21:17:01.404Z"
 *       404:
 *         description: "Perangkat tidak ditemukan"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Device tidak ditemukan"
 */

  router.get('/v1/devices/:id', verifyToken, handler.getDeviceHandler);

  /**
 * @swagger
 * /v1/devices/{id}/control:
 *   put:
 *     summary: "Mengontrol status perangkat (auth: user atau admin)"
 *     description: "Mengubah status perangkat menjadi 'active' atau 'inactive' berdasarkan ID. Admin dapat mengontrol semua perangkat, sedangkan user hanya dapat mengontrol perangkat yang disewanya."
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID perangkat yang ingin dikontrol"
 *         schema:
 *           type: string
 *           example: "device-12345678"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [on, off]
 *                 description: "Aksi untuk mengontrol perangkat, 'on' untuk mengaktifkan dan 'off' untuk menonaktifkan."
 *                 example: "on"
 *               command:
 *                 type: string
 *                 example: "power"
 *     responses:
 *       200:
 *         description: "Perangkat berhasil dikontrol"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "device active"
 *       403:
 *         description: "User tidak memiliki akses untuk mengontrol perangkat ini"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Anda tidak memiliki akses untuk mengontrol perangkat ini"
 *       404:
 *         description: "Perangkat tidak ditemukan atau tidak dapat dikontrol"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Device tidak ditemukan atau Anda tidak memiliki akses"
 */

  router.put('/v1/devices/:id/control', verifyToken, validateContentType('application/json'), handler.putDeviceControlHandler);
  /**
 * @swagger
 * /v1/devices/{id}/sensors/intervals:
 *   get:
 *     summary: Mendapatkan data sensor dari perangkat dalam interval waktu tertentu
 *     description: |
 *       Mengambil data sensor (suhu, kelembaban, dan intensitas cahaya) dari suatu perangkat dalam rentang waktu tertentu.
 *       - **Admin** dapat mengakses semua data perangkat.
 *       - **Pengguna biasa** hanya dapat mengakses data dari perangkat yang mereka sewa.
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dari perangkat.
 *       - in: query
 *         name: interval
 *         required: false
 *         schema:
 *           type: string
 *           enum: [15m, 1h, 6h, 12h, 24h, 7d, 30d, 60d, 90d]
 *           default: 12h
 *         description: |
 *           Rentang waktu untuk mengambil data sensor. Default adalah `12h`.
 *           Pilihan interval:
 *           - `15m` (15 menit)
 *           - `1h` (1 jam)
 *           - `6h` (6 jam)
 *           - `12h` (12 jam)
 *           - `24h` (1 hari)
 *           - `7d` (7 hari)
 *           - `30d` (30 hari)
 *           - `60d` (60 hari)
 *           - `90d` (90 hari)
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data sensor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     sensors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "EvswF36suuZp36LV"
 *                           device_id:
 *                             type: string
 *                             example: "device-XcJPMk"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-03-10T22:58:32.386Z"
 *                           temperature:
 *                             type: number
 *                             format: float
 *                             example: 29.49
 *                           humidity:
 *                             type: number
 *                             format: float
 *                             example: 53.16
 *                           light_intensity:
 *                             type: number
 *                             example: 62608
 *       400:
 *         description: Parameter permintaan tidak valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Parameter query tidak valid"
 *       401:
 *         description: Tidak diizinkan, token hilang atau tidak valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Akses tidak sah"
 *       403:
 *         description: Dilarang, pengguna tidak memiliki akses ke perangkat ini.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Anda tidak memiliki izin untuk mengakses perangkat ini"
 *       404:
 *         description: Perangkat tidak ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Perangkat tidak ditemukan"
 *       500:
 *         description: Kesalahan server internal.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Kesalahan Server Internal"
 */

  router.get('/v1/devices/:id/sensors/intervals', verifyToken, handler.getSensorDataHandler);
  /**
 * @swagger
 * /v1/devices/{id}/sensors/limits:
 *   get:
 *     summary: Mendapatkan data sensor terbaru dengan batas tertentu
 *     description: |
 *       Mengambil sejumlah data sensor terbaru dari perangkat berdasarkan jumlah limit yang ditentukan.
 *       - **Admin** dapat mengakses semua data perangkat.
 *       - **Pengguna biasa** hanya dapat mengakses data dari perangkat yang mereka sewa.
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dari perangkat.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah maksimum data sensor yang diambil. Default adalah `10`.
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data sensor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     sensors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "L_sblmgESZyhstEV"
 *                           device_id:
 *                             type: string
 *                             example: "device-XcJPMk"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-03-10T23:04:12.392Z"
 *                           temperature:
 *                             type: number
 *                             format: float
 *                             example: 30.07
 *                           humidity:
 *                             type: number
 *                             format: float
 *                             example: 70.78
 *                           light_intensity:
 *                             type: number
 *                             example: 22355
 *       400:
 *         description: Parameter permintaan tidak valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Parameter query tidak valid"
 *       401:
 *         description: Tidak diizinkan, token hilang atau tidak valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Akses tidak sah"
 *       403:
 *         description: Dilarang, pengguna tidak memiliki akses ke perangkat ini.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Anda tidak memiliki izin untuk mengakses perangkat ini"
 *       404:
 *         description: Perangkat tidak ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Perangkat tidak ditemukan"
 *       500:
 *         description: Kesalahan server internal.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Kesalahan Server Internal"
 */
  router.get('/v1/devices/:id/sensors/limits', verifyToken, handler.getSensorDataLimitHandler);
  /**
 * @swagger
 * /v1/devices/{id}/sensors/downloads:
 *   get:
 *     summary: Unduh data sensor dalam format CSV
 *     description: Mengunduh data sensor berdasarkan perangkat tertentu dalam format CSV dengan rentang waktu yang ditentukan.
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID perangkat IoT
 *         schema:
 *           type: string
 *       - name: interval
 *         in: query
 *         required: false
 *         description: "Rentang waktu data sensor yang akan diunduh (default: 12h)"
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 12h, 1d, 7d, 30d, 60d, 90d, 180d, 365d]
 *     responses:
 *       200:
 *         description: Berhasil mengunduh data sensor dalam format CSV.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: "attachment; filename=sensor_data.csv"
 *             schema:
 *               type: string
 *         examples:
 *           text/csv:
 *             value: |
 *               "id","device_id","timestamp","temperature","humidity","light_intensity"
 *               "xkXbcfq6VJIuOSRH","device-XcJPMk","2025-03-10T23:07:12.394Z",38.55,95.36,13427
 *               "4Nv_yqQGUdrgA2Un","device-XcJPMk","2025-03-10T23:06:52.394Z",36.9,82.53,17969
 *       404:
 *         description: Perangkat tidak ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: "Perangkat tidak ditemukan"
 */

  router.get('/v1/devices/:id/sensors/downloads', verifyToken, handler.getSensorDataDownloadHandler);

  /**
 * @swagger
 * /v1/devices/{id}/daily:
 *   get:
 *     summary: Mendapatkan total jam penggunaan perangkat hari ini
 *     description: Mengembalikan jumlah jam perangkat digunakan pada hari ini berdasarkan ID perangkat.
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID perangkat
 *         schema:
 *           type: string
 *           example: dev-abc123
 *     responses:
 *       200:
 *         description: Data jam penggunaan perangkat berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     deviceId:
 *                       type: string
 *                       example: dev-abc123
 *                     usedHoursToday:
 *                       type: number
 *                       format: float
 *                       example: 4.125
 *       400:
 *         description: Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Parameter ID tidak valid
 *       404:
 *         description: Data perangkat tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */

  router.get('/v1/devices/:id/daily', handler.getDailyUsedHoursHandler);

  return router;
};

export default deviceRoutes;

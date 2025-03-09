/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

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

  router.put('/v1/devices/:id/status', verifyToken, verifyAdmin, handler.putStatusDeviceHandler);
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
 *     summary: "Mendapatkan seluruh perangkat (auth: role user atau admin)"
 *     description: "Mendapatkan seluruh perangkat yang terdaftar dalam sistem. Hanya dapat diakses oleh pengguna dengan peran user atau admin."
 *     tags:
 *       - Devices
 *     security:
 *       - bearerAuth: []
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

  router.put('/v1/devices/:id/control', verifyToken, handler.putDeviceControlHandler);

  router.get('/v1/devices/:id/sensors/intervals', verifyToken, handler.getSensorDataHandler);
  router.get('/v1/devices/:id/sensors/limits', verifyToken, handler.getSensorDataLimitHandler);
  router.get('/v1/devices/:id/sensors/downloads', verifyToken, handler.getSensorDataDownloadHandler);

  return router;
};

export default deviceRoutes;

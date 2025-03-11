/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const reportRoutes = (handler) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Reports
   *   description: API untuk mengelola laporan
   */
  /**
 * @swagger
 * /v1/reports:
 *   post:
 *     summary: Membuat laporan transaksi dalam rentang tanggal tertentu
 *     description: Endpoint ini digunakan oleh admin untuk membuat laporan transaksi berdasarkan rentang tanggal yang diberikan.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Tanggal mulai laporan (format ISO 8601)
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Tanggal akhir laporan (format ISO 8601)
 *                 example: "2024-01-31"
 *     responses:
 *       201:
 *         description: Berhasil membuat laporan transaksi
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
 *                   example: "laporan berhasil dibuat"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                       example: "report-SrYVWTwATLYoT7QD"
 *       400:
 *         description: Request tidak valid (misalnya format tanggal salah atau startDate lebih besar dari endDate)
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
 *                   example: "Tanggal awal tidak boleh lebih besar dari tanggal akhir"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses sebagai admin
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
 *                   example: "Token tidak valid atau tidak memiliki akses"
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: "Terjadi kesalahan pada server"
 */

  router.post('/v1/reports', verifyToken, verifyAdmin, handler.postReportHandler);
  /**
 * @swagger
 * /v1/reports:
 *   get:
 *     summary: Mendapatkan daftar laporan transaksi
 *     description: Endpoint ini digunakan oleh admin untuk mengambil semua laporan transaksi yang tersedia.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar laporan transaksi
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
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "report-3mzismE4kfpsE97N"
 *                           report_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-03-10T22:30:06.994Z"
 *                           total_transactions:
 *                             type: integer
 *                             example: 0
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-31T00:00:00.000Z"
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-03-11T00:00:00.000Z"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses sebagai admin
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
 *                   example: "Token tidak valid atau tidak memiliki akses"
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: "Terjadi kesalahan pada server"
 */

  router.get('/v1/reports', verifyToken, verifyAdmin, handler.getAllReportHandler);
  /**
 * @swagger
 * /v1/reports/{id}:
 *   get:
 *     summary: Mendapatkan detail laporan transaksi berdasarkan ID
 *     description: Endpoint ini digunakan oleh admin untuk mengambil detail laporan transaksi tertentu.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID laporan yang ingin diambil
 *         example: "report-JYHslXnOSjUi6m_g"
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail laporan transaksi
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
 *                     report:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "report-JYHslXnOSjUi6m_g"
 *                         user_id:
 *                           type: string
 *                           example: "admin-PZfN2dAzIGC7Sb5m"
 *                         report_interval:
 *                           type: string
 *                           example: "Laporan Fri Jan 31 2025 00:00:00 GMT+0700 - Tue Mar 11 2025 00:00:00 GMT+0700"
 *                         total_transactions:
 *                           type: integer
 *                           example: 2
 *                         total_amount:
 *                           type: string
 *                           example: "34200000.00"
 *                         report_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-10T22:33:24.553Z"
 *                         payments:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "payment-W8R2OK86CKu43ACJ"
 *                               rental_id:
 *                                 type: string
 *                                 example: "rental-YisMU8"
 *                               amount:
 *                                 type: string
 *                                 example: "17100000.00"
 *                               payment_date:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2025-03-09T10:00:00.000Z"
 *                               payment_status:
 *                                 type: string
 *                                 example: "completed"
 *                               payment_method:
 *                                 type: string
 *                                 example: "BRI"
 *       400:
 *         description: Parameter ID tidak valid
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
 *                   example: "ID laporan tidak valid"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses sebagai admin
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
 *                   example: "Token tidak valid atau tidak memiliki akses"
 *       404:
 *         description: Laporan tidak ditemukan
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
 *                   example: "Laporan tidak ditemukan"
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: "Terjadi kesalahan pada server"
 */
  router.get('/v1/reports/:id', verifyToken, verifyAdmin, handler.getDetailReportHandler);
  /**
 * @swagger
 * /v1/reports/{id}/download:
 *   get:
 *     summary: Mengunduh laporan transaksi dalam format PDF
 *     description: Endpoint ini digunakan oleh admin untuk mengunduh laporan transaksi dalam bentuk file PDF.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID laporan yang ingin diunduh
 *         example: "report-JYHslXnOSjUi6m_g"
 *     responses:
 *       200:
 *         description: Berhasil mengunduh laporan dalam format PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *               example: (Binary PDF Data)
 *       400:
 *         description: Parameter ID tidak valid
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
 *                   example: "ID laporan tidak valid"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses sebagai admin
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
 *                   example: "Token tidak valid atau tidak memiliki akses"
 *       404:
 *         description: Laporan tidak ditemukan
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
 *                   example: "Laporan tidak ditemukan"
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: "Terjadi kesalahan pada server"
 */

  router.get('/v1/reports/:id/download', verifyToken, verifyAdmin, handler.getDownloadReportHandler);
  /**
 * @swagger
 * /v1/reports/{id}:
 *   delete:
 *     summary: Menghapus laporan berdasarkan ID
 *     description: Endpoint ini digunakan oleh admin untuk menghapus laporan dari sistem.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID laporan yang ingin dihapus
 *         example: "report-JYHslXnOSjUi6m_g"
 *     responses:
 *       200:
 *         description: Laporan berhasil dihapus
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
 *                   example: "report-JYHslXnOSjUi6m_g berhasil dihapus"
 *       400:
 *         description: Parameter ID tidak valid
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
 *                   example: "ID laporan tidak valid"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses sebagai admin
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
 *                   example: "Token tidak valid atau tidak memiliki akses"
 *       404:
 *         description: Laporan tidak ditemukan
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
 *                   example: "Laporan tidak ditemukan"
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: "Terjadi kesalahan pada server"
 */

  router.delete('/v1/reports/:id', verifyToken, verifyAdmin, verifyToken, verifyAdmin, handler.deleteReportHandler);

  return router;
};

export default reportRoutes;

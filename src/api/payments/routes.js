/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const paymentRoutes = (handler) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Payments
   *   description: API untuk mengelola pembayaran
   */
  /**
 * @swagger
 * /v1/payments:
 *   get:
 *     summary: Mendapatkan daftar semua pembayaran
 *     description: Endpoint ini digunakan untuk mengambil semua data pembayaran yang tersedia. Hanya admin yang dapat mengaksesnya.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar pembayaran
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
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "payment-bypAYY7iQ7N66I-O"
 *                             description: ID unik dari pembayaran
 *                           rental_id:
 *                             type: string
 *                             example: "rental-wyO0Kj"
 *                             description: ID unik dari sewa yang terkait dengan pembayaran
 *                           amount:
 *                             type: string
 *                             example: "32400000.00"
 *                             description: Jumlah pembayaran dalam format desimal
 *                           payment_status:
 *                             type: string
 *                             enum: ["pending", "completed", "failed"]
 *                             example: "failed"
 *                             description: Status pembayaran (pending, completed, failed)
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

  router.get('/v1/payments', verifyToken, verifyAdmin, handler.getAllPaymentsHandler);

  /**
 * @swagger
 * /v1/payments/{id}:
 *   get:
 *     summary: Mendapatkan detail pembayaran berdasarkan ID
 *     description: Endpoint ini digunakan untuk mengambil informasi detail dari pembayaran tertentu berdasarkan ID. Hanya admin yang dapat mengaksesnya.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID unik dari pembayaran
 *         example: "payment-SrYVWTwATLYoT7QD"
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail pembayaran
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
 *                     payment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "payment-SrYVWTwATLYoT7QD"
 *                           description: ID unik dari pembayaran
 *                         rental_id:
 *                           type: string
 *                           example: "rental-Sw1_PD"
 *                           description: ID unik dari sewa yang terkait dengan pembayaran
 *                         amount:
 *                           type: string
 *                           example: "17100000.00"
 *                           description: Jumlah pembayaran dalam format desimal
 *                         payment_date:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                           description: Tanggal pembayaran (jika sudah dilakukan)
 *                         payment_status:
 *                           type: string
 *                           enum: ["pending", "completed", "failed"]
 *                           example: "pending"
 *                           description: Status pembayaran
 *                         payment_method:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                           description: Metode pembayaran yang digunakan
 *                         transaction_description:
 *                           type: string
 *                           nullable: true
 *                           example: null
 *                           description: Deskripsi transaksi pembayaran
 *                         is_deleted:
 *                           type: boolean
 *                           example: false
 *                           description: Status apakah pembayaran telah dihapus atau tidak
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-10T22:05:58.443Z"
 *                           description: Tanggal pembuatan pembayaran
 *       400:
 *         description: Request tidak valid (misalnya parameter tidak sesuai format)
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
 *                   example: "Parameter tidak valid"
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
 *         description: Pembayaran tidak ditemukan
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
 *                   example: "pembayaran tidak ditemukan"
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
  router.get('/v1/payments/:id', verifyToken, verifyAdmin, handler.getDetailPaymentHandler);
  /**
 * @swagger
 * /v1/payments/{id}:
 *   put:
 *     summary: Verifikasi pembayaran berdasarkan ID
 *     description: Endpoint ini digunakan oleh admin untuk memverifikasi pembayaran dan mengubah status rental yang terkait.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID unik dari pembayaran yang akan diverifikasi
 *         example: "payment-SrYVWTwATLYoT7QD"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: ["completed"]
 *                 example: "completed"
 *                 description: Status pembayaran setelah diverifikasi
 *               paymentMethod:
 *                 type: string
 *                 example: "bank_transfer"
 *                 description: Metode pembayaran yang digunakan
 *               transactionDescription:
 *                 type: string
 *                 example: "Pembayaran berhasil via transfer bank"
 *                 description: Deskripsi transaksi pembayaran
 *     responses:
 *       200:
 *         description: Berhasil memverifikasi pembayaran dan mengaktifkan rental terkait
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
 *                   example: "Pembayaran payment-SrYVWTwATLYoT7QD berhasil diverifikasi dan rental telah active"
 *       400:
 *         description: Request tidak valid (misalnya format input salah)
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
 *                   example: "Input tidak valid"
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
 *         description: Pembayaran tidak ditemukan
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
 *                   example: "Pembayaran tidak ditemukan"
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

  router.put('/v1/payments/:id', verifyToken, verifyAdmin, handler.putVerificationPaymentHandler);
  /**
 * @swagger
 * /v1/payments/{id}:
 *   patch:
 *     summary: Hapus pembayaran secara soft delete
 *     description: Endpoint ini digunakan oleh admin untuk menandai pembayaran sebagai dihapus tanpa benar-benar menghapusnya dari database.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID unik dari pembayaran yang akan dihapus
 *         example: "payment-SrYVWTwATLYoT7QD"
 *     responses:
 *       200:
 *         description: Berhasil menandai pembayaran sebagai dihapus
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
 *                   example: "payment-SrYVWTwATLYoT7QD berhasil dihapus"
 *       400:
 *         description: Request tidak valid (misalnya format ID salah)
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
 *                   example: "Input tidak valid"
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
 *         description: Pembayaran tidak ditemukan
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
 *                   example: "Pembayaran tidak ditemukan"
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

  router.patch('/v1/payments/:id', verifyToken, verifyAdmin, handler.deletePaymentHandler);

  return router;
};

export default paymentRoutes;

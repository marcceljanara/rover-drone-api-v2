/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const rentalRoutes = (handler) => {
  const router = express.Router();

  // Admin
  /**
   * @swagger
   * tags:
   *   name: Rentals
   *   description: API untuk mengelola penyewaan/rentals
   */

  /**
 * @swagger
 * /v1/rentals/{id}/status:
 *   put:
 *     summary: "Mengubah status rental (auth: admin)"
 *     description: "Mengubah status rental berdasarkan ID rental. Hanya admin yang dapat mengubah status rental."
 *     tags:
 *       - Rentals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID rental yang ingin diubah statusnya"
 *         schema:
 *           type: string
 *           example: "rental-abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rentalStatus:
 *                 type: string
 *                 enum: [active, completed, cancelled]
 *                 description: "Status baru rental: 'active' untuk mengaktifkan, 'completed' untuk menyelesaikan, atau 'cancelled' untuk membatalkan."
 *                 example: "active"
 *     responses:
 *       200:
 *         description: "Status rental berhasil diperbarui"
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
 *                   example: "status rental rental-abcdef menjadi active"
 *       403:
 *         description: "User tidak memiliki izin untuk mengubah status rental"
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
 *                   example: "Anda tidak memiliki izin untuk mengubah status rental ini"
 *       404:
 *         description: "Rental tidak ditemukan"
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
 *                   example: "rental tidak ditemukan"
 */

  router.put('/v1/rentals/:id/status', verifyToken, verifyAdmin, handler.putStatusRentalHandler);

  /**
 * @swagger
 * /v1/rentals/{id}:
 *   put:
 *     summary: "Menghapus rental (auth: admin)"
 *     description: "Menghapus rental berdasarkan ID rental. Hanya admin yang dapat menghapus rental."
 *     tags:
 *       - Rentals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID rental yang akan dihapus"
 *         schema:
 *           type: string
 *           example: "rental-abcdef"
 *     responses:
 *       200:
 *         description: "Rental berhasil dihapus"
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
 *                   example: "rental-abcdef berhasil dihapus"
 *       403:
 *         description: "User tidak memiliki izin untuk menghapus rental"
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
 *                   example: "Anda tidak memiliki izin untuk menghapus rental ini"
 *       404:
 *         description: "Rental tidak ditemukan"
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
 *                   example: "Rental tidak ditemukan"
 *       400:
 *         description: "Rental dengan status active tidak bisa dihapus"
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
 *                   example: "Tidak dapat menghapus rental dengan status active"
 */

  router.put('/v1/rentals/:id', verifyToken, verifyAdmin, handler.deleteRentalHandler);

  // User (same id)
  /**
 * @swagger
 * /v1/rentals:
 *   post:
 *     summary: "Mengajukan penyewaan rental (auth: user)"
 *     description: "User dapat mengajukan penyewaan rental dengan memilih interval 6, 12, 24, atau 36 bulan. Admin tidak diperbolehkan mengajukan rental."
 *     tags:
 *       - Rentals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interval:
 *                 type: number
 *                 enum: [6, 12, 24, 36]
 *                 example: 12
 *     responses:
 *       201:
 *         description: "Berhasil mengajukan penyewaan rental"
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
 *                   example: "Berhasil mengajukan penyewaan, silahkan melakukan pembayaran sebesar 500000 dengan catatan menulis (Pembayaran rental-abcdef)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "rental-abcdef"
 *                     paymentId:
 *                       type: string
 *                       example: "payment-1234567890abcdef"
 *       400:
 *         description: "Interval tidak valid atau tidak ada perangkat yang tersedia"
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
 *                   example: "Interval rental harus 6, 12, 24, atau 36 bulan"
 *       403:
 *         description: "Admin tidak dapat mengajukan rental"
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
 *                   example: "Admin tidak bisa melakukan aksi mengajukan rental"
 *       404:
 *         description: "Tidak ada perangkat yang tersedia untuk disewakan"
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
 *                   example: "Tidak ada perangkat yang tersedia untuk disewakan"
 */

  router.post('/v1/rentals', verifyToken, handler.postAddRentalHandler);
  /**
 * @swagger
 * /v1/rentals:
 *   get:
 *     summary: "Mendapatkan daftar semua rental (auth: user/admin)"
 *     description: "Mengembalikan daftar rental yang dimiliki oleh user jika role adalah 'user', atau semua rental jika role adalah 'admin'."
 *     tags:
 *       - Rentals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Berhasil mendapatkan daftar rental"
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
 *                     rentals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "rental-abcdef"
 *                           start_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-03-09T10:00:00+07:00"
 *                           end_date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-03-09T10:00:00+07:00"
 *                           rental_status:
 *                             type: string
 *                             enum: ["pending", "active", "completed", "canceled"]
 *                             example: "active"
 *                           cost:
 *                             type: number
 *                             example: 500000
 */

  router.get('/v1/rentals', verifyToken, handler.getAllRentalHandler);
  /**
 * @swagger
 * /v1/rentals/{id}:
 *   get:
 *     summary: "Mendapatkan detail rental berdasarkan ID (auth: user/admin)"
 *     description: "Mengembalikan detail rental berdasarkan ID. Jika role adalah 'user', hanya dapat mengakses rental miliknya. Jika role adalah 'admin', dapat mengakses semua rental."
 *     tags:
 *       - Rentals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID rental yang ingin diambil detailnya"
 *         schema:
 *           type: string
 *           example: "rental-abcdef"
 *     responses:
 *       200:
 *         description: "Berhasil mendapatkan detail rental"
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
 *                     rental:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "rental-abcdef"
 *                         user_id:
 *                           type: string
 *                           example: "user-12345"
 *                         start_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-09T10:00:00+07:00"
 *                         end_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-03-09T10:00:00+07:00"
 *                         rental_status:
 *                           type: string
 *                           enum: ["pending", "active", "completed", "canceled"]
 *                           example: "active"
 *                         cost:
 *                           type: number
 *                           example: 500000
 *                         reserved_until:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-09T10:30:00+07:00"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-09T09:55:00+07:00"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-09T10:05:00+07:00"
 *       403:
 *         description: "User tidak memiliki izin untuk melihat rental ini"
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
 *                   example: "Anda tidak memiliki izin untuk melihat rental ini"
 *       404:
 *         description: "Rental tidak ditemukan"
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
 *                   example: "rental tidak ditemukan"
 */

  router.get('/v1/rentals/:id', verifyToken, handler.getDetailRentalHandler);
  /**
 * @swagger
 * /v1/rentals/{id}/cancel:
 *   put:
 *     summary: "Membatalkan rental (auth: user)"
 *     description: "User dapat membatalkan rental miliknya. Admin tidak diizinkan untuk membatalkan rental."
 *     tags:
 *       - Rentals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "ID rental yang ingin dibatalkan"
 *         schema:
 *           type: string
 *           example: "rental-abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rentalStatus:
 *                 type: string
 *                 enum: ["cancelled"]
 *                 example: "cancelled"
 *     responses:
 *       200:
 *         description: "Rental berhasil dibatalkan"
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
 *                   example: "rental berhasil dibatalkan"
 *       403:
 *         description: "Admin tidak dapat membatalkan rental"
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
 *                   example: "admin tidak bisa membatalkan pengajuan rental"
 *       404:
 *         description: "Rental tidak ditemukan"
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
 *                   example: "rental tidak ditemukan"
 */

  router.put('/v1/rentals/:id/cancel', verifyToken, handler.putCancelRentalHandler);

  return router;
};

export default rentalRoutes;

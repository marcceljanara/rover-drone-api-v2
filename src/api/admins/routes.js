/* eslint-disable max-len */
import express from 'express';
import verifyAdmin from '../../middleware/verifyAdmin.js';
import verifyToken from '../../middleware/verifyToken.js';

const adminRoutes = (handler) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Admins
   *   description: API untuk mengelola users oleh admin
   */

  /**
 * @swagger
 * /v1/admin:
 *   post:
 *     summary: Mendaftarkan user baru oleh admin
 *     description: Admin dapat mendaftarkan user baru dengan memberikan informasi yang diperlukan.
 *     tags:
 *       - Admins
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - fullname
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 maxLength: 50
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *               fullname:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *     responses:
 *       201:
 *         description: User berhasil didaftarkan oleh admin
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
 *                   example: "User berhasil didaftarkan oleh admin"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "user-123456789abcdef"
 *       400:
 *         description: Validasi gagal atau user sudah ada
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
 *                   example: "Username atau email sudah digunakan"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak ada akses
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
 *                   example: "Token tidak valid atau tidak ada akses"
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
  router.post('/v1/admin', verifyToken, verifyAdmin, handler.postRegisterUserByAdminHandler);
  /**
 * @swagger
 * /v1/admin:
 *   get:
 *     summary: Mendapatkan daftar pengguna
 *     description: Endpoint ini digunakan untuk mendapatkan daftar pengguna dengan fitur pencarian dan paginasi. Hanya admin yang dapat mengaksesnya.
 *     tags:
 *       - Admins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Jumlah data yang ingin ditampilkan per halaman.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Halaman yang ingin diakses.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           default: ""
 *         description: Kata kunci untuk mencari pengguna berdasarkan username, email, atau ID.
 *     responses:
 *       200:
 *         description: Data user berhasil diperoleh
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
 *                   example: "Data user berhasil diperoleh"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "user-123456789abcdef"
 *                           username:
 *                             type: string
 *                             example: "johndoe"
 *                           email:
 *                             type: string
 *                             example: "johndoe@example.com"
 *                           is_verified:
 *                             type: boolean
 *                             example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Validasi query gagal
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
 *                   example: "Query parameter tidak valid"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses
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
  router.get('/v1/admin', verifyToken, verifyAdmin, handler.getAllUserHandler);

  /**
 * @swagger
 * /v1/admin/{id}:
 *   get:
 *     summary: Mendapatkan detail pengguna
 *     description: Endpoint ini digunakan untuk mendapatkan informasi detail dari seorang pengguna berdasarkan ID. Hanya admin yang dapat mengaksesnya.
 *     tags:
 *       - Admins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pengguna yang ingin diambil datanya.
 *     responses:
 *       200:
 *         description: Data user berhasil diperoleh
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user-123456789abcdef"
 *                         username:
 *                           type: string
 *                           example: "johndoe"
 *                         email:
 *                           type: string
 *                           example: "johndoe@example.com"
 *                         fullname:
 *                           type: string
 *                           example: "John Doe"
 *                         is_verified:
 *                           type: boolean
 *                           example: true
 *                         role:
 *                           type: string
 *                           example: "user"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-10T12:00:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-11T12:00:00Z"
 *       400:
 *         description: ID tidak valid
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
 *                   example: "Parameter ID tidak valid"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses
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
 *         description: User tidak ditemukan
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
 *                   example: "User tidak ditemukan"
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
  router.get('/v1/admin/:id', verifyToken, verifyAdmin, handler.getDetailUserHandler);

  /**
 * @swagger
 * /v1/admin/{id}:
 *   delete:
 *     summary: Menghapus pengguna
 *     description: Endpoint ini digunakan untuk menghapus pengguna berdasarkan ID. Hanya admin yang dapat mengaksesnya.
 *     tags:
 *       - Admins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pengguna yang ingin dihapus.
 *     responses:
 *       200:
 *         description: User berhasil dihapus
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
 *                   example: "user berhasil dihapus"
 *       400:
 *         description: ID tidak valid
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
 *                   example: "Parameter ID tidak valid"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses
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
 *       403:
 *         description: Admin tidak diperbolehkan menghapus sesama admin
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
 *                   example: "Anda tidak diperbolehkan menghapus sesama admin"
 *       404:
 *         description: User tidak ditemukan
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
 *                   example: "User tidak ditemukan"
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
  router.delete('/v1/admin/:id', verifyToken, verifyAdmin, handler.deleteUserHandler);
  /**
 * @swagger
 * /v1/admin/{id}:
 *   put:
 *     summary: Mengubah password pengguna
 *     description: Endpoint ini digunakan untuk mengganti password pengguna berdasarkan ID. Hanya admin yang dapat mengaksesnya.
 *     tags:
 *       - Admins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pengguna yang ingin diubah passwordnya.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confNewPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "PasswordBaru123!"
 *                 description: Password baru yang ingin diatur.
 *               confNewPassword:
 *                 type: string
 *                 example: "PasswordBaru123!"
 *                 description: Konfirmasi password baru yang harus sama dengan newPassword.
 *     responses:
 *       200:
 *         description: Password user berhasil diubah
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
 *                   example: "password user berhasil diubah"
 *       400:
 *         description: Data yang dikirim tidak valid atau password tidak cocok
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
 *                   example: "Password dan Konfirmasi Password Tidak Cocok"
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak memiliki akses
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
 *       403:
 *         description: Admin tidak diperbolehkan mengubah password sesama admin
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
 *                   example: "Anda tidak diperbolehkan mengubah password sesama admin"
 *       404:
 *         description: User tidak ditemukan
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
 *                   example: "User tidak ditemukan"
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

  router.put('/v1/admin/:id', verifyToken, verifyAdmin, handler.putPasswordUserHandler);

  return router;
};

export default adminRoutes;

/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateContentType from '../../middleware/validateContentType.js';

const userRoutes = (handler) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: Users
   *   description: API untuk mengelola pengguna
   */

  /**
   * @swagger
   * /v1/users/register:
   *   post:
   *     summary: Mendaftarkan pengguna baru
   *     tags: [Users]
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
   *                 example: johndoe
   *               password:
   *                 type: string
   *                 example: secret123
   *               fullname:
   *                 type: string
   *                 example: John Doe
   *               email:
   *                 type: string
   *                 example: johndoe@example.com
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
   *                   example: User berhasil didaftarkan. Silakan verifikasi email Anda.
   *                 data:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *       400:
   *         description: Invalid payload, pengguna gagal ditambahkan
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
   *                   example: \"username\" atau Gagal menambahkan user, atau Email atau username..

   */
  router.post('/register', validateContentType('application/json'), handler.postRegisterUserHandler);

  /**
   * @swagger
   * /v1/users/verify-otp:
   *   post:
   *     summary: Verifikasi OTP pengguna
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - otp
   *             properties:
   *               email:
   *                 type: string
   *                 example: johndoe@example.com
   *               otp:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Verifikasi berhasil
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
   *                   example: Verifikasi berhasil. Akun Anda telah aktif.
   *       401:
   *         description: Kode OTP salah atau kadaluarsa
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
   *                   example: Kode OTP salah atau Kode OTP telah kadaluarsa
   *       404:
   *         description: Email tidak ditemukan
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
   *                   example: Email tidak ditemukan
   */
  router.post('/verify-otp', validateContentType('application/json'), handler.postVerifyOtpHandler);

  /**
   * @swagger
   * /v1/users/resend-otp:
   *   post:
   *     summary: Mengirim ulang kode OTP
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 example: johndoe@example.com
   *     responses:
   *       200:
   *         description: Kode OTP telah dikirim ulang
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
   *                   example: Kode OTP telah dikirim ulang ke email Anda.
   *       400:
   *         description: Akun telah terverifikasi atau email ditemukan
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
   *                   example: Email tidak ditemukan atau akun telah terverifikasi
   */
  router.post('/resend-otp', validateContentType('application/json'), handler.postResendOtpHandler);

  /**
 * @swagger
 * /v1/users/addresses:
 *   post:
 *     summary: "Menambahkan alamat pengiriman baru (auth: user)"
 *     description: "User dapat menambahkan alamat pengiriman ke akun mereka. Jika `isDefault` diset true, maka alamat ini akan dijadikan alamat utama, dan alamat lain akan di-set sebagai non-default."
 *     tags:
 *       - User Addresses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - namaPenerima
 *               - noHp
 *               - alamatLengkap
 *               - provinsi
 *               - kabupatenKota
 *               - kecamatan
 *               - kelurahan
 *               - kodePos
 *               - isDefault
 *             properties:
 *               namaPenerima:
 *                 type: string
 *                 example: "Budi Santoso"
 *               noHp:
 *                 type: string
 *                 example: "081234567890"
 *               alamatLengkap:
 *                 type: string
 *                 example: "Jl. Merpati No. 12"
 *               provinsi:
 *                 type: string
 *                 example: "Lampung"
 *               kabupatenKota:
 *                 type: string
 *                 example: "Tanggamus"
 *               kecamatan:
 *                 type: string
 *                 example: "Wonosobo"
 *               kelurahan:
 *                 type: string
 *                 example: "Air Kubang"
 *               kodePos:
 *                 type: string
 *                 example: "35365"
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: "Alamat berhasil ditambahkan"
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
 *                   example: "Alamat pengiriman berhasil ditambahkan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     addressId:
 *                       type: string
 *                       example: "address-abcde"
 *       400:
 *         description: "Payload tidak valid"
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
 *                   example: "Validasi gagal: namaPenerima wajib diisi"
 *       500:
 *         description: "Kesalahan server saat menambahkan alamat"
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

  router.post('/addresses', verifyToken, validateContentType('application/json'), handler.postAddressHandler);

  /**
 * @swagger
 * /v1/users/addresses:
 *   get:
 *     summary: "Mengambil semua alamat pengiriman milik user (auth: user)"
 *     description: "Mengembalikan daftar alamat pengiriman milik user yang belum dihapus (is_deleted = false), diurutkan berdasarkan waktu pembaruan terakhir."
 *     tags:
 *       - User Addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Daftar alamat berhasil diambil"
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
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "address-abcde"
 *                           nama_penerima:
 *                             type: string
 *                             example: "Budi Santoso"
 *                           no_hp:
 *                             type: string
 *                             example: "081234567890"
 *                           alamat_lengkap:
 *                             type: string
 *                             example: "Jl. Merpati No. 12"
 *                           kelurahan:
 *                             type: string
 *                             example: "Air Kubang"
 *                           is_default:
 *                             type: boolean
 *                             example: true
 *       404:
 *         description: "User belum memiliki alamat pengiriman"
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
 *                   example: "Belum ada alamat pengiriman!"
 *       500:
 *         description: "Kesalahan server saat mengambil data alamat"
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

  router.get('/addresses', verifyToken, handler.getAllAddressHandler);

  /**
 * @swagger
 * /v1/users/addresses/{id}:
 *   get:
 *     summary: "Mengambil detail alamat pengiriman milik user (auth: user)"
 *     description: "Mengembalikan detail alamat pengiriman tertentu milik user yang belum dihapus berdasarkan ID."
 *     tags:
 *       - User Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID alamat pengiriman yang ingin diambil
 *         example: address-abcde
 *     responses:
 *       200:
 *         description: "Detail alamat berhasil diambil"
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
 *                     address:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: address-abcde
 *                         nama_penerima:
 *                           type: string
 *                           example: Budi Santoso
 *                         no_hp:
 *                           type: string
 *                           example: 081234567890
 *                         alamat_lengkap:
 *                           type: string
 *                           example: Jl. Merpati No. 12
 *                         provinsi:
 *                           type: string
 *                           example: Lampung
 *                         kabupaten_kota:
 *                           type: string
 *                           example: Tanggamus
 *                         kecamatan:
 *                           type: string
 *                           example: Talang Padang
 *                         kelurahan:
 *                           type: string
 *                           example: Air Kubang
 *                         kode_pos:
 *                           type: string
 *                           example: 35384
 *                         is_default:
 *                           type: boolean
 *                           example: true
 *       404:
 *         description: "Alamat tidak ditemukan"
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
 *                   example: Pengguna atau alamat tidak ditemukan
 *       500:
 *         description: "Kesalahan server saat mengambil detail alamat"
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
 *                   example: Terjadi kesalahan pada server
 */

  router.get('/addresses/:id', verifyToken, handler.getDetailAddressHandler);

  /**
 * @swagger
 * /v1/users/addresses/{id}:
 *   put:
 *     summary: Memperbarui alamat pengiriman user
 *     description: Mengubah data alamat pengiriman berdasarkan ID alamat yang dimiliki oleh user.
 *     tags:
 *       - User Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID alamat yang ingin diperbarui
 *         schema:
 *           type: string
 *         example: address-abcde
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - namaPenerima
 *               - noHp
 *               - alamatLengkap
 *               - provinsi
 *               - kabupatenKota
 *               - kecamatan
 *               - kelurahan
 *               - kodePos
 *               - isDefault
 *             properties:
 *               namaPenerima:
 *                 type: string
 *                 example: Budi Santoso
 *               noHp:
 *                 type: string
 *                 example: 081234567890
 *               alamatLengkap:
 *                 type: string
 *                 example: Jl. Merpati No. 12
 *               provinsi:
 *                 type: string
 *                 example: Lampung
 *               kabupatenKota:
 *                 type: string
 *                 example: Tanggamus
 *               kecamatan:
 *                 type: string
 *                 example: Talang Padang
 *               kelurahan:
 *                 type: string
 *                 example: Air Kubang
 *               kodePos:
 *                 type: string
 *                 example: 35384
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Alamat berhasil diperbarui
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
 *                   example: Alamat pengiriman berhasil diperbarui!
 *                 data:
 *                   type: object
 *                   properties:
 *                     addressId:
 *                       type: string
 *                       example: address-abcde
 *       404:
 *         description: Alamat tidak ditemukan atau bukan milik user
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
 *                   example: Gagal memperbarui alamat. Alamat tidak ditemukan atau bukan milik user.
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: Terjadi kesalahan pada server
 */

  router.put('/addresses/:id', verifyToken, validateContentType('application/json'), handler.putAddressHandler);

  /**
 * @swagger
 * /v1/users/addresses/{id}:
 *   patch:
 *     summary: Menetapkan alamat utama (default) untuk pengguna
 *     description: Menjadikan alamat dengan ID tertentu sebagai alamat utama pengguna. Alamat lain akan di-set sebagai non-default.
 *     tags:
 *       - User Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID alamat yang akan dijadikan default
 *         schema:
 *           type: string
 *         example: address-xyz12
 *     responses:
 *       200:
 *         description: Alamat utama berhasil diperbarui
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
 *                   example: Alamat pengiriman utama berhasil diperbarui
 *       404:
 *         description: Alamat tidak ditemukan atau bukan milik user
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
 *                   example: Gagal memperbarui alamat. Alamat tidak ditemukan atau bukan milik user.
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: Terjadi kesalahan pada server
 */

  router.patch('/addresses/:id', verifyToken, validateContentType('application/json'), handler.patchSetDefaultAddress);

  /**
 * @swagger
 * /v1/users/addresses/{id}:
 *   delete:
 *     summary: Menghapus alamat pengguna
 *     description: Menghapus alamat berdasarkan ID untuk pengguna yang sedang login (soft delete).
 *     tags:
 *       - User Addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID alamat yang akan dihapus
 *         schema:
 *           type: string
 *         example: address-xyz12
 *     responses:
 *       200:
 *         description: Alamat berhasil dihapus
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
 *                   example: Alamat pengiriman berhasil dihapus!
 *       404:
 *         description: Alamat tidak ditemukan atau bukan milik user
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
 *                   example: Gagal menghapus alamat. Alamat tidak ditemukan atau bukan milik user.
 *       500:
 *         description: Terjadi kesalahan pada server
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
 *                   example: Terjadi kesalahan pada server
 */

  router.delete('/addresses/:id', verifyToken, handler.deleteAddressHandler);

  return router;
};

export default userRoutes;

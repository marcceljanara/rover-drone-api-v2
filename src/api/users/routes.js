import express from 'express';

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
  router.post('/register', handler.postRegisterUserHandler);

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
  router.post('/verify-otp', handler.postVerifyOtpHandler);

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
  router.post('/resend-otp', handler.postResendOtpHandler);

  return router;
};

export default userRoutes;

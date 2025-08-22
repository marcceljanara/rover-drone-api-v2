import express from 'express';

const authenticationRoutes = (handler) => {
  const router = express.Router();

  /**
   * @swagger
   * tags:
   *  name: Authentications
   *  description: API untuk mengelola authentikasi
   */

  /**
   * @swagger
   * /v1/authentications:
   *   post:
   *     summary: Melakukan login dan menambahkan refreshToken ke basis data
   *     tags: [Authentications]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: johndoe@example.com
   *               password:
   *                 type: string
   *                 example: secret123
   *     responses:
   *       201:
   *         description: Authentication berhasil ditambahkan
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
   *                   example: Authentication berhasil ditambahkan
   *                 data:
   *                   type: object
   *                   properties:
   *                     :
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....."
   *                     refreshToken:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....."
   *
   *       400:
   *         description: Authentication gagal, invalid payload
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
   *                   example: \"email\" is required
   *       401:
   *         description: Authentication gagal, kesalahan kredensial
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
   *                   example: Kredensial yang Anda berikan salah
   *       403:
   *         description: Authentication gagal, pengguna belum terverifikasi
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
   *                   example: Anda belum melakukan verifikasi email, silahkan lakukan verifikasi..
   *       404:
   *         description: Authentication gagal, pengguna belum terdaftar
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
   *
   */
  router.post('/v1/authentications', handler.postAuthenticationHandler);
  /**
   * @swagger
   * /v1/authentications:
   *   put:
   *     summary: Melakukan pembaruan accessToken hasil generate refreshToken
   *     tags: [Authentications]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.....
   *     responses:
   *       200:
   *         description: Access Token berhasil diperbaharui
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
   *                   example: Access Token berhasil diperbarui
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....."
   *
   *       400:
   *         description: Invalid payload refreshToken
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
   *                   example: \"refreshToken\" is required atau Refresh token tidak valid
   */
  router.put('/v1/authentications', handler.putAuthenticationHandler);
  /**
   * @swagger
   * /v1/authentications:
   *   delete:
   *     summary: Melakukan proses logout dan menghapus refreshToken
   *     tags: [Authentications]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.....
   *     responses:
   *       200:
   *         description: Menghapus refreshToken
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
   *                   example: Refresh token berhasil dihapus
   *
   *       400:
   *         description: Invalid payload refreshToken
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
   *                   example: \"refreshToken\" is required atau Refresh token tidak valid
   */
  router.delete('/v1/authentications', handler.deleteAuthenticationHandler);

  router.get('/v1/authentications/google', handler.getGoogleAuthenticationHandler);

  router.get('/v1/authentications/google/callback', handler.getGoogleAuthenticationCallbackHandler);

  return router;
};

export default authenticationRoutes;

/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';
import upload from '../../middleware/uploadImage.js';

const shipmentRoutes = (handler) => {
  const router = express.Router();

  // =============================
  // SHIPMENTS ROUTES (PENGIRIMAN)
  // =============================

  // Ambil detail pengiriman berdasarkan rentalId
  /**
 * @swagger
 * /v1/shipments/{id}:
 *   get:
 *     summary: Mendapatkan detail pengiriman berdasarkan rental ID
 *     description: Mengambil data pengiriman dari tabel `shipment_orders` berdasarkan rental ID.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID penyewaan perangkat (rental ID)
 *         schema:
 *           type: string
 *         example: rental-abc123
 *     responses:
 *       200:
 *         description: Detail pengiriman ditemukan
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
 *                     shipment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         rental_id:
 *                           type: string
 *                         receiver_name:
 *                           type: string
 *                         expedition_name:
 *                           type: string
 *                         service_name:
 *                           type: string
 *                         shipping_cost:
 *                           type: integer
 *                         tracking_number:
 *                           type: string
 *                         etd:
 *                           type: string
 *                         status:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Pengiriman tidak ditemukan
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
 *                   example: Pengiriman tidak ditemukan
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

  router.get('/v1/shipments/:id', verifyToken, handler.getShipmentByRentalIdHandler);

  // Ambil semua data pengiriman (admin only)
  /**
 * @swagger
 * /v1/shipments:
 *   get:
 *     summary: Mendapatkan daftar seluruh pengiriman
 *     description: Endpoint ini hanya bisa diakses oleh admin untuk melihat semua data pengiriman, dengan opsi filter berdasarkan status pengiriman atau nama kurir.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: "Filter berdasarkan status pengiriman (contoh: 'pending', 'shipped', 'delivered')"
 *         example: shipped
 *       - in: query
 *         name: courierName
 *         schema:
 *           type: string
 *         required: false
 *         description: "Filter berdasarkan nama kurir (case-insensitive)"
 *         example: JNE
 *     responses:
 *       200:
 *         description: Daftar pengiriman berhasil diambil
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
 *                     shipments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           rental_id:
 *                             type: string
 *                           receiver_name:
 *                             type: string
 *                           expedition_name:
 *                             type: string
 *                           service_name:
 *                             type: string
 *                           shipping_cost:
 *                             type: integer
 *                           tracking_number:
 *                             type: string
 *                           shipping_status:
 *                             type: string
 *                           etd:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *       403:
 *         description: Hanya admin yang diperbolehkan mengakses
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
 *                   example: Akses ditolak. Hanya admin yang bisa mengakses data ini.
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

  router.get('/v1/shipments', verifyToken, verifyAdmin, handler.getAllShipmentsHandler);

  // Update informasi pengiriman seperti kurir, nomor resi, estimasi pengiriman, catatan
  /**
 * @swagger
 * /v1/shipments/{id}/info:
 *   put:
 *     summary: Memperbarui informasi pengiriman
 *     description: Hanya admin yang dapat memperbarui informasi kurir, layanan, dan nomor resi untuk suatu pengiriman.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dari pengiriman yang ingin diperbarui
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courierName:
 *                 type: string
 *                 example: JNE
 *               courierService:
 *                 type: string
 *                 example: REG
 *               trackingNumber:
 *                 type: string
 *                 example: JNE123456789
 *               notes:
 *                 type: string
 *                 example: Kirim pada jam kerja
 *     responses:
 *       200:
 *         description: Informasi pengiriman berhasil diperbarui
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
 *                   example: Informasi pengiriman berhasil diperbarui
 *       400:
 *         description: Permintaan tidak valid (payload salah atau ID tidak sesuai format)
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
 *                   example: "Validasi gagal: trackingNumber tidak boleh kosong"
 *       404:
 *         description: Pengiriman tidak ditemukan
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
 *                   example: Pengiriman tidak ditemukan
 *       403:
 *         description: Hanya admin yang dapat mengakses endpoint ini
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
 *                   example: Akses ditolak. Hanya admin yang bisa memperbarui informasi pengiriman.
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

  router.put('/v1/shipments/:id/info', verifyToken, verifyAdmin, handler.putShippingInfoHandler);

  // Update status pengiriman (waiting, packed, shipped, delivered, failed)
  /**
 * @swagger
 * /v1/shipments/{id}/status:
 *   patch:
 *     summary: Memperbarui status pengiriman
 *     description: Hanya admin yang dapat memperbarui status pengiriman. Perubahan status juga dikirim ke antrean pesan (RabbitMQ).
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengiriman
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waiting, packed, shipped, delivered, failed]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Status pengiriman berhasil diperbarui
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
 *                   example: Status pengiriman berhasil diperbarui
 *       400:
 *         description: Status tidak valid atau parameter salah
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
 *                   example: Status pengiriman tidak valid
 *       404:
 *         description: Data pengiriman tidak ditemukan
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
 *                   example: Pengiriman tidak ditemukan
 *       403:
 *         description: Akses ditolak karena bukan admin
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
 *                   example: Akses ditolak. Hanya admin yang bisa memperbarui status pengiriman.
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

  router.patch('/v1/shipments/:id/status', verifyToken, verifyAdmin, handler.patchShippingStatusHandler);

  // Konfirmasi tanggal aktual pengiriman (tanggal barang dikirim)
  /**
 * @swagger
 * /v1/shipments/{id}/actual-shipping:
 *   patch:
 *     summary: Konfirmasi tanggal pengiriman aktual
 *     description: Admin dapat mengonfirmasi tanggal aktual pengiriman barang.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengiriman
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-11"
 *     responses:
 *       200:
 *         description: Tanggal pengiriman aktual berhasil dikonfirmasi
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
 *                   example: Tanggal pengiriman aktual berhasil dikonfirmasi
 *       400:
 *         description: Payload tidak valid
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
 *                   example: Format tanggal tidak valid
 *       404:
 *         description: Data pengiriman tidak ditemukan
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
 *                   example: Pengiriman tidak ditemukan
 *       403:
 *         description: Akses ditolak karena bukan admin
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
 *                   example: Akses ditolak. Hanya admin yang bisa mengonfirmasi tanggal pengiriman.
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

  router.patch('/v1/shipments/:id/actual-shipping', verifyToken, verifyAdmin, handler.patchConfirmActualShippingHandler);

  // Konfirmasi tanggal aktual diterima (tanggal barang sampai)
  /**
 * @swagger
 * /v1/shipments/{id}/actual-delivery:
 *   patch:
 *     summary: Konfirmasi tanggal pengiriman diterima (actual delivery)
 *     description: Admin dapat mengonfirmasi tanggal barang diterima oleh pelanggan.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengiriman
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-11"
 *     responses:
 *       200:
 *         description: Tanggal pengiriman diterima berhasil dikonfirmasi
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
 *                   example: Tanggal pengiriman diterima berhasil dikonfirmasi
 *       400:
 *         description: Payload tidak valid
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
 *                   example: Format tanggal tidak valid
 *       404:
 *         description: Pengiriman tidak ditemukan
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
 *                   example: Pengiriman tidak ditemukan
 *       403:
 *         description: Akses ditolak karena bukan admin
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
 *                   example: Akses ditolak. Hanya admin yang dapat mengonfirmasi pengiriman diterima.
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

  router.patch('/v1/shipments/:id/actual-delivery', verifyToken, verifyAdmin, handler.patchConfirmDeliveryHandler);

  // Upload bukti pengiriman (foto)
  /**
 * @swagger
 * /v1/shipments/{id}/delivery-proof:
 *   post:
 *     summary: Upload bukti pengiriman
 *     description: Admin dapat mengunggah foto sebagai bukti pengiriman perangkat.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengiriman
 *         schema:
 *           type: string
 *       - in: formData
 *         name: photo
 *         required: true
 *         description: File gambar bukti pengiriman (jpeg/jpg/png)
 *         type: file
 *     responses:
 *       201:
 *         description: Bukti pengiriman berhasil diunggah
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
 *                   example: Bukti pengiriman berhasil diunggah
 *                 data:
 *                   type: object
 *                   properties:
 *                     photoUrl:
 *                       type: string
 *                       example: /uploads/delivery-proofs/1718091234567-proof.jpg
 *       400:
 *         description: Format file tidak valid (harus jpeg/jpg/png)
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
 *                   example: File harus berupa gambar (jpeg, jpg, png)
 *       404:
 *         description: Pengiriman tidak ditemukan
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
 *                   example: Pengiriman tidak ditemukan
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

  router.post('/v1/shipments/:id/delivery-proof', verifyToken, upload, handler.uploadDeliveryProofHandler);

  // GET bukti serah terima (delivery proof image URL)
  /**
 * @swagger
 * /v1/shipments/{id}/delivery-proof:
 *   get:
 *     summary: Ambil URL bukti pengiriman
 *     description: Mengambil URL file gambar bukti pengiriman dari shipment tertentu.
 *     tags:
 *       - Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengiriman
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL bukti pengiriman berhasil diambil
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
 *                     deliveryProofUrl:
 *                       type: string
 *                       example: /uploads/delivery-proofs/1718091234567-proof.jpg
 *       404:
 *         description: Data shipment tidak ditemukan
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
 *                   example: Data shipment tidak ditemukan
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

  router.get('/v1/shipments/:id/delivery-proof', verifyToken, handler.getDeliveryProofHandler);

  // ===========================
  // RETURNS ROUTES (PENGEMBALIAN)
  // ===========================

  // Ambil data return berdasarkan rentalId
  /**
 * @swagger
 * /v1/returns/{id}:
 *   get:
 *     summary: Ambil informasi pengembalian perangkat berdasarkan ID penyewaan
 *     description: Mengambil detail informasi pengembalian perangkat dari tabel `return_shipping_info` berdasarkan ID penyewaan.
 *     tags:
 *       - Returns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID penyewaan (rental ID)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informasi return berhasil ditemukan
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
 *                     return:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: return-123
 *                         rental_id:
 *                           type: string
 *                           example: rental-456
 *                         courier_name:
 *                           type: string
 *                           example: JNE
 *                         tracking_number:
 *                           type: string
 *                           example: JNE123456789
 *                         received_date:
 *                           type: string
 *                           format: date-time
 *                           example: 2025-06-10T10:00:00.000Z
 *                         notes:
 *                           type: string
 *                           example: Barang dalam kondisi baik
 *       404:
 *         description: Informasi return tidak ditemukan
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
 *                   example: Informasi return tidak ditemukan
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

  router.get('/v1/returns/:id', verifyToken, handler.getReturnByRentalIdHandler);

  // Ambil semua data return (admin only)
  /**
 * @swagger
 * /v1/returns:
 *   get:
 *     summary: Ambil semua data pengembalian perangkat
 *     description: Endpoint untuk admin mengambil seluruh informasi pengembalian perangkat, dengan opsi filter berdasarkan status dan nama kurir.
 *     tags:
 *       - Returns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "Filter berdasarkan status pengembalian (misalnya: pending, received, failed)"
 *       - in: query
 *         name: courierName
 *         schema:
 *           type: string
 *         description: "Filter berdasarkan nama kurir (misalnya: JNE, TIKI)"
 *     responses:
 *       200:
 *         description: Daftar pengembalian berhasil diambil
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
 *                     returns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: return-123
 *                           rental_id:
 *                             type: string
 *                             example: rental-456
 *                           courier_name:
 *                             type: string
 *                             example: JNE
 *                           tracking_number:
 *                             type: string
 *                             example: JNE123456789
 *                           received_date:
 *                             type: string
 *                             format: date-time
 *                             example: 2025-06-10T10:00:00.000Z
 *                           status:
 *                             type: string
 *                             example: received
 *                           notes:
 *                             type: string
 *                             example: Barang dalam kondisi baik
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

  router.get('/v1/returns', verifyToken, verifyAdmin, handler.getAllReturnsHandler);

  // Update alamat penjemputan pengembalian (maks 2 hari)
  /**
 * @swagger
 * /v1/returns/{id}/address:
 *   patch:
 *     summary: Perbarui alamat penjemputan return
 *     description: Memperbarui alamat penjemputan untuk pengembalian perangkat, hanya dapat dilakukan dalam 2 hari sejak dibuat.
 *     tags:
 *       - Returns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID rental
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAddressId
 *             properties:
 *               newAddressId:
 *                 type: string
 *                 example: address-123
 *                 description: ID alamat baru untuk penjemputan return
 *     responses:
 *       200:
 *         description: Alamat penjemputan return berhasil diperbarui
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
 *                   example: Alamat penjemputan return berhasil diperbarui
 *       400:
 *         description: Batas waktu untuk mengubah alamat sudah lewat
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
 *                   example: Batas waktu untuk mengubah alamat sudah lewat
 *       404:
 *         description: Data tidak ditemukan atau akses ditolak
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
 *                   example: Data pengembalian tidak ditemukan atau Anda tidak berhak mengaksesnya
 *       500:
 *         description: Terjadi kesalahan pada server
 */

  router.patch('/v1/returns/:id/address', verifyToken, handler.patchReturnAddressHandler);

  // Update informasi pengembalian (kurir, nomor resi, estimasi penjemputan)
  /**
 * @swagger
 * /v1/returns/{id}:
 *   put:
 *     summary: Perbarui informasi pengiriman return
 *     description: Admin dapat memperbarui data pengiriman return seperti kurir, layanan, nomor resi, dan waktu penjemputan atau pengembalian.
 *     tags:
 *       - Returns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID return
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courierName:
 *                 type: string
 *                 example: JNE
 *               courierService:
 *                 type: string
 *                 example: YES
 *               trackingNumber:
 *                 type: string
 *                 example: JNE1234567890
 *               pickedUpAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-11T10:00:00.000Z"
 *               returnedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-12T15:00:00.000Z"
 *     responses:
 *       200:
 *         description: Informasi return berhasil diperbarui
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
 *                     return:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: return-123
 *       400:
 *         description: Payload tidak valid
 *       404:
 *         description: Return tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */

  router.put('/v1/returns/:id', verifyToken, verifyAdmin, handler.putReturnShippingInfoHandler);

  // Update status pengembalian
  /**
 * @swagger
 * /v1/returns/{id}/status:
 *   patch:
 *     summary: Perbarui status pengembalian perangkat
 *     description: "Admin dapat memperbarui status pengembalian perangkat dengan status yang diperbolehkan: `requested`, `returning`, `returned`, atau `failed`."
 *     tags:
 *       - Returns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID return
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
 *                 enum: [requested, returning, returned, failed]
 *                 example: returned
 *     responses:
 *       200:
 *         description: Status return berhasil diperbarui
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
 *                   example: Status return berhasil diperbarui
 *       400:
 *         description: Status tidak valid
 *       404:
 *         description: Return tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */

  router.patch('/v1/returns/:id/status', verifyToken, verifyAdmin, handler.patchReturnStatusHandler);

  // Tambah catatan pengembalian
  /**
 * @swagger
 * /v1/returns/{id}/note:
 *   patch:
 *     summary: Tambahkan atau perbarui catatan return
 *     description: Admin dapat menambahkan atau memperbarui catatan terkait pengembalian perangkat.
 *     tags:
 *       - Returns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID return
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 example: Paket diterima dengan kemasan rusak, akan dilakukan pengecekan lebih lanjut.
 *     responses:
 *       200:
 *         description: Catatan return berhasil ditambahkan
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
 *                   example: Catatan return berhasil ditambahkan
 *       404:
 *         description: Return tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */

  router.patch('/v1/returns/:id/note', verifyToken, verifyAdmin, handler.patchReturnNoteHandler);

  return router;
};

export default shipmentRoutes;

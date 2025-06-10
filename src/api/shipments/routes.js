import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const shipmentRoutes = (handler) => {
  const router = express.Router();

  // =============================
  // SHIPMENTS ROUTES (PENGIRIMAN)
  // =============================

  // Ambil detail pengiriman berdasarkan rentalId
  router.get('/v1/shipments/:id', verifyToken, handler.getShipmentByRentalIdHandler);

  // Ambil semua data pengiriman (admin only)
  router.get('/v1/shipments', verifyToken, verifyAdmin, handler.getAllShipmentsHandler);

  // Update informasi pengiriman seperti kurir, nomor resi, estimasi pengiriman, catatan
  router.put('/v1/shipments/:id/info', verifyToken, verifyAdmin, handler.putShippingInfoHandler);

  // Update status pengiriman (waiting, packed, shipped, delivered, failed)
  router.patch('/v1/shipments/:id/status', verifyToken, verifyAdmin, handler.patchShippingStatusHandler);

  // Konfirmasi tanggal aktual pengiriman (tanggal barang dikirim)
  router.patch('/v1/shipments/:id/actual-shipping', verifyToken, verifyAdmin, handler.patchConfirmActualShippingHandler);

  // Konfirmasi tanggal aktual diterima (tanggal barang sampai)
  router.patch('/v1/shipments/:id/actual-delivery', verifyToken, verifyAdmin, handler.patchConfirmDeliveryHandler);

  // ===========================
  // RETURNS ROUTES (PENGEMBALIAN)
  // ===========================

  // Ambil data return berdasarkan rentalId
  router.get('/v1/returns/:id', verifyToken, handler.getReturnByRentalIdHandler);

  // Ambil semua data return (admin only)
  router.get('/v1/returns', verifyToken, verifyAdmin, handler.getAllReturnsHandler);

  // Update alamat penjemputan pengembalian (maks 2 hari)
  router.patch('/v1/returns/:id/address', verifyToken, handler.patchReturnAddressHandler);

  // Update informasi pengembalian (kurir, nomor resi, estimasi penjemputan)
  router.put('/v1/returns/:id', verifyToken, verifyAdmin, handler.putReturnShippingInfoHandler);

  // Update status pengembalian
  router.patch('/v1/returns/:id/status', verifyToken, verifyAdmin, handler.patchReturnStatusHandler);

  // Tambah catatan pengembalian
  router.patch('/v1/returns/:id/note', verifyToken, verifyAdmin, handler.patchReturnNoteHandler);

  return router;
};

export default shipmentRoutes;

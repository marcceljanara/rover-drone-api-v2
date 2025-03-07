import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const paymentRoutes = (handler) => {
  const router = express.Router();

  router.get('/v1/payments', verifyToken, verifyAdmin, handler.getAllPaymentsHandler);
  router.get('/v1/payments/:id', verifyToken, verifyAdmin, handler.getDetailPaymentHandler);
  router.put('/v1/payments/:id', verifyToken, verifyAdmin, handler.putVerificationPaymentHandler);
  router.patch('/v1/payments/:id', verifyToken, verifyAdmin, handler.deletePaymentHandler);

  return router;
};

export default paymentRoutes;

import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const paymentRoutes = (handler) => {
  const router = express.Router();

  router.get('/payments', verifyToken, verifyAdmin, handler.getAllPaymentsHandler);
  router.get('/payments/:id', verifyToken, verifyAdmin, handler.getDetailPaymentHandler);
  router.put('/payments/:id', verifyToken, verifyAdmin, handler.putVerificationPaymentHandler);
  router.patch('/payments/:id', verifyToken, verifyAdmin, handler.deletePaymentHandler);

  return router;
};

export default paymentRoutes;

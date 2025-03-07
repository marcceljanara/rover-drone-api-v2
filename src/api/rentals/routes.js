import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const rentalRoutes = (handler) => {
  const router = express.Router();

  // Admin
  router.put('/v1/rentals/:id/status', verifyToken, verifyAdmin, handler.putStatusRentalHandler);
  router.put('/v1/rentals/:id', verifyToken, verifyAdmin, handler.deleteRentalHandler);

  // User (same id)
  router.post('/v1/rentals', verifyToken, handler.postAddRentalHandler);
  router.get('/v1/rentals', verifyToken, handler.getAllRentalHandler);
  router.put('/v1/rentals/:id/cancel', verifyToken, handler.putCancelRentalHandler);
  router.get('/v1/rentals/:id', verifyToken, handler.getDetailRentalHandler);

  return router;
};

export default rentalRoutes;

import express from 'express';
import verifyAdmin from '../../middleware/verifyAdmin.js';
import verifyToken from '../../middleware/verifyToken.js';

const adminRoutes = (handler) => {
  const router = express.Router();

  router.post('/v1/admin', verifyToken, verifyAdmin, handler.postRegisterUserByAdminHandler);
  router.get('/v1/admin', verifyToken, verifyAdmin, handler.getAllUserHandler);
  router.get('/v1/admin/:id', verifyToken, verifyAdmin, handler.getDetailUserHandler);
  router.delete('/v1/admin/:id', verifyToken, verifyAdmin, handler.deleteUserHandler);
  router.put('/v1/admin/:id', verifyToken, verifyAdmin, handler.putPasswordUserHandler);

  return router;
};

export default adminRoutes;

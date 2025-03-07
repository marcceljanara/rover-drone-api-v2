import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const reportRoutes = (handler) => {
  const router = express.Router();

  router.post('/v1/reports', verifyToken, verifyAdmin, handler.postReportHandler);
  router.get('/v1/reports', verifyToken, verifyAdmin, handler.getAllReportHandler);
  router.get('/v1/reports/:id', verifyToken, verifyAdmin, handler.getDetailReportHandler);
  router.get('/v1/reports/:id/download', verifyToken, verifyAdmin, handler.getDownloadReportHandler);
  router.delete('/v1/reports/:id', verifyToken, verifyAdmin, verifyToken, verifyAdmin, handler.deleteReportHandler);

  return router;
};

export default reportRoutes;

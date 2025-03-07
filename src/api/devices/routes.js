import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import verifyAdmin from '../../middleware/verifyAdmin.js';

const deviceRoutes = (handler) => {
  const router = express.Router();

  // Admin
  router.post('/v1/devices', verifyToken, verifyAdmin, handler.postAddDeviceHandler);
  router.put('/v1/devices/:id', verifyToken, verifyAdmin, handler.deleteDeviceHandler);
  router.put('/v1/devices/:id/status', verifyToken, verifyAdmin, handler.putStatusDeviceHandler);
  router.put('/v1/devices/:id/mqttsensor', verifyToken, verifyAdmin, handler.putMqttSensorHandler);
  router.put('/v1/devices/:id/mqttcontrol', verifyToken, verifyAdmin, handler.putMqttControlHandler);

  // User (same id) & admin (all device)
  router.get('/v1/devices', verifyToken, handler.getAllDeviceHandler);
  router.get('/v1/devices/:id', verifyToken, handler.getDeviceHandler);
  router.put('/v1/devices/:id/control', verifyToken, handler.putDeviceControlHandler);
  router.get('/v1/devices/:id/sensors/intervals', verifyToken, handler.getSensorDataHandler);
  router.get('/v1/devices/:id/sensors/limits', verifyToken, handler.getSensorDataLimitHandler);
  router.get('/v1/devices/:id/sensors/downloads', verifyToken, handler.getSensorDataDownloadHandler);

  return router;
};

export default deviceRoutes;

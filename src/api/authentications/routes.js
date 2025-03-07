import express from 'express';

const authenticationRoutes = (handler) => {
  const router = express.Router();

  router.post('/v1/authentications', handler.postAuthenticationHandler);
  router.put('/v1/authentications', handler.putAuthenticationHandler);
  router.delete('/v1/authentications', handler.deleteAuthenticationHandler);

  return router;
};

export default authenticationRoutes;

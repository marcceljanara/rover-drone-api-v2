/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateContentType from '../../middleware/validateContentType.js';
import rateLimiter from '../../middleware/rateLimiter.js';

const llmRoutes = (handler) => {
  const router = express.Router();

  router.post('/v1/chats', rateLimiter(60, 10), verifyToken, validateContentType('application/json'), handler.postChatHandler);
  router.get('/v1/chats/:id/analyze', rateLimiter(60, 5), verifyToken, handler.postAnalyzeSensor);
  return router;
};

export default llmRoutes;

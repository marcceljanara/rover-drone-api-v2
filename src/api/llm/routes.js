/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import validateContentType from '../../middleware/validateContentType.js';

const llmRoutes = (handler) => {
  const router = express.Router();

  router.post('/v1/chats', verifyToken, validateContentType('application/json'), handler.postChatHandler);
  router.get('/v1/chats/:id/analyze', verifyToken, handler.postAnalyzeSensor);
  return router;
};

export default llmRoutes;

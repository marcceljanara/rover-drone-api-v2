/* eslint-disable max-len */
import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';

const llmRoutes = (handler) => {
  const router = express.Router();

  router.post('/v1/chats', verifyToken, handler.postChatHandler);
  router.post('/v1/chats/:id/analyze', verifyToken, handler.postAnalyzeSensor);
  return router;
};

export default llmRoutes;

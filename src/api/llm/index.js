import LlmHandler from './handler.js';
import llmRoutes from './routes.js';

const llmPlugin = ({
  app, llmService, devicesService, validator,
}) => {
  const handler = new LlmHandler({
    llmService, devicesService, validator,
  });
  app.use(llmRoutes(handler));
};

export default llmPlugin;

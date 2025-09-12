import ShipmentsHandler from './handler.js';
import shipmentRoutes from './routes.js';

const shipmentsPlugin = ({
  app, shipmentsService, rabbitmqService, storageService, validator,
}) => {
  const handler = new ShipmentsHandler({
    shipmentsService, rabbitmqService, storageService, validator,
  });
  app.use(shipmentRoutes(handler));
};

export default shipmentsPlugin;

import ShipmentsHandler from './handler.js';
import shipmentRoutes from './routes.js';

const shipmentsPlugin = ({
  app, shipmentsService, rabbitmqService, validator,
}) => {
  const handler = new ShipmentsHandler({
    shipmentsService, rabbitmqService, validator,
  });
  app.use(shipmentRoutes(handler));
};

export default shipmentsPlugin;

import AuthenticationHandler from './handler.js';
import authenticationRoutes from './routes.js';

const authenticationsPlugin = ({
  app, authenticationsService, userService, tokenManager, oauthManager, validator,
}) => {
  const handler = new AuthenticationHandler({
    authenticationsService,
    userService,
    tokenManager,
    oauthManager,
    validator,
  });

  app.use(authenticationRoutes(handler));
};

export default authenticationsPlugin;

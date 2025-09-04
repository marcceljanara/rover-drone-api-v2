import AuthenticationHandler from './handler.js';
import authenticationRoutes from './routes.js';

const authenticationsPlugin = ({
  app, authenticationsService, userService, tokenManager, oauthManager, cacheService, validator,
}) => {
  const handler = new AuthenticationHandler({
    authenticationsService,
    userService,
    tokenManager,
    oauthManager,
    cacheService,
    validator,
  });

  app.use(authenticationRoutes(handler));
};

export default authenticationsPlugin;

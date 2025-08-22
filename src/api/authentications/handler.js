const FRONTEND_URL = 'http://localhost:3000';

class AuthenticationHandler {
  constructor({
    authenticationsService, userService, tokenManager, oauthManager, validator,
  }) {
    this._authenticationsService = authenticationsService;
    this._userService = userService;
    this._tokenManager = tokenManager;
    this._oauthManager = oauthManager;
    this._validator = validator;

    // Local
    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);

    // Google
    this.getGoogleAuthenticationHandler = this.getGoogleAuthenticationHandler.bind(this);
    this.getGoogleAuthenticationCallbackHandler = this
      .getGoogleAuthenticationCallbackHandler.bind(this);
  }

  async postAuthenticationHandler(req, res, next) {
    try {
      this._validator.validatePostAuthenticationPayload(req.body);
      const { email, password } = req.body;
      await this._authenticationsService.checkStatusAccount(email);
      const { id, role } = await this._authenticationsService.verifyUserCredential(email, password);
      const isNeedAddress = await this._authenticationsService.checkUserAddresses(id);
      const accessToken = this._tokenManager.generateAccessToken(
        { id, role, needsAddress: isNeedAddress },
      );
      const refreshToken = this._tokenManager.generateRefreshToken({ id, role });
      await this._authenticationsService.addRefreshToken(refreshToken);
      // ✅ Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // tidak bisa diakses dari JS
        secure: process.env.NODE_ENV === 'production', // hanya HTTPS di production
        sameSite: 'strict', // cegah CSRF
        maxAge: 60 * 60 * 1000, // 1 jam (sesuai expiry accessToken)
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      });

      // ✅ Redirect ke frontend, tanpa JSON response
      const redirectTo = new URL('/dashboard', FRONTEND_URL);
      return res.redirect(redirectTo.toString());
    } catch (error) {
      return next(error);
    }
  }

  async putAuthenticationHandler(req, res, next) {
    try {
      this._validator.validatePutAuthenticationPayload(req.body);
      const { refreshToken } = req.body;
      await this._authenticationsService.verifyRefreshToken(refreshToken);
      const { id, role } = this._tokenManager.verifyRefreshToken(refreshToken);
      const accessToken = this._tokenManager.generateAccessToken({ id, role });
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // tidak bisa diakses dari JS
        secure: process.env.NODE_ENV === 'production', // hanya HTTPS di production
        sameSite: 'strict', // cegah CSRF
        maxAge: 60 * 60 * 1000, // 1 jam (sesuai expiry accessToken)
      });
      // ✅ Redirect ke frontend, tanpa JSON response
      const redirectTo = new URL('/dashboard', FRONTEND_URL);
      return res.redirect(redirectTo.toString());
    } catch (error) {
      return next(error);
    }
  }

  async deleteAuthenticationHandler(req, res, next) {
    try {
      this._validator.validateDeleteAuthenticationPayload(req.body);
      const { refreshToken } = req.body;
      await this._authenticationsService.verifyRefreshToken(refreshToken);
      await this._authenticationsService.deleteRefreshToken(refreshToken);

      return res.status(200).json({
        status: 'success',
        message: 'Refresh token berhasil dihapus',
      });
    } catch (error) {
      return next(error);
    }
  }

  async getGoogleAuthenticationHandler(req, res, next) {
    try {
      const url = await this._oauthManager.getGoogleAuthenticationUrl();
      return res.redirect(url);
    } catch (error) {
      return next(error);
    }
  }

  async getGoogleAuthenticationCallbackHandler(req, res) {
    try {
      const { code } = req.query;
      const tokens = await this._oauthManager.getTokenInfo(code);
      const ticket = await this._oauthManager.verfyGoogleToken(tokens.id_token);
      const payload = ticket.getPayload();
      const {
        email, name: fullname, sub: googleId, aud,
      } = payload;

      const { id, role } = await this._userService.registerOrLoginGoogle({
        email, fullname, googleId, aud,
      });

      const isNeedAddress = await this._authenticationsService.checkUserAddresses(id);

      const accessToken = this._tokenManager.generateAccessToken(
        { id, role, needsAddress: isNeedAddress },
      );
      const refreshToken = this._tokenManager.generateRefreshToken({ id, role });

      await this._authenticationsService.addRefreshToken(refreshToken);

      // ✅ Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // tidak bisa diakses dari JS
        secure: process.env.NODE_ENV === 'production', // hanya HTTPS di production
        sameSite: 'strict', // cegah CSRF
        maxAge: 60 * 60 * 1000, // 1 jam (sesuai expiry accessToken)
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      });

      // ✅ Redirect ke frontend, tanpa JSON response
      const redirectTo = new URL('/dashboard', FRONTEND_URL);
      return res.redirect(redirectTo.toString());
    } catch (error) {
      console.log(error);
      return res.redirect(`${FRONTEND_URL}/login-failed`);
    }
  }
}

export default AuthenticationHandler;

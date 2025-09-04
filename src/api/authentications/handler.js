import autoBind from 'auto-bind';

const FRONTEND_URL = 'http://localhost:3000';

class AuthenticationHandler {
  constructor({
    authenticationsService, userService, tokenManager, oauthManager, cacheService, validator,
  }) {
    this._authenticationsService = authenticationsService;
    this._userService = userService;
    this._tokenManager = tokenManager;
    this._oauthManager = oauthManager;
    this._cacheService = cacheService;
    this._validator = validator;

    autoBind(this);
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
        sameSite: 'lax', // cegah CSRF
        maxAge: 60 * 60 * 1000, // 1 jam (sesuai expiry accessToken)
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      });

      return res.status(200).json({
        status: 'success',
        data: { email, role, id },
      });
    } catch (error) {
      return next(error);
    }
  }

  async putAuthenticationHandler(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      await this._authenticationsService.verifyRefreshToken(refreshToken);
      const { id, role } = this._tokenManager.verifyRefreshToken(refreshToken);
      const accessToken = this._tokenManager.generateAccessToken({ id, role });
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // tidak bisa diakses dari JS
        secure: process.env.NODE_ENV === 'production', // hanya HTTPS di production
        sameSite: 'lax', // cegah CSRF
        maxAge: 60 * 60 * 1000, // 1 jam (sesuai expiry accessToken)
      });
      // ✅ Redirect ke frontend, tanpa JSON response
      return res.status(200).json({
        status: 'success',
        message: 'Access Token berhasil diperbarui',
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAuthenticationHandler(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      await this._authenticationsService.verifyRefreshToken(refreshToken);
      await this._authenticationsService.deleteRefreshToken(refreshToken);

      // Hapus cookie dari browser
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.status(200).json({
        status: 'success',
        message: 'Berhasil logout',
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
      const { code, state } = req.query;

      // ✅ validasi state di Redis
      const cacheKey = `oauth_state:${state}`;
      const savedState = await this._cacheService.get(cacheKey).catch(() => null);
      if (!savedState) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid or expired state (possible CSRF attack)',
        });
      }

      // hapus state agar tidak bisa replay
      await this._cacheService.delete(cacheKey);

      const tokens = await this._oauthManager.getTokenInfo(code);
      const ticket = await this._oauthManager.verifyGoogleToken(tokens.id_token);
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
        sameSite: 'lax', // cegah CSRF
        maxAge: 60 * 60 * 1000, // 1 jam (sesuai expiry accessToken)
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      });

      // ✅ Redirect ke frontend, tanpa JSON response
      const redirectTo = new URL('/dashboard', FRONTEND_URL);
      return res.redirect(redirectTo.toString());
    } catch (error) {
      return res.redirect(`${FRONTEND_URL}/login-failed`);
    }
  }

  async getLoginStatus(req, res, next) {
    try {
      const { id } = req;
      const user = await this._authenticationsService.checkLoginStatus(id);
      return res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default AuthenticationHandler;

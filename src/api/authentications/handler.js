class AuthenticationHandler {
  constructor({
    authenticationsService, userService, tokenManager, validator,
  }) {
    this._authenticationsService = authenticationsService;
    this._userService = userService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);
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
      return res.status(201).json({
        status: 'success',
        message: 'Authentication berhasil ditambahkan',
        data: {
          accessToken,
          refreshToken,
        },
      });
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
      return res.status(200).json({
        status: 'success',
        message: 'Access Token berhasil diperbarui',
        data: {
          accessToken,
        },
      });
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
}

export default AuthenticationHandler;

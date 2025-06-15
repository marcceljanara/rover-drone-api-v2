class AdminHandler {
  constructor({ adminsService, userService, validator }) {
    this._adminsService = adminsService;
    this._userService = userService;
    this._validator = validator;

    this.postRegisterUserByAdminHandler = this.postRegisterUserByAdminHandler.bind(this);
    this.getAllUserHandler = this.getAllUserHandler.bind(this);
    this.getDetailUserHandler = this.getDetailUserHandler.bind(this);
    this.deleteUserHandler = this.deleteUserHandler.bind(this);
    this.putPasswordUserHandler = this.putPasswordUserHandler.bind(this);
  }

  async postRegisterUserByAdminHandler(req, res, next) {
    try {
      this._validator.validatePostRegisterUserByAdminPayload(req.body);
      const {
        username, password, fullname, email,
      } = req.body;
      await this._userService.checkExistingUser({ email, username });

      const userId = await this._adminsService.registerUser({
        username,
        password,
        fullname,
        email,
      });

      return res.status(201).json({
        status: 'success',
        message: 'User berhasil didaftarkan oleh admin',
        data: { userId },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllUserHandler(req, res, next) {
    try {
      this._validator.validateQueryPayload(req.query);
      // Mengambil parameter limit, offset, dan search dari query string
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const offset = (page - 1) * limit;
      const searchQuery = req.query.search || '';

      // Menyiapkan parameter pencarian
      const searchCondition = `%${searchQuery}%`;

      // Query untuk mengambil data obat
      const users = await this._adminsService.getAllUser(searchCondition, limit, offset);

      // Query untuk menghitung total data
      const totalCount = await this._adminsService.getCountData(searchCondition);

      // Menghitung total halaman
      const totalPages = Math.ceil(totalCount / limit);

      // Mengirim respon dengan data obat dan informasi halaman
      return res.status(200).json({
        status: 'success',
        message: 'Data user berhasil diperoleh',
        data: { users },
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDetailUserHandler(req, res, next) {
    try {
      // Mengambil parameter ID dari URL
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;

      const user = await this._adminsService.getDetailUser(id);

      return res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteUserHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      await this._adminsService.deleteUser(id);
      return res.status(200).json({
        status: 'success',
        message: 'user berhasil dihapus',
      });
    } catch (error) {
      return next(error);
    }
  }

  async putPasswordUserHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validatePutPasswordUserPayload(req.body);
      const { id } = req.params;
      const { newPassword, confNewPassword } = req.body;
      await this._adminsService.checkIsAdmin(id);
      await this._adminsService.changePasswordUser(id, newPassword, confNewPassword);
      return res.status(200).json({
        status: 'success',
        message: 'password user berhasil diubah',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default AdminHandler;

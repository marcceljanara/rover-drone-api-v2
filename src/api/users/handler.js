import autoBind from 'auto-bind';

class UserHandler {
  constructor({ userService, rabbitmqService, validator }) {
    this._userService = userService;
    this._rabbitmqService = rabbitmqService;
    this._validator = validator;

    autoBind(this);
  }

  async postRegisterUserHandler(req, res, next) {
    try {
      this._validator.validateUserPayload(req.body);

      const {
        username, password, fullname, email,
      } = req.body;
      await this._userService.checkExistingUser({ email, username });

      const userId = await this._userService.registerUser({
        username,
        password,
        fullname,
        email,
      });

      // Generate and send OTP
      const otp = await this._userService.generateOtp(email);

      const message = {
        userId,
        email,
        otp,
      };
      // await this._emailManager.sendOtpEmail(email, otp);
      await this._rabbitmqService.sendMessage('otp:register', JSON.stringify(message));

      return res.status(201).json({
        status: 'success',
        message: 'User berhasil didaftarkan. Silakan verifikasi email Anda.',
        data: { userId },
      });
    } catch (error) {
      return next(error);
    }
  }

  async postVerifyOtpHandler(req, res, next) {
    try {
      this._validator.validateOtpPayload(req.body);

      const { email, otp } = req.body;
      await this._userService.verifyOtp(email, otp);

      return res.status(200).json({
        status: 'success',
        message: 'Verifikasi berhasil. Akun Anda telah aktif.',
      });
    } catch (error) {
      return next(error);
    }
  }

  async postResendOtpHandler(req, res, next) {
    try {
      this._validator.validateResendOtpPayload(req.body);

      const { email } = req.body;
      const otp = await this._userService.generateOtp(email);
      const message = {
        email,
        otp,
      };
      await this._rabbitmqService.sendMessage('otp:register', JSON.stringify(message));

      return res.status(200).json({
        status: 'success',
        message: 'Kode OTP telah dikirim ulang ke email Anda.',
      });
    } catch (error) {
      return next(error);
    }
  }

  async postAddressHandler(req, res, next) {
    try {
      const userId = req.id;
      this._validator.validateAddressPayload(req.body);

      const address = await this._userService.addAddress(userId, req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Alamat pengiriman berhasil ditambahkan',
        data: {
          addressId: address,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllAddressHandler(req, res, next) {
    try {
      const userId = req.id;
      const addresses = await this._userService.getAllAddress(userId);
      return res.status(200).json({
        status: 'success',
        data: {
          addresses,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDetailAddressHandler(req, res, next) {
    try {
      const userId = req.id;
      const { id } = req.params;
      const address = await this._userService.getDetailAddress(userId, id);
      return res.status(200).json({
        status: 'success',
        data: {
          address,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async putAddressHandler(req, res, next) {
    try {
      const userId = req.id;
      const { id } = req.params;
      this._validator.validateAddressPayload(req.body);
      const address = await this._userService.updateAddress(userId, id, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Alamat pengiriman berhasil diperbarui!',
        data: {
          addressId: address,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchSetDefaultAddress(req, res, next) {
    try {
      const userId = req.id;
      const { id } = req.params;
      await this._userService.setDefaultAddress(userId, id);
      return res.status(200).json({
        status: 'success',
        message: 'Alamat pengiriman utama berhasil diperbarui',
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAddressHandler(req, res, next) {
    try {
      const userId = req.id;
      const { id } = req.params;
      await this._userService.deleteAddress(userId, id);
      return res.status(200).json({
        status: 'success',
        message: 'Alamat pengiriman berhasil dihapus!',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default UserHandler;

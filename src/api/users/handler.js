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
      await this._userService.checkExistingUsername({ username });
      await this._userService.checkExistingEmail({ email });

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

  async postForgotPasswordHandler(req, res, next) {
    try {
      this._validator.validateEmailPayload(req.body);
      const { email } = req.body;
      const { id } = await this._userService.findByEmail(email);
      const token = await this._userService.generateTokenResetPassword(id);
      const message = {
        userId: id,
        token,
        email,
      };
      await this._rabbitmqService.sendMessage('auth.reset_password', JSON.stringify(message));
      return res.status(200).json({
        status: 'success',
        message: 'Permintaan reset password berhasil. Silahkan cek email Anda.',
      });
    } catch (error) {
      return next(error);
    }
  }

  async postValidateResetTokenHandler(req, res, next) {
    try {
      this._validator.validateTokenPayload(req.body);
      const { token } = req.body;

      const sessionId = await this._userService.verifyResetToken(token);

      res.cookie('prst', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 menit
      });

      return res.status(200).json({
        status: 'success',
        message: 'Token valid, silakan ganti password',
      });
    } catch (error) {
      return next(error);
    }
  }

  async postResetPasswordHandler(req, res, next) {
    try {
      this._validator.validateChangePasswordPayload(req.body);
      const { newPassword, confirmPassword } = req.body;
      if (!req.cookies.prst) {
        return res.status(401).json({
          status: 'fail',
          message: 'Reset session tidak ditemukan',
        });
      }
      const sessionId = req.cookies.prst;
      const userId = await this._userService.verifySession(sessionId);

      // Change Password
      await this._userService.changePassword(userId, newPassword, confirmPassword);

      // Flag Session
      await this._userService.flagSession(sessionId);

      // Delete Cookie
      res.clearCookie('prst');

      return res.status(200).json({
        status: 'success',
        message: 'Password berhasil direset, silakan login kembali',
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

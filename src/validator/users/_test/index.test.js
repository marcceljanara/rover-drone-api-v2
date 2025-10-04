import InvariantError from '../../../exceptions/InvariantError.js';
import UsersValidator from '../index.js';

describe('User Schema', () => {
  // =========================================================
  // USER PAYLOAD
  // =========================================================
  describe('User Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        email: 'kucing@gmail.com',
      };
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 123,
      };
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when username contains more than 50 character', () => {
      const payload = {
        username: 'a'.repeat(51),
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 'kucing@gmail.com',
      };
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when email not valid', () => {
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 'kucinggmail.com',
      };
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 'kucing@gmail.com',
      };
      expect(() => UsersValidator.validateUserPayload(payload)).not.toThrowError();
    });
  });

  // =========================================================
  // OTP PAYLOAD
  // =========================================================
  describe('OTP Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      const payload = { email: 'kucing@gmail.com' };
      expect(() => UsersValidator.validateOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      const payload = { email: 'email@gmail.com', otp: 123456 };
      expect(() => UsersValidator.validateOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when not email', () => {
      const payload = { email: 'kucinggmail.com', otp: '123456' };
      expect(() => UsersValidator.validateOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when otp contains more or less than 6 characters', () => {
      expect(() => UsersValidator.validateOtpPayload({ email: 'a@gmail.com', otp: '12345' })).toThrowError(InvariantError);
      expect(() => UsersValidator.validateOtpPayload({ email: 'a@gmail.com', otp: '1234567' })).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      const payload = { email: 'marccel@gmail.com', otp: '123456' };
      expect(() => UsersValidator.validateOtpPayload(payload)).not.toThrowError(InvariantError);
    });
  });

  // =========================================================
  // RESEND OTP PAYLOAD
  // =========================================================
  describe('Resend OTP Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      expect(() => UsersValidator.validateResendOtpPayload({})).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      const payload = { email: 123 };
      expect(() => UsersValidator.validateResendOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when not valid email', () => {
      expect(() => UsersValidator.validateResendOtpPayload({ email: 'abcgmail.com' })).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      const payload = { email: 'marccel@gmail.com' };
      expect(() => UsersValidator
        .validateResendOtpPayload(payload)).not.toThrowError(InvariantError);
    });
  });

  // =========================================================
  // EMAIL PAYLOAD
  // =========================================================
  describe('Email payload', () => {
    it('should throw error when missing property', () => {
      expect(() => UsersValidator.validateEmailPayload({})).toThrow(InvariantError);
    });

    it('should throw error when wrong data type', () => {
      expect(() => UsersValidator.validateEmailPayload({ email: 12345 })).toThrow(InvariantError);
    });

    it('should throw error when invalid email format', () => {
      expect(() => UsersValidator.validateEmailPayload({ email: 'invalidEmail' })).toThrow(InvariantError);
    });

    it('should not throw error because valid', () => {
      expect(() => UsersValidator.validateEmailPayload({ email: 'email@gmail.com' })).not.toThrow(InvariantError);
    });
  });

  // =========================================================
  // TOKEN PAYLOAD
  // =========================================================
  describe('Token Payload', () => {
    it('should throw error when token missing', () => {
      expect(() => UsersValidator.validateTokenPayload({})).toThrow(InvariantError);
    });

    it('should throw error when token not hex', () => {
      const payload = { token: 'z'.repeat(64) }; // invalid hex
      expect(() => UsersValidator.validateTokenPayload(payload)).toThrow(InvariantError);
    });

    it('should throw error when token length not 64', () => {
      const payload = { token: 'a'.repeat(63) };
      expect(() => UsersValidator.validateTokenPayload(payload)).toThrow(InvariantError);
    });

    it('should not throw error because valid', () => {
      const payload = { token: 'a'.repeat(64) };
      expect(() => UsersValidator.validateTokenPayload(payload)).not.toThrow(InvariantError);
    });
  });

  // =========================================================
  // CHANGE PASSWORD PAYLOAD
  // =========================================================
  describe('Change Password Payload', () => {
    it('should throw error when missing property', () => {
      const payload = { newPassword: '123' };
      expect(() => UsersValidator.validateChangePasswordPayload(payload)).toThrow(InvariantError);
    });

    it('should throw error when wrong data type', () => {
      const payload = { newPassword: '123456', confirmPassword: 123456 };
      expect(() => UsersValidator.validateChangePasswordPayload(payload)).toThrow(InvariantError);
    });

    it('should not throw error because valid', () => {
      const payload = { newPassword: '123456', confirmPassword: '123456' };
      expect(() => UsersValidator
        .validateChangePasswordPayload(payload)).not.toThrow(InvariantError);
    });
  });

  // =========================================================
  // ADDRESS PAYLOAD
  // =========================================================
  describe('Address Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
      };
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when data type invalid', () => {
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: true,
        isDefault: true,
      };
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when name contains < or >', () => {
      const payload = {
        namaPenerima: '<invalid>',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: false,
      };
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when phone invalid format', () => {
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '1234567',
        alamatLengkap: 'Jalan Bali Indah',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
      };
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when kodePos invalid', () => {
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34A71',
      };
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };
      expect(() => UsersValidator.validateAddressPayload(payload)).not.toThrowError();
    });
  });
});

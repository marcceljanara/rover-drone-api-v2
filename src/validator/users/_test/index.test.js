import InvariantError from '../../../exceptions/InvariantError.js';
import UsersValidator from '../index.js';

describe('User Schema', () => {
  describe('User Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // arrange
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        email: 'kucing@gmail.com',
      };

      // Actions and assert
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 123,
      };

      // Actions and assert
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when username contains more than 50 character', () => {
      // Arrange
      const payload = {
        username: 'marcceljanarasahasfhsafsalffffffffffffffffffffffffffffff',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 'kucing@gmail.com',
      };

      // Actions and assert
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when email not valid', () => {
      // Arrange
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 'kucinggmail.com',
      };

      // Actions and assert
      expect(() => UsersValidator.validateUserPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      // Arrange
      const payload = {
        username: 'marcceljanara',
        password: 'superpassword',
        fullname: 'Marccel Janara',
        email: 'kucing@gmail.com',
      };

      // Actions and assert
      expect(() => UsersValidator.validateUserPayload(payload)).not.toThrowError();
    });
  });
  describe('OTP Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // arrange
      const payload = {
        email: 'kucing@gmail.com',
      };

      // Actions and assert
      expect(() => UsersValidator.validateOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        email: 'email@gmail.com',
        otp: 123456,
      };

      // Actions and assert
      expect(() => UsersValidator.validateOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when not email', () => {
      // Arrange
      const payload = {
        email: 'kucinggmail.com',
        otp: '123456',
      };

      // Actions and assert
      expect(() => UsersValidator.validateOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when otp contains more than or less than 6 characters', () => {
      // Actions and assert
      expect(() => UsersValidator.validateOtpPayload({ email: 'kucing@gmail.com', otp: '1234567' })).toThrowError(InvariantError);
      expect(() => UsersValidator.validateOtpPayload({ email: 'kucing@gmail.com', otp: '12345' })).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      // Arrange
      const payload = {
        email: 'marccel@gmail.com',
        otp: '123456',
      };

      // Actions and assert
      expect(() => UsersValidator.validateOtpPayload(payload)).not.toThrowError(InvariantError);
    });
  });
  describe('Resend OTP Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // arrange
      const payload = {

      };

      // Actions and assert
      expect(() => UsersValidator.validateResendOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        email: 123,
      };

      // Actions and assert
      expect(() => UsersValidator.validateResendOtpPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when input not email', () => {
      // Actions and assert
      expect(() => UsersValidator.validateOtpPayload({ email: 'kucinggmail.com' })).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      // Arrange
      const payload = {
        email: 'marccel@gmail.com',
      };

      // Actions and assert
      expect(() => UsersValidator.validateResendOtpPayload(payload))
        .not.toThrowError(InvariantError);
    });
  });
  describe('Address Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // arrange
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
      };

      // Actions and assert
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: true,
        isDefault: true,
      };

      // Actions and assert
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when No HP contains more than 20 character', () => {
      // Arrange
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '08521234567813114315436547347374746',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };

      // Actions and assert
      expect(() => UsersValidator.validateAddressPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because pass validation', () => {
      // Arrange
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

      // Actions and assert
      expect(() => UsersValidator.validateAddressPayload(payload)).not.toThrowError();
    });
  });
});

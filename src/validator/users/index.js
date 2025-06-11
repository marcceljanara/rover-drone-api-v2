import UserSchema from './schema.cjs';
import InvariantError from '../../exceptions/InvariantError.js';

const UsersValidator = {
  validateUserPayload: (payload) => {
    const result = UserSchema.userPayload.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },

  validateOtpPayload: (payload) => {
    const result = UserSchema.otpPayload.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },

  validateResendOtpPayload: (payload) => {
    const result = UserSchema.resendOtpPayload.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },

  validateAddressPayload: (payload) => {
    const result = UserSchema.addressPayload.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
};

export default UsersValidator;

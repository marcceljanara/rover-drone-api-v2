const Joi = require('joi');

const UserSchema = {
  userPayload: Joi.object({
    username: Joi.string().max(50).required(),
    password: Joi.string().required(),
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
  }),

  otpPayload: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
  }),

  resendOtpPayload: Joi.object({
    email: Joi.string().email().required(),
  }),

  addressPayload: Joi.object({
    namaPenerima: Joi.string().max(100).required(),
    noHp: Joi.string().max(20).required(),
    alamatLengkap: Joi.string().required(),
    provinsi: Joi.string().max(100).required(),
    kabupatenKota: Joi.string().max(100).required(),
    kecamatan: Joi.string().max(100).required(),
    kelurahan: Joi.string().max(100).required(),
    kodePos: Joi.string().max(10).required(),
    isDefault: Joi.boolean(),
  }),
};

module.exports = UserSchema;

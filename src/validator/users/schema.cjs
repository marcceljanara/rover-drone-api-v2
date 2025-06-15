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
    namaPenerima: Joi.string()
      .max(100)
      .pattern(/^[a-zA-Z0-9\s.,'-]{1,100}$/)
      .required()
      .messages({
        'string.pattern.base': 'Nama hanya boleh mengandung huruf, angka, spasi, dan simbol umum.',
      }),

    noHp: Joi.string()
      .max(20)
      .pattern(/^(0|\+62)[0-9]{8,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Format nomor HP tidak valid (gunakan 08 atau +62).',
      }),

    alamatLengkap: Joi.string()
      .max(200)
      .pattern(/^[^<>]{1,200}$/)
      .required()
      .messages({
        'string.pattern.base': 'Alamat tidak boleh mengandung simbol < atau >.',
      }),

    provinsi: Joi.string()
      .max(100)
      .pattern(/^[^<>]{1,100}$/)
      .required()
      .messages({
        'string.pattern.base': 'Provinsi tidak boleh mengandung simbol < atau >.',
      }),

    kabupatenKota: Joi.string()
      .max(100)
      .pattern(/^[^<>]{1,100}$/)
      .required()
      .messages({
        'string.pattern.base': 'Kabupaten/Kota tidak boleh mengandung simbol < atau >.',
      }),

    kecamatan: Joi.string()
      .max(100)
      .pattern(/^[^<>]{1,100}$/)
      .required()
      .messages({
        'string.pattern.base': 'Kecamatan tidak boleh mengandung simbol < atau >.',
      }),

    kelurahan: Joi.string()
      .max(100)
      .pattern(/^[^<>]{1,100}$/)
      .required()
      .messages({
        'string.pattern.base': 'Kelurahan tidak boleh mengandung simbol < atau >.',
      }),

    kodePos: Joi.string()
      .pattern(/^[0-9]{5}$/)
      .required()
      .messages({
        'string.pattern.base': 'Kode pos harus berupa 5 digit angka.',
      }),

    isDefault: Joi.boolean().default(false),
  }),
};

module.exports = UserSchema;

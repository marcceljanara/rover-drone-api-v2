const Joi = require('joi');

const paramsPayloadSchema = Joi.object({
  id: Joi.string().required(),
});

const putVerificationPaymentPayloadSchema = Joi.object({
  paymentStatus: Joi.string().valid('completed').required(),
  paymentMethod: Joi.string().required(),
  transactionDescription: Joi.string().required(),
});

module.exports = {
  paramsPayloadSchema,
  putVerificationPaymentPayloadSchema,
};

const Joi = require('joi');

const paramsPayloadSchema = Joi.object({
  id: Joi.string().required(),
});

const putStatusRentalPayloadSchema = Joi.object({
  rentalStatus: Joi.string().valid('active', 'completed', 'cancelled').required(),
});

// Need Update based rental interval 6,12,24,36 month
const postAddRentalPayloadSchema = Joi.object({
  interval: Joi.number().valid(6, 12, 24, 36).required(),
  sensors: Joi.array(),
  shippingAddressId: Joi.string().max(15).required(),
  subdistrictName: Joi.string().required(),
});

const putCancelRentalPayloadSchema = Joi.object({
  rentalStatus: Joi.string().valid('cancelled').required(),
});

const postExtendRentalPayloadSchema = Joi.object({
  interval: Joi.number().valid(6, 12, 24, 36).required(),
  rentalId: Joi.string().max(23).required(),
});

module.exports = {
  paramsPayloadSchema,
  putStatusRentalPayloadSchema,
  postAddRentalPayloadSchema,
  putCancelRentalPayloadSchema,
  postExtendRentalPayloadSchema,
};

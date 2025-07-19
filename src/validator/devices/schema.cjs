const Joi = require('joi');

const paramsPayloadSchema = Joi.object({
  id: Joi.string().required(),
});

const querySensorPayloadSchema = Joi.object({
  interval: Joi.string().valid('15m', '1h', '6h', '12h', '24h', '7d', '30d', '60d', '90d', '180d', '365d'),
});

const querySensorDownloadPayloadSchema = Joi.object({
  interval: Joi.string().valid('1h', '6h', '12h', '1d', '7d', '30d', '60d', '90d', '180d', '365d'),
});

const queryLimitPayloadSchema = Joi.object({
  limit: Joi.string().valid('5', '10', '20', '50', '100'),
});

const putStatusDevicePayloadSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'maintenance', 'error').required(),
});

const putRentalIdPayloadSchema = Joi.object({
  rental_id: Joi.string().required(),
});

const putDeviceControlPayloadSchema = Joi.object({
  command: Joi.string().required(),
  action: Joi.string().valid('on', 'off').required(),
});

module.exports = {
  paramsPayloadSchema,
  putStatusDevicePayloadSchema,
  putRentalIdPayloadSchema,
  putDeviceControlPayloadSchema,
  querySensorPayloadSchema,
  querySensorDownloadPayloadSchema,
  queryLimitPayloadSchema,
};

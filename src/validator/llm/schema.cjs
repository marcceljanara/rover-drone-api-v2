const Joi = require('joi');

const chatPayloadSchema = Joi.object({
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant', 'system').required(),
        content: Joi.string().required(),
      }),
    )
    .min(1)
    .required(),
});

const sensorPayloadSchema = Joi.object({
  timestamp: Joi.string().isoDate().required(),
  temperature: Joi.number().required(),
  humidity: Joi.number().min(0).max(100).required(),
  light_intensity: Joi.number().min(0).required(), // lux
});

const querySensorPayloadSchema = Joi.object({
  interval: Joi.string().valid('15m', '1h', '6h', '12h', '24h', '7d', '30d', '60d', '90d', '180d', '365d'),
});

module.exports = {
  chatPayloadSchema,
  sensorPayloadSchema,
  querySensorPayloadSchema,
};

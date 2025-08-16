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

module.exports = {
  chatPayloadSchema,
  sensorPayloadSchema,
};

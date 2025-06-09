const Joi = require('joi');

const paramsPayloadSchema = Joi.object({
  id: Joi.string().required(), // asumsi ID berbentuk UUID
});

const shippingInfoPayloadSchema = Joi.object({
  courierName: Joi.string().min(2).max(50).required(),
  courierService: Joi.string().min(2).max(50).required(),
  trackingNumber: Joi.string().min(5).max(100).required(),
  estimatedShippingDate: Joi.date().iso().required(),
  notes: Joi.string().allow('', null).max(255), // optional
});

const shippingStatusPayloadSchema = Joi.object({
  status: Joi.string()
    .valid('waiting', 'packed', 'shipped', 'delivered', 'failed')
    .required(),
});

const shippingDatePayloadSchema = Joi.object({
  date: Joi.date().iso().required(),
});

const updateReturnAddressPayloadSchema = Joi.object({
  newAddressId: Joi.string().required(), // UUID
});

const returnStatusPayloadSchema = Joi.object({
  status: Joi.string()
    .valid('waiting', 'picked', 'in-transit', 'returned', 'cancelled')
    .required(),
});

const returnNotePayloadSchema = Joi.object({
  notes: Joi.string().max(255).allow('', null).required(),
});

module.exports = {
  paramsPayloadSchema,
  shippingInfoPayloadSchema,
  shippingStatusPayloadSchema,
  shippingDatePayloadSchema,
  updateReturnAddressPayloadSchema,
  returnStatusPayloadSchema,
  returnNotePayloadSchema,
};

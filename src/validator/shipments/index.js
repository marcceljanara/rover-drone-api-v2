import InvariantError from '../../exceptions/InvariantError.js';
import {
  paramsPayloadSchema,
  shippingInfoPayloadSchema,
  shippingStatusPayloadSchema,
  shippingDatePayloadSchema,
  updateReturnAddressPayloadSchema,
  returnStatusPayloadSchema,
  returnNotePayloadSchema,
  updateReturnShippingInfoPayloadSchema,
} from './schema.cjs';

const ShipmentsValidator = {
  validateParamsPayload(payload) {
    const result = paramsPayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
  validateShippingInfoPayload(payload) {
    const result = shippingInfoPayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
  validateShippingStatusPayload(payload) {
    const result = shippingStatusPayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
  validateShippingDatePayload(payload) {
    const result = shippingDatePayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
  validateUpdateReturnAddressPayload(payload) {
    const result = updateReturnAddressPayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },

  validateReturnStatusPayload(payload) {
    const result = returnStatusPayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },

  validateReturnNotePayload(payload) {
    const result = returnNotePayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
  validateUpdateReturnShippingInfoPayload(payload) {
    const result = updateReturnShippingInfoPayloadSchema.validate(payload);
    if (result.error) throw new InvariantError(result.error.message);
  },
};

export default ShipmentsValidator;

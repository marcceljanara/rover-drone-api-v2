import InvariantError from '../../exceptions/InvariantError.js';
import {
  paramsPayloadSchema,
  shippingInfoPayloadSchema,
  shippingStatusPayloadSchema,
  shippingDatePayloadSchema,
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
};

export default ShipmentsValidator;

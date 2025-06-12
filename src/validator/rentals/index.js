import InvariantError from '../../exceptions/InvariantError.js';
import {
  putCancelRentalPayloadSchema,
  paramsPayloadSchema,
  postAddRentalPayloadSchema,
  putStatusRentalPayloadSchema,
  postExtendRentalPayloadSchema,
} from './schema.cjs';

const RentalsValidator = {
  validateParamsPayload: (payload) => {
    const validationResult = paramsPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePutStatusRentalPayload: (payload) => {
    const validationResult = putStatusRentalPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePostAddRentalPayload: (payload) => {
    const validationResult = postAddRentalPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePutCancelRentalPayload: (payload) => {
    const validationResult = putCancelRentalPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePostExtendRentalPayload: (payload) => {
    const validationResult = postExtendRentalPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

export default RentalsValidator;

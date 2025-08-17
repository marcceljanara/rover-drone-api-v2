import InvariantError from '../../exceptions/InvariantError.js';
import {
  chatPayloadSchema,
  querySensorPayloadSchema,
  sensorPayloadSchema,
} from './schema.cjs';

const LlmValidator = {
  validateChatPayload: (payload) => {
    const { error } = chatPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },

  validateSensorPayload: (payload) => {
    const { error } = sensorPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },
  validateQuerySensorPayload: (payload) => {
    const validationResult = querySensorPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

export default LlmValidator;

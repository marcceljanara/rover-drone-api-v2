import InvariantError from '../../exceptions/InvariantError.js';
import {
  chatPayloadSchema,
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
};

export default LlmValidator;

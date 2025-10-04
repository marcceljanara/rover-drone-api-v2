import LlmValidator from '../index.js';
import InvariantError from '../../../exceptions/InvariantError.js';

describe('LlmValidator', () => {
  describe('validateChatPayload', () => {
    it('should not throw error for valid chat payload', () => {
      const validPayload = {
        messages: [
          { role: 'user', content: 'Halo' },
          { role: 'assistant', content: 'Hai!' },
        ],
      };

      expect(() => LlmValidator.validateChatPayload(validPayload)).not.toThrow();
    });

    it('should throw InvariantError if messages array is missing', () => {
      const invalidPayload = {};

      expect(() => LlmValidator.validateChatPayload(invalidPayload)).toThrow(InvariantError);
    });

    it('should throw InvariantError if role is invalid', () => {
      const invalidPayload = {
        messages: [{ role: 'unknown', content: 'test' }],
      };

      expect(() => LlmValidator.validateChatPayload(invalidPayload)).toThrow(InvariantError);
    });
  });

  describe('validateSensorPayload', () => {
    it('should not throw error for valid sensor payload', () => {
      const validPayload = {
        timestamp: new Date().toISOString(),
        temperature: 26.5,
        humidity: 55,
        light_intensity: 200,
      };

      expect(() => LlmValidator.validateSensorPayload(validPayload)).not.toThrow();
    });

    it('should throw InvariantError for invalid humidity', () => {
      const invalidPayload = {
        timestamp: new Date().toISOString(),
        temperature: 25,
        humidity: 120, // > 100
        light_intensity: 100,
      };

      expect(() => LlmValidator.validateSensorPayload(invalidPayload)).toThrow(InvariantError);
    });

    it('should throw InvariantError if timestamp is missing', () => {
      const invalidPayload = {
        temperature: 25,
        humidity: 50,
        light_intensity: 100,
      };

      expect(() => LlmValidator.validateSensorPayload(invalidPayload)).toThrow(InvariantError);
    });
  });

  describe('validateQuerySensorPayload', () => {
    it('should not throw error for valid interval', () => {
      const validPayload = { interval: '1h' };

      expect(() => LlmValidator.validateQuerySensorPayload(validPayload)).not.toThrow();
    });

    it('should throw InvariantError for invalid interval', () => {
      const invalidPayload = { interval: '2hours' };

      expect(() => LlmValidator.validateQuerySensorPayload(invalidPayload)).toThrow(InvariantError);
    });

    it('should not throw error if interval is not provided (optional)', () => {
      const payload = {};

      expect(() => LlmValidator.validateQuerySensorPayload(payload)).not.toThrow();
    });
  });
});

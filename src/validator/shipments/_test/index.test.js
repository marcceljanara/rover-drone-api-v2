import InvariantError from '../../../exceptions/InvariantError.js';
import ShipmentsValidator from '../index.js';

describe('ShipmentsValidator', () => {
  describe('validateParamsPayload', () => {
    it('should throw error when payload is missing', () => {
      expect(() => ShipmentsValidator.validateParamsPayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error when id is not string', () => {
      expect(() => ShipmentsValidator.validateParamsPayload({ id: 123 }))
        .toThrowError(InvariantError);
    });

    it('should not throw error for valid id', () => {
      expect(() => ShipmentsValidator.validateParamsPayload({ id: 'shipment-001' }))
        .not.toThrowError();
    });
  });

  describe('validateShippingInfoPayload', () => {
    it('should throw error if required field is missing', () => {
      expect(() => ShipmentsValidator.validateShippingInfoPayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error if trackingNumber is too short', () => {
      const payload = {
        courierName: 'JNE',
        courierService: 'Reguler',
        trackingNumber: '123',
      };
      expect(() => ShipmentsValidator.validateShippingInfoPayload(payload))
        .toThrowError(InvariantError);
    });

    it('should not throw error with valid payload', () => {
      const payload = {
        courierName: 'JNE',
        courierService: 'YES',
        trackingNumber: 'JNE1234567890',
        notes: 'Handle with care',
      };
      expect(() => ShipmentsValidator.validateShippingInfoPayload(payload))
        .not.toThrowError();
    });
  });

  describe('validateShippingStatusPayload', () => {
    it('should throw error for missing status', () => {
      expect(() => ShipmentsValidator.validateShippingStatusPayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error for invalid status value', () => {
      expect(() => ShipmentsValidator.validateShippingStatusPayload({ status: 'processing' }))
        .toThrowError(InvariantError);
    });

    it('should not throw error for valid status', () => {
      expect(() => ShipmentsValidator.validateShippingStatusPayload({ status: 'shipped' }))
        .not.toThrowError();
    });
  });

  describe('validateShippingDatePayload', () => {
    it('should throw error if date is missing', () => {
      expect(() => ShipmentsValidator.validateShippingDatePayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error for invalid date format', () => {
      expect(() => ShipmentsValidator.validateShippingDatePayload({ date: 'not-a-date' }))
        .toThrowError(InvariantError);
    });

    it('should not throw error for valid ISO date', () => {
      expect(() => ShipmentsValidator.validateShippingDatePayload({ date: '2025-06-11' }))
        .not.toThrowError();
    });
  });

  describe('validateUpdateReturnAddressPayload', () => {
    it('should throw error if newAddressId is missing', () => {
      expect(() => ShipmentsValidator.validateUpdateReturnAddressPayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error if newAddressId is not a string', () => {
      expect(() => ShipmentsValidator.validateUpdateReturnAddressPayload({ newAddressId: 123 }))
        .toThrowError(InvariantError);
    });

    it('should not throw error for valid newAddressId', () => {
      expect(() => ShipmentsValidator.validateUpdateReturnAddressPayload({ newAddressId: 'address-001' }))
        .not.toThrowError();
    });
  });

  describe('validateReturnStatusPayload', () => {
    it('should throw error for missing status', () => {
      expect(() => ShipmentsValidator.validateReturnStatusPayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error for invalid return status', () => {
      expect(() => ShipmentsValidator.validateReturnStatusPayload({ status: 'completed' }))
        .toThrowError(InvariantError);
    });

    it('should not throw error for valid return status', () => {
      expect(() => ShipmentsValidator.validateReturnStatusPayload({ status: 'returned' }))
        .not.toThrowError();
    });
  });

  describe('validateReturnNotePayload', () => {
    it('should throw error for missing notes', () => {
      expect(() => ShipmentsValidator.validateReturnNotePayload({}))
        .toThrowError(InvariantError);
    });

    it('should throw error for notes too long', () => {
      const longNote = 'a'.repeat(300);
      expect(() => ShipmentsValidator.validateReturnNotePayload({ notes: longNote }))
        .toThrowError(InvariantError);
    });

    it('should not throw error for valid notes', () => {
      expect(() => ShipmentsValidator.validateReturnNotePayload({ notes: 'Sudah dikembalikan dengan aman' }))
        .not.toThrowError();
    });

    it('should not throw error for empty string or null notes', () => {
      expect(() => ShipmentsValidator.validateReturnNotePayload({ notes: '' }))
        .not.toThrowError();
      expect(() => ShipmentsValidator.validateReturnNotePayload({ notes: null }))
        .not.toThrowError();
    });
  });
  describe('validateUpdateReturnShippingInfoPayload', () => {
    it('should not throw error when all optional fields are valid', () => {
      const payload = {
        courierName: 'JNE',
        courierService: 'YES',
        trackingNumber: 'JNE1234567890',
        pickedUpAt: '2025-06-10T10:00:00Z',
        returnedAt: '2025-06-11T14:00:00Z',
      };
      expect(() => ShipmentsValidator.validateUpdateReturnShippingInfoPayload(payload))
        .not.toThrowError();
    });

    it('should throw error when courierName is too short', () => {
      const payload = { courierName: 'J' };
      expect(() => ShipmentsValidator.validateUpdateReturnShippingInfoPayload(payload))
        .toThrowError(InvariantError);
    });

    it('should throw error when trackingNumber is too short', () => {
      const payload = { trackingNumber: '1234' };
      expect(() => ShipmentsValidator.validateUpdateReturnShippingInfoPayload(payload))
        .toThrowError(InvariantError);
    });

    it('should throw error when pickupUpAt is invalid date', () => {
      const payload = { pickupUpAt: 'invalid-date' };
      expect(() => ShipmentsValidator.validateUpdateReturnShippingInfoPayload(payload))
        .toThrowError(InvariantError);
    });

    it('should not throw error when payload is empty (all optional)', () => {
      expect(() => ShipmentsValidator.validateUpdateReturnShippingInfoPayload({}))
        .not.toThrowError();
    });
  });
});

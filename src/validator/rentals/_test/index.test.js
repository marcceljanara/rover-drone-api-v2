import InvariantError from '../../../exceptions/InvariantError.js';
import RentalsValidator from '../index.js';

describe('RentalsValidator', () => {
  describe('Params Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      const payload = {};

      expect(() => RentalsValidator.validateParamsPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      const payload = { id: 123 };

      expect(() => RentalsValidator.validateParamsPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because payload meets validation criteria', () => {
      const payload = { id: 'rentals-123' };

      expect(() => RentalsValidator.validateParamsPayload(payload)).not.toThrowError();
    });
  });
  describe('Put Status Rental Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // Arrange
      const payload = {};

      // Action and Assert
      expect(() => RentalsValidator
        .validatePutStatusRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        rentalStatus: 123,
      };

      // Action and Assert
      expect(() => RentalsValidator
        .validatePutStatusRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload not contain valid input [active, completed, cancelled]', () => {
      // Arrange
      const payload = { rentalStatus: 'pending' };

      // Action and Assert
      expect(() => RentalsValidator
        .validatePutStatusRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because payload meet validation criteria', () => {
      // Arrange
      const payload = { rentalStatus: 'active' };

      // Action and Assert
      expect(() => RentalsValidator.validatePutStatusRentalPayload(payload))
        .not.toThrowError(InvariantError);
    });
  });

  describe('Post Add Rental Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // Arrange
      const payload = {};

      // Action and Assert
      expect(() => RentalsValidator
        .validatePostAddRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        interval: true,
      };

      // Action and Assert
      expect(() => RentalsValidator
        .validatePostAddRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error when payload meet criteria', () => {
      // Arrange
      const payload = {
        interval: 6,
        sensors: ['temperature', 'humidity'],
        shippingAddressId: 'addressId',
        shippingCost: 500000,
      };

      // Action and Assert
      expect(() => RentalsValidator
        .validatePostAddRentalPayload(payload)).not.toThrowError(InvariantError);
    });
  });
  describe('Put Cancel Rental Payload', () => {
    it('should throw error when payload did not contain needed property', () => {
      // Arrange
      const payload = {};

      // Action and Assert
      expect(() => RentalsValidator
        .validatePutCancelRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload did not meet data type specification', () => {
      // Arrange
      const payload = {
        rentalStatus: 123,
      };

      // Action and Assert
      expect(() => RentalsValidator
        .validatePutCancelRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should throw error when payload not contain valid input [cancelled]', () => {
      // Arrange
      const payload = { rentalStatus: 'pending' };

      // Action and Assert
      expect(() => RentalsValidator
        .validatePutCancelRentalPayload(payload)).toThrowError(InvariantError);
    });

    it('should not throw error because payload meet validation criteria', () => {
      // Arrange
      const payload = { rentalStatus: 'cancelled' };

      // Action and Assert
      expect(() => RentalsValidator.validatePutCancelRentalPayload(payload))
        .not.toThrowError(InvariantError);
    });
  });
});

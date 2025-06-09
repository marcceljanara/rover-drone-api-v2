import dotenv from 'dotenv';
import RentalsService from '../RentalsService.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import InvariantError from '../../../exceptions/InvariantError.js';
import AuthorizationError from '../../../exceptions/AuthorizationError.js';
import pool from '../../../config/postgres/pool.js';

dotenv.config();

describe('RentalsService', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
  });

  describe('changeStatusRental function', () => {
    it('should change status rental active and add rental_id to table devices correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const payload = {
        id,
        rentalStatus: 'active',
      };

      // Action
      const rental = await rentalsService.changeStatusRental(payload.id, payload.rentalStatus);

      // Assert
      const device = await DevicesTableTestHelper.findDeviceById(deviceId);
      expect(rental.rental_status).toBe('active');
      expect(device.rental_id).toBe(id);
    });

    it('should change status rental completed and clear rental_id to table devices correctly when rental_status pending', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const payload = {
        id,
        rentalStatus: 'completed',
      };

      // Action
      const rental = await rentalsService.changeStatusRental(payload.id, payload.rentalStatus);
      // Assert
      const device = await DevicesTableTestHelper.findDeviceById(deviceId);
      expect(rental.rental_status).toBe('completed');
      expect(device.rental_id).toBe(null);
    });
    it('should throw error when try completed rental while rental_status active', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const payload = {
        id,
        rentalStatus: 'completed',
      };
      await rentalsService.changeStatusRental(payload.id, 'active');

      // Action and Assert
      await expect(rentalsService.changeStatusRental(payload.id, payload.rentalStatus))
        .rejects.toThrow(InvariantError);
    });

    it('should throw error if device not available', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const payload = {
        id,
        rentalStatus: 'active',
      };
      await DevicesTableTestHelper.deleteDevice(deviceId);

      // Action
      await expect(rentalsService.changeStatusRental(id, payload.rentalStatus))
        .rejects.toThrow(NotFoundError);
    });
    it('should throw error if rental not found', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const id = 'notfoundrental';

      const payload = {
        id,
        rentalStatus: 'active',
      };

      // Action
      await expect(rentalsService.changeStatusRental(id, payload.rentalStatus))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteRental function', () => {
    it('should delete rental corretly', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);

      // Action
      await rentalsService.deleteRental(id);

      // Assert
      const rental = await RentalsTableTestHelper.findRentalById(id);
      expect(rental).toHaveLength(0);
    });

    it('should throw error if rental not found', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const id = 'notfoundrental';

      // Action
      await expect(rentalsService.deleteRental(id))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw error if rental_status is active', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const payload = {
        id,
        rentalStatus: 'active',
      };
      await rentalsService.changeStatusRental(id, payload.rentalStatus);

      // Action and Assert
      await expect(rentalsService.deleteRental(id)).rejects.toThrow(InvariantError);
    });
  });

  describe('addRental function', () => {
    it('should add rental correctly with 0 sensor', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };

      // Action
      const { id, cost } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);

      // Assert
      const rental = await RentalsTableTestHelper.findRentalById(id);
      expect(rental[0]).toBeDefined();
      expect(rental[0].id).toBe(id);
      expect(cost).toBe(18600000);
      expect(rental[0].rental_status).toBe('pending');
    });
    it('should add rental correctly with 2 sensors', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };

      // Action
      const { id, cost } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental, ['temperature', 'humidity']);

      // Assert
      const rental = await RentalsTableTestHelper.findRentalById(id);
      expect(rental[0]).toBeDefined();
      expect(rental[0].id).toBe(id);
      expect(cost).toBe(18710000);
      expect(rental[0].rental_status).toBe('pending');
    });

    it('should throw error when role admin adding rental', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      // Action and Assert
      await expect(rentalsService.addRental(user, 6, 'admin', 'address', payloadRental)).rejects.toThrow(AuthorizationError);
    });

    it('should throw error when device not available', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      // Action and Assert
      await expect(rentalsService.addRental(user, 6, 'user', addressId, payloadRental)).rejects.toThrow(NotFoundError);
    });
  });
  describe('getAllRental function', () => {
    it('should return all rental by role admin', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const addressId2 = await UsersTableTestHelper.addAddress(user2, { id: 'address-345' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      await rentalsService.addRental(user2, 6, 'user', addressId2, payloadRental);

      // Action
      const rental = await rentalsService.getAllRental('admin', 'admin-dummy');

      // Assert
      expect(rental).toHaveLength(2);
    });

    it('should return all rental by spesific userId', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const addressId2 = await UsersTableTestHelper.addAddress(user2, { id: 'address-345' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      await rentalsService.addRental(user2, 6, 'user', addressId2, payloadRental);

      // Action
      const rental = await rentalsService.getAllRental('user', user1);

      // Assert
      expect(rental).toHaveLength(1);
    });
  });

  describe('getDetailRental function', () => {
    it('should detail rental by admin', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const addressId2 = await UsersTableTestHelper.addAddress(user2, { id: 'address-345' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      await rentalsService.addRental(user2, 6, 'user', addressId2, payloadRental);

      // Action
      const rental = await rentalsService.getDetailRental(id, 'admin', 'admindummy');

      // Assert
      expect(rental.id).toBe(id);
      expect(rental.user_id).toBe(user1);
    });
    it('should throw error when role admin not found rental', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const id = 'notfound';

      // Action and Assert
      await expect(rentalsService.getDetailRental(id, 'admin', 'admindummy')).rejects.toThrow(NotFoundError);
    });

    it('should detail rental by userid', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const addressId2 = await UsersTableTestHelper.addAddress(user2, { id: 'address-345' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      await rentalsService.addRental(user2, 6, 'user', addressId2, payloadRental);

      // Action
      const rental = await rentalsService.getDetailRental(id, 'user', user1);

      // Assert
      expect(rental.id).toBe(id);
      expect(rental.user_id).toBe(user1);
    });

    it('should throw error when role userid not found rental', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const addressId2 = await UsersTableTestHelper.addAddress(user2, { id: 'address-345' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      await rentalsService.addRental(user2, 6, 'user', addressId2, payloadRental);

      // Action and Assert
      await expect(rentalsService.getDetailRental(id, 'user', user2)).rejects.toThrow(NotFoundError);
    });
  });

  describe('cancelRental function', () => {
    it('should cancel rental by user correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      const payload = {
        userId: user1,
        id,
        rentalStatus: 'cancelled',
      };

      // Action
      await rentalsService.cancelRental(payload, 'user');

      // Assert
      const rental = await RentalsTableTestHelper.findRentalById(id);
      expect(rental[0].rental_status).toBe(payload.rentalStatus);
    });

    it('should throw authorization error when admin try to cancel rental', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental);
      const payload = {
        userId: user1,
        id,
        rentalStatus: 'cancelled',
      };

      // Action and assert
      await expect(rentalsService.cancelRental(payload, 'admin')).rejects.toThrow(AuthorizationError);
    });

    it('should throw not found error when rental not found', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const id = 'notfound';
      const payload = {
        userId: user1,
        id,
        rentalStatus: 'cancelled',
      };

      // Action and Assert
      await expect(rentalsService.cancelRental(payload, 'user')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllSensors function', () => {
    it('should get all sensors id and cost', async () => {
      // Arrange
      const rentalsService = new RentalsService();

      // Action
      const choice = await rentalsService.getAllSensors();

      // Assert
      expect(choice.length).toBe(3);
    });
  });

  // describe('upgradeRentalSensors function', () => {
  //   it('should upggrade amount sensors correctly', async () => {
  //     // Arrange
  //     const rentalsService = new RentalsService();
  //     const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
  //     await DevicesTableTestHelper.addDevice({ id: 'device-123' });
  //     const { id } = await rentalsService.addRental(user1, 6, 'user');
  //     await rentalsService.changeStatusRental(id, 'active');

  //     // Action
  //     const rental = await rentalsService.upgradeRentalSensors(id, ['temperature', 'humidity']);

  //     // Assert
  //     expect(rental.addedSensors).toEqual(['temperature', 'humidity']);
  //     expect(rental.additionalCost).toBe(110000);
  //     expect(rental.paymentId).toBeDefined();
  //   });
  // });
});

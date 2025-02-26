import pkg from 'pg';
import dotenv from 'dotenv';
import RentalsService from '../RentalsService.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import InvariantError from '../../../exceptions/InvariantError.js';
import AuthorizationError from '../../../exceptions/AuthorizationError.js';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool();

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
      const { id } = await rentalsService.addRental(user, 6, 'user');
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

    it('should change status rental completed and clear rental_id to table devices correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { id } = await rentalsService.addRental(user, 6, 'user');
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

    it('should throw error if device not available', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { id } = await rentalsService.addRental(user, 6, 'user');
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
      const { id } = await rentalsService.addRental(user, 6, 'user');

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
      const { id } = await rentalsService.addRental(user, 6, 'user');
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
    it('should add rental correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Action
      const { id, cost } = await rentalsService.addRental(user, 6, 'user');

      // Assert
      const rental = await RentalsTableTestHelper.findRentalById(id);
      expect(rental[0]).toBeDefined();
      expect(rental[0].id).toBe(id);
      expect(cost).toBe(17100000);
      expect(rental[0].rental_status).toBe('pending');
    });

    it('should throw error when role admin adding rental', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Action and Assert
      await expect(rentalsService.addRental(user, 6, 'admin')).rejects.toThrow(AuthorizationError);
    });

    it('should throw error when device not available', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });

      // Action and Assert
      await expect(rentalsService.addRental(user, 6, 'user')).rejects.toThrow(NotFoundError);
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
      await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

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
      await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

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
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

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
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

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
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

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
      const { id } = await rentalsService.addRental(user1, 6, 'user');
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
      const { id } = await rentalsService.addRental(user1, 6, 'user');
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
});

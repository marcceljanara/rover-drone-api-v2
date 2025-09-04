import dotenv from 'dotenv';
// import InvariantError from '../../../exceptions/InvariantError.js';
// import AuthorizationError from '../../../exceptions/AuthorizationError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import UserService from '../UserServices.js';
import pool from '../../../config/postgres/pool.js';
import CacheService from '../../redis/CacheService.js';

dotenv.config();

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

describe('Address Service', () => {
  const cacheService = new CacheService();
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  describe('addAddress Function', () => {
    it('should add newAddress correctly', async () => {
      // Arrange
      const user = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      const userService = new UserService(cacheService);
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };
      // Action
      const addressId = await userService.addAddress(user, payload);

      // Assert
      expect(addressId).toBeDefined();
    });
  });

  describe('getAllAddress function', () => {
    it('should get all address correctly', async () => {
      // Arrange
      const userService = new UserService(cacheService);
      const user = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await UsersTableTestHelper.addAddress(user, { id: 'address-345' });

      // Action
      const addresses = await userService.getAllAddress(user);

      // Assert
      expect(addresses).toHaveLength(2);
    });
    it('should throw not found error if address not exist', async () => {
    // Arrange
      const userService = new UserService(cacheService);
      const userId = 'notfound';

      // Action and Asert
      await expect(userService.getAllAddress(userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDetailAddress function', () => {
    it('should get detail address correctly', async () => {
      // Arrange
      const userService = new UserService(cacheService);
      const user = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });

      // Action
      const address = await userService.getDetailAddress(user, addressId);

      // Assert
      expect(address.id).toBe(addressId);
    });
    it('should throw not found error if address not exist', async () => {
    // Arrange
      const userService = new UserService(cacheService);
      const userId = 'notfound';

      // Action and Asert
      await expect(userService.getDetailAddress(userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateAddress Function', () => {
    it('should Update Address correctly', async () => {
      // Arrange
      const user = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      const id = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const userService = new UserService(cacheService);
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'xxx',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };
      // Action
      const addressId = await userService.updateAddress(user, id, payload);

      // Assert
      const address = await UsersTableTestHelper.findAddressById(id);
      expect(addressId).toBe(id);
      expect(address.alamat_lengkap).toBe('xxx');
    });
    it('should throw not found error if address not exist', async () => {
    // Arrange
      const userService = new UserService(cacheService);
      const userId = 'notfound';
      const payload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'xxx',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };

      // Action and Asert
      await expect(userService.updateAddress(userId, 'address', payload)).rejects.toThrow(NotFoundError);
    });
  });

  describe('setDefaultAddress function', () => {
    it('should set default Address', async () => {
      // Arrange
      const user = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      const id = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const userService = new UserService(cacheService);

      // Action
      const addressId = await userService.setDefaultAddress(user, id);

      // Assert
      const address = await UsersTableTestHelper.findAddressById(addressId);
      expect(address.is_default).toBe(true);
    });
    it('should throw not found error if address not exist', async () => {
    // Arrange
      const userService = new UserService(cacheService);
      const userId = 'notfound';

      // Action and Asert
      await expect(userService.setDefaultAddress(userId, 'address')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAddress function', () => {
    it('should delete address correctly', async () => {
      // Arrange
      const user = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      const id = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const userService = new UserService(cacheService);

      // Action
      await userService.deleteAddress(user, id);

      // Assert
      const address = await UsersTableTestHelper.findAddressById(id);
      expect(address).toBe(undefined);
    });
    it('should throw not found error if address not exist', async () => {
    // Arrange
      const userService = new UserService(cacheService);
      const userId = 'notfound';

      // Action and Asert
      await expect(userService.deleteAddress(userId, 'address')).rejects.toThrow(NotFoundError);
    });
  });
});

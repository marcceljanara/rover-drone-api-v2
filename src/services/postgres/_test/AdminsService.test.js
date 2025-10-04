import dotenv from 'dotenv';
import InvariantError from '../../../exceptions/InvariantError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import AuthorizationError from '../../../exceptions/AuthorizationError.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationTableHelper.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import AdminsService from '../AdminsService.js';
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

describe('Admins Service', () => {
  const cacheService = new CacheService();
  afterAll(async () => {
    await pool.end();
  });
  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });
  describe('registerUser function', () => {
    it('should register user correctly', async () => {
      // arrange
      const payload = {
        username: 'userku',
        password: 'superpassword',
        fullname: 'User Keren',
        email: 'userr@gmail.com',
      };
      const adminsService = new AdminsService(cacheService);

      // Actions
      const users = await adminsService.registerUser(payload);

      // Assert
      const user = await UsersTableTestHelper.findUsersById(users);
      expect(user[0].username).toBe(payload.username);
      expect(user[0].fullname).toBe(payload.fullname);
      expect(user[0].email).toBe(payload.email);
      expect(user[0].is_verified).toBe(true);
      expect(user).toHaveLength(1);
    });
  });
  describe('getAllUser function', () => {
    it('should show all user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123', email: 'user123@gmail.com' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'halo', email: 'hehe@gmail.com' });
      await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
      const adminsService = new AdminsService(cacheService);
      const limit = 10;
      const page = 1;
      const offset = (page - 1) * limit;

      // Action
      const users = await adminsService.getAllUser('', limit, offset);

      // Assert
      expect(users).toHaveLength(3);
    });
  });
  describe('getCountData function', () => {
    it('should get count data correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123', email: 'user123@gmail.com' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'halo', email: 'hehe@gmail.com' });
      await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
      const adminsService = new AdminsService(cacheService);
      const search = 'halo';

      // Action
      const totalCount = await adminsService.getCountData(search);

      // Assert
      expect(totalCount).toBe(1);
    });
  });
  describe('getDetailUser function', () => {
    it('should get detail user correctly', async () => {
      // Arrange
      const adminsService = new AdminsService(cacheService);
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });

      // Actions
      const detailUser = await adminsService.getDetailUser(user);

      // Assert
      expect(detailUser.id).toBe(user);
      expect(detailUser.role).toBe('user');
    });
    it('should get detail user from cache', async () => {
      // Arrange
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const adminsService = new AdminsService(cacheService);

      const cachedData = {
        id: userId,
        username: 'cachedUser',
        email: 'cache@gmail.com',
        role: 'user',
        is_verified: true,
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(JSON.stringify(cachedData));

      // Action
      const detailUser = await adminsService.getDetailUser(userId);

      // Assert
      expect(detailUser.id).toBe(userId);
      expect(detailUser.username).toBe('cachedUser');
    });

    it('should throw Not Found Error when user not found', async () => {
      // Arrange
      const adminsService = new AdminsService(cacheService);

      // Force cache to throw error
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        throw new Error('Cache miss');
      });

      // Action and Assert
      await expect(adminsService.getDetailUser('user-123')).rejects.toThrow(NotFoundError);
    });
  });
  describe('checkIsAdmin Function', () => {
    it('should throw Authorization Error for illegal action', async () => {
      // Arrange
      const admin = await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
      const adminService = new AdminsService(cacheService);

      // Action and Assert
      await expect(adminService.checkIsAdmin(admin)).rejects.toThrow(AuthorizationError);
    });
    it('should throw error if user not found', async () => {
      // Arrange
      const adminService = new AdminsService(cacheService);

      // Action and assert
      await expect(adminService.checkIsAdmin('user-123')).rejects.toThrow(NotFoundError);
    });
  });
  describe('deleteUser function', () => {
    it('should delete user correctly', async () => {
      // Arrange
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const adminsService = new AdminsService(cacheService);

      // Action
      await adminsService.deleteUser(userId);

      // Assert
      const user = await UsersTableTestHelper.findUsersById(userId);
      expect(user).toHaveLength(0);
    });
    it('should throw AuthorizationError when trying to delete admin', async () => {
      // Arrange
      const adminId = await UsersTableTestHelper.addAdmin({ id: 'admin-123', email: 'admin12345@gmail.com' });
      const adminsService = new AdminsService(cacheService);

      // Action & Assert
      await expect(adminsService.deleteUser(adminId)).rejects.toThrow(AuthorizationError);
    });
  });
  describe('changePasswordUser function', () => {
    it('should change password user correctly', async () => {
      // Arrange
      const payload = {
        id: 'user-123',
        password: 'superpassword',
      };
      await UsersTableTestHelper.addUser(payload);
      const adminsService = new AdminsService(cacheService);

      // Action and Assert
      await expect(adminsService.changePasswordUser(payload.id, 'testpwd', 'testpwd')).resolves.not.toThrow();
    });
    it('should throw AuthorizationError when trying to change password of admin', async () => {
      // Arrange
      const adminId = await UsersTableTestHelper.addAdmin({ id: 'admin-123', email: 'admin12345@gmail.com' });
      const adminsService = new AdminsService(cacheService);

      // Action & Assert
      await expect(adminsService.changePasswordUser(adminId, 'newpwd', 'newpwd')).rejects.toThrow(AuthorizationError);
    });

    it('should throw Invariant Error when newpassword and confnewpassword not same', async () => {
      // Arrange
      const payload = {
        id: 'user-123',
        password: 'superpassword',
      };
      await UsersTableTestHelper.addUser(payload);
      const adminsService = new AdminsService(cacheService);

      // Action and assert
      await expect(adminsService.changePasswordUser(payload.id, 'passwordku', 'passworddia')).rejects.toThrow(InvariantError);
    });
  });
});

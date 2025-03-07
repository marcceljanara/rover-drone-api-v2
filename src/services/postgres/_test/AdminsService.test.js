import dotenv from 'dotenv';
import InvariantError from '../../../exceptions/InvariantError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import AuthorizationError from '../../../exceptions/AuthorizationError.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationTableHelper.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import AdminsService from '../AdminsService.js';
import pool from '../../../config/postgres/pool.js';

dotenv.config();

describe('Admins Service', () => {
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
      const adminsService = new AdminsService();

      // Actions
      const users = await adminsService.registerUser(payload);

      // Assert
      const user = await UsersTableTestHelper.findUsersById(users);
      expect(user[0].username).toBe(payload.username);
      expect(user[0].fullname).toBe(payload.fullname);
      expect(user[0].email).toBe(payload.email);
      expect(user[0].is_verified).toBe(true);
      expect(user[0].otp_code).toBe(null);
      expect(user).toHaveLength(1);
    });
  });
  describe('getAllUser function', () => {
    it('should show all user', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'halo', email: 'hehe@gmail.com' });
      await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
      const adminsService = new AdminsService();
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
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'halo', email: 'hehe@gmail.com' });
      await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
      const adminsService = new AdminsService();
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
      const adminsService = new AdminsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });

      // Actions
      const detailUser = await adminsService.getDetailUser(user);

      // Assert
      expect(detailUser.id).toBe(user);
      expect(detailUser.role).toBe('user');
    });
    it('should throw Not Found Error when user not found', async () => {
      // Arrange
      const adminsService = new AdminsService();

      // Action and Assert
      await expect(adminsService.getDetailUser('user-123')).rejects.toThrow(NotFoundError);
    });
  });
  describe('checkIsAdmin Function', () => {
    it('should throw Authorization Error for illegal action', async () => {
      // Arrange
      const admin = await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
      const adminService = new AdminsService();

      // Action and Assert
      await expect(adminService.checkIsAdmin(admin)).rejects.toThrow(AuthorizationError);
    });
    it('should throw error if user not found', async () => {
      // Arrange
      const adminService = new AdminsService();

      // Action and assert
      await expect(adminService.checkIsAdmin('user-123')).rejects.toThrow(NotFoundError);
    });
  });
  describe('deleteUser function', () => {
    it('should delete user correctly', async () => {
      // Arrange
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const adminsService = new AdminsService();

      // Action
      await adminsService.deleteUser(userId);

      // Assert
      const user = await UsersTableTestHelper.findUsersById(userId);
      expect(user).toHaveLength(0);
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
      const adminsService = new AdminsService();

      // Action and Assert
      await expect(adminsService.changePasswordUser(payload.id, 'testpwd', 'testpwd')).resolves.not.toThrow();
    });
    it('should throw Invariant Error when newpassword and confnewpassword not same', async () => {
      // Arrange
      const payload = {
        id: 'user-123',
        password: 'superpassword',
      };
      await UsersTableTestHelper.addUser(payload);
      const adminsService = new AdminsService();

      // Action and assert
      await expect(adminsService.changePasswordUser(payload.id, 'passwordku', 'passworddia')).rejects.toThrow(InvariantError);
    });
  });
});

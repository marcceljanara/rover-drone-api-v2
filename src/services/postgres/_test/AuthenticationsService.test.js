import dotenv from 'dotenv';
import InvariantError from '../../../exceptions/InvariantError.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationTableHelper.js';
import AuthenticationsService from '../AuthenticationsService.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import AuthenticationError from '../../../exceptions/AuthenticationError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import pool from '../../../config/postgres/pool.js';

dotenv.config();

describe('Authentication Service', () => {
  afterAll(async () => {
    await pool.end();
  });
  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });
  describe('addRefreshToken function', () => {
    it('should add token to database', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';

      // Action
      await authenticationsService.addRefreshToken(token);
      // Assert

      const tokens = await AuthenticationsTableTestHelper.findToken(token);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toBe(token);
    });
  });
  describe('verifyRefreshToken function', () => {
    it('should throw InvariantError if token not available', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';

      // Action and Assert
      await expect(authenticationsService.verifyRefreshToken(token))
        .rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError if token is available', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';
      await authenticationsService.addRefreshToken(token);

      // Action and Assert
      await expect(authenticationsService.verifyRefreshToken(token))
        .resolves.not.toThrow(InvariantError);
    });
  });
  describe('deleteRefreshToken function', () => {
    it('should delete token from database', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';
      await authenticationsService.addRefreshToken(token);

      // Actions
      await authenticationsService.deleteRefreshToken(token);

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken(token);
      expect(tokens).toHaveLength(0);
    });
  });
  describe('verifyUserCredential', () => {
    it('it should throw error Authentication Error if email wrong', async () => {
      // Arrange
      const email = 'salah@gmail.com';
      const password = 'superpassword';
      const authenticationsService = new AuthenticationsService();
      await UsersTableTestHelper.addUser({ id: 'user-123', email: 'email@gmail.com', password: 'superpassword' });

      // Action and Assert
      await expect(authenticationsService.verifyUserCredential(email, password))
        .rejects.toThrow(AuthenticationError);
    });
    it('it should throw error Authentication Error if password wrong', async () => {
      // Arrange

      const email = 'email@gmail.com';
      const password = 'lebahganteng';

      const authenticationsService = new AuthenticationsService();
      await UsersTableTestHelper.addUser({ id: 'user-123', email: 'email@gmail.com', password: 'superpassword' });

      // Action and Assert
      await expect(authenticationsService.verifyUserCredential(email, password))
        .rejects.toThrow(AuthenticationError);
    });
    it('should pass verification if credential correct', async () => {
      // Arrange

      const email = 'email@gmail.com';
      const password = 'superpassword';

      const authenticationsService = new AuthenticationsService();
      await UsersTableTestHelper.addUser({ id: 'user-123', email: 'email@gmail.com', password: 'superpassword' });

      // Action and Assert
      await expect(authenticationsService.verifyUserCredential(email, password))
        .resolves.not.toThrow(AuthenticationError);
    });
  });
  describe('checkStatusAccount', () => {
    it('it should throw Not Found Error if email not found', async () => {
      // Arrange
      const email = 'salah@gmail.com';
      const authenticationsService = new AuthenticationsService();
      await UsersTableTestHelper.addUser({ id: 'user-123', email: 'email@gmail.com', password: 'superpassword' });

      // Action and Assert
      await expect(authenticationsService.checkStatusAccount(email))
        .rejects.toThrow(NotFoundError);
    });
    it('it should throw error Authentication Error if email not verified yet', async () => {
      // Arrange
      const email = 'email@gmail.com';
      const authenticationsService = new AuthenticationsService();
      await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'email@gmail.com', password: 'superpassword', is_verified: false,
      });

      // Action and Assert
      await expect(authenticationsService.checkStatusAccount(email))
        .rejects.toThrow(AuthenticationError);
    });
    it('should pass verification if email verified', async () => {
      // Arrange
      const email = 'email@gmail.com';

      const authenticationsService = new AuthenticationsService();
      await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'email@gmail.com', password: 'superpassword',
      });

      // Action and Assert
      await expect(authenticationsService.checkStatusAccount(email))
        .resolves.not.toThrow();
    });
  });
});

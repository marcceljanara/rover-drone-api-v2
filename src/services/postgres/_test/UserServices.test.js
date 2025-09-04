import bcrypt from 'bcrypt';

import UserService from '../UserServices.js';
import InvariantError from '../../../exceptions/InvariantError.js';
import AuthenticationError from '../../../exceptions/AuthenticationError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import pool from '../../../config/postgres/pool.js';
import CacheService from '../../redis/CacheService.js';

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

// Mocking pg.Pool dan bcrypt
jest.mock('pg', () => {
  const mClient = { query: jest.fn(), release: jest.fn() };
  const mPool = { connect: jest.fn(() => mClient), query: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('bcrypt');

describe('UserService', () => {
  let userService;
  const cacheService = new CacheService();

  beforeEach(() => {
    userService = new UserService(cacheService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await pool.end(); // Menutup koneksi setelah semua pengujian selesai.
  });

  describe('registerUser', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);
    });

    it('should register a user successfully', async () => {
    // Arrange
      const mockPayload = {
        username: 'testuser',
        password: 'password123',
        fullname: 'Test User',
        email: 'test@example.com',
      };

      const hashedPassword = 'hashedpassword123';
      bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);

      // Mock query behaviour
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'user-123' }] }) // Insert users
        .mockResolvedValueOnce({}) // Insert auth_providers
        .mockResolvedValueOnce({}); // COMMIT

      // Act
      const result = await userService.registerUser(mockPayload);

      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringContaining('INSERT INTO users'),
        values: expect.arrayContaining([
          expect.stringContaining('user-'),
          mockPayload.username,
          mockPayload.fullname,
          mockPayload.email,
          false,
        ]),
      });
      expect(mockClient.query).toHaveBeenCalledWith({
        text: expect.stringContaining('INSERT INTO auth_providers'),
        values: expect.arrayContaining([
          expect.stringContaining('auth-'),
          expect.stringContaining('user-'),
          'local',
          mockPayload.username,
          hashedPassword,
        ]),
      });
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual(expect.stringContaining('user-'));
    });

    it('should throw InvariantError when insert users fails', async () => {
    // Arrange
      const mockPayload = {
        username: 'testuser',
        password: 'password123',
        fullname: 'Test User',
        email: 'test@example.com',
      };

      bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword123');

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Insert users gagal
        .mockResolvedValueOnce({}); // ROLLBACK

      // Act & Assert
      await expect(userService.registerUser(mockPayload)).rejects.toThrow(InvariantError);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('checkExistingUser', () => {
    it('should throw InvariantError when email or username already exists', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [{ username: 'testuser', email: 'test@example.com' }] });

      // Act & Assert
      await expect(userService.checkExistingUser({ email: 'test@example.com', username: 'testuser' }))
        .rejects.toThrow(InvariantError);

      expect(pool.query).toHaveBeenCalledWith({
        text: 'SELECT username, email FROM users WHERE username = $1 OR email = $2',
        values: ['testuser', 'test@example.com'],
      });
    });

    it('should not throw an error when email and username are not registered', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(userService.checkExistingUser({ email: 'new@example.com', username: 'newuser' }))
        .resolves.not.toThrow();
    });
  });

  describe('generateOtp', () => {
    it('should generate OTP and update it in the database', async () => {
    // Arrange
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ otp_code: '123456' }],
      });

      // Act
      const otp = await userService.generateOtp('test@example.com');

      // Assert
      expect(otp).toHaveLength(6);
      expect(pool.query).toHaveBeenCalledWith({
        text: `UPDATE auth_providers ap 
      SET otp_code = $1, otp_expiry = NOW() + INTERVAL '15 minutes'
      FROM users u 
      WHERE u.email = $2 AND u.is_verified = FALSE 
      RETURNING ap.otp_code`,
        values: [expect.any(String), 'test@example.com'],
      });
    });

    it('should throw InvariantError if email is not found or verified', async () => {
    // Arrange
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      // Act & Assert
      await expect(userService.generateOtp('unknown@example.com'))
        .rejects
        .toThrow(InvariantError);
    });
  });

  describe('verifyOtp', () => {
    let mockClient;

    beforeEach(() => {
    // Mock client untuk transaksi
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);
    });

    it('should verify OTP successfully', async () => {
    // Arrange: SELECT OTP cocok dan belum expired
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ otp_code: '123456', otp_expiry: new Date(Date.now() + 1000) }],
      });

      // Act
      await userService.verifyOtp('test@example.com', '123456');

      // Assert
      expect(pool.query).toHaveBeenCalledWith({
        text: `SELECT ap.otp_code, ap.otp_expiry 
      FROM auth_providers ap 
      JOIN users u ON ap.user_id = u.id
      WHERE u.email = $1`,
        values: ['test@example.com'],
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('UPDATE auth_providers'),
        }),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('UPDATE users'),
        }),
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw AuthenticationError if OTP is invalid', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ otp_code: '654321', otp_expiry: new Date(Date.now() + 1000) }],
      });

      await expect(
        userService.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if OTP is expired', async () => {
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ otp_code: '123456', otp_expiry: new Date(Date.now() - 1000) }],
      });

      await expect(
        userService.verifyOtp('test@example.com', '123456'),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError when email is not found', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(
        userService.verifyOtp('notfound@gmail.com', '123456'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});

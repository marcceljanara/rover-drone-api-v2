import bcrypt from 'bcrypt';

import UserService from '../UserServices.js';
import InvariantError from '../../../exceptions/InvariantError.js';
import AuthenticationError from '../../../exceptions/AuthenticationError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import pool from '../../../config/postgres/pool.js';

// Mocking pg.Pool dan bcrypt
jest.mock('pg', () => {
  const mClient = { query: jest.fn(), release: jest.fn() };
  const mPool = { connect: jest.fn(() => mClient), query: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('bcrypt');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await pool.end(); // Menutup koneksi setelah semua pengujian selesai.
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      // Arrange
      const mockPayload = {
        username: 'testuser',
        password: 'password123',
        fullname: 'Test User',
        email: 'test@example.com',
      };

      const hashedPassword = 'hashedpassword123';
      bcrypt.hash.mockResolvedValue(hashedPassword);

      pool.query.mockResolvedValueOnce({ rows: [{ id: 'user-123' }] });

      // Act
      const result = await userService.registerUser(mockPayload);

      // Assert
      expect(pool.query).toHaveBeenCalledWith({
        text: 'INSERT INTO users (id, username, password, fullname, email, is_verified) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
        values: expect.arrayContaining([
          expect.stringContaining('user-'),
          mockPayload.username,
          hashedPassword,
          mockPayload.fullname,
          mockPayload.email,
          false,
        ]),
      });
      expect(result).toEqual('user-123');
    });

    it('should throw InvariantError when user registration fails', async () => {
      // Arrange
      const mockPayload = {
        username: 'testuser',
        password: 'password123',
        fullname: 'Test User',
        email: 'test@example.com',
      };

      bcrypt.hash.mockResolvedValue('hashedpassword123');
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Act & Assert
      await expect(userService.registerUser(mockPayload)).rejects.toThrow(InvariantError);
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
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ otp_code: '123456' }] });

      // Act
      const otp = await userService.generateOtp('test@example.com');

      // Assert
      expect(otp).toHaveLength(6);
      expect(pool.query).toHaveBeenCalledWith({
        text: 'UPDATE users SET otp_code = $1, otp_expiry = NOW() + INTERVAL \'15 minutes\' WHERE email = $2 AND is_verified = FALSE RETURNING otp_code',
        values: [expect.any(String), 'test@example.com'],
      });
    });

    it('should throw InvariantError if email is not found', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(userService.generateOtp('unknown@example.com')).rejects.toThrow(InvariantError);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ otp_code: '123456', otp_expiry: new Date(Date.now() + 1000) }] });
      pool.query.mockResolvedValueOnce({});

      // Act
      await userService.verifyOtp('test@example.com', '123456');

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw AuthenticationError if OTP is invalid', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ otp_code: '654321', otp_expiry: new Date() }] });

      await expect(userService.verifyOtp('test@example.com', '123456')).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if OTP is expired', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ otp_code: '123456', otp_expiry: new Date(Date.now() - 1000) }] });

      await expect(userService.verifyOtp('test@example.com', '123456')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError when email are not found', async () => {
      // Arrange
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      // Act & Assert
      await expect(userService.verifyOtp('notfound@gmail.com', '123456')).rejects.toThrow(NotFoundError);
    });
  });
});

import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';

dotenv.config();

describe('/v1/users endpoints', () => {
  let server;

  beforeAll(async () => {
    server = createServer();
  });

  afterAll(async () => {
    await pool.end();
  });
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  describe('POST /v1/users/register', () => {
    it('should response 201 and register new user', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      // Action
      const response = await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.userId).toBeDefined();
    });
    it('should response 400 and fail error email or username already exists', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };
      await UsersTableTestHelper.addUser({
        username: requestPayload.username,
        email: requestPayload.email,
      });

      // Action
      const response = await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('POST /v1/users/verify-otp', () => {
    it('should return response 200 and verify otp', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      const responseRegister = await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      const otpCode = await UsersTableTestHelper.findOtpUserById(responseRegister.body.data.userId);

      // Action
      const response = await request(server)
        .post('/v1/users/verify-otp')
        .send({ email: requestPayload.email, otp: otpCode });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });

    it('should return response 404 if email notfound', async () => {
      // Arrange and Action
      const response = await request(server)
        .post('/v1/users/verify-otp')
        .send({ email: 'notfound@gmail.com', otp: '123456' });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });

    it('should return response 401 if otp code is wrong', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Action
      const response = await request(server)
        .post('/v1/users/verify-otp')
        .send({ email: requestPayload.email, otp: '123456' });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(401);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('POST /v1/users/resend-otp', () => {
    it('should return response 200 and resend new otp code', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Action
      const response = await request(server)
        .post('/v1/users/resend-otp')
        .send({ email: requestPayload.email });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response 404 if email notfound', async () => {
      // Arrange and Action
      const response = await request(server)
        .post('/v1/users/resend-otp')
        .send({ email: 'notfound@gmail.com' });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });
});

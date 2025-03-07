import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';

dotenv.config();

describe('/v1/authentications endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('POST /v1/authentications', () => {
    it('should response 201 and new authentication', async () => {
      // Arrange
      const requestPayload = {
        email: 'email@gmail.com',
        password: 'superpassword',
      };
      const server = createServer();
      await UsersTableTestHelper.addUser('user-12345');

      // Action
      const response = await request(server).post('/v1/authentications').send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.accessToken).toBeDefined();
      expect(responseJson.data.refreshToken).toBeDefined();
    });

    it('should response 404 if email not found', async () => {
      // Arrange
      const requestPayload = {
        email: 'notfound@gmail.com',
        password: 'superpassword',
      };
      const server = createServer();
      await UsersTableTestHelper.addUser('user-12345');

      // Action
      const response = await request(server).post('/v1/authentications').send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Email tidak ditemukan');
    });

    it('should response 401 if password is wrong', async () => {
      // Arrange
      const requestPayload = {
        email: 'email@gmail.com',
        password: 'passwordsalah',
      };
      const server = createServer();
      await UsersTableTestHelper.addUser('user-12345');

      // Action
      const response = await request(server).post('/v1/authentications').send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(401);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Kredensial yang Anda berikan salah');
    });
    it('should response 400 if password not string', async () => {
      // Arrange
      const requestPayload = {
        email: 'email@gmail.com',
        password: 123,
      };
      const server = createServer();
      await UsersTableTestHelper.addUser('user-12345');

      // Action
      const response = await request(server).post('/v1/authentications').send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('"password" must be a string');
    });
  });
  describe('PUT /v1/authentications', () => {
    it('should return 200 and new access token', async () => {
      // Arrange
      const requestLoginPayload = {
        email: 'email@gmail.com',
        password: 'superpassword',
      };
      const server = createServer();
      await UsersTableTestHelper.addUser('user-12345');
      const loginResponse = await request(server).post('/v1/authentications').send(requestLoginPayload);
      const { refreshToken } = loginResponse.body.data;

      // Action
      const response = await request(server).put('/v1/authentications').send({ refreshToken });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.accessToken).toBeDefined();
    });
    it('should return 400 payload not contain refresh token', async () => {
      // Arrange
      const server = createServer();

      // Actions
      const response = await request(server).put('/v1/authentications').send({});

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('"refreshToken" is required');
    });
  });
  describe('DELETE /v1/authentications', () => {
    it('should response 200 if refresh token valid', async () => {
      // Arrange
      const server = createServer();
      const refreshToken = 'refresh_token';
      await AuthenticationsTableTestHelper.addToken(refreshToken);

      // Action
      const response = (await request(server).delete('/v1/authentications').send({ refreshToken }));

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
    it('should return 400 payload not contain refresh token', async () => {
      // Arrange
      const server = createServer();

      // Actions
      const response = await request(server).delete('/v1/authentications').send({});

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('"refreshToken" is required');
    });
  });
});

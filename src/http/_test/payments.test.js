import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import RentalsTableTestHelper from '../../../tests/RentalsTableTestHelper';
import DevicesTableTestHelper from '../../../tests/DevicesTableTestHelper';
import PaymentsTableTestHelper from '../../../tests/PaymentTableTestHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';

dotenv.config();

const registerAndLoginAdmin = async (server) => {
  const payload = {
    id: 'admin-12345',
    email: 'adminkeren@gmail.com',
    password: 'superadmin',
  };
  await UsersTableTestHelper.addAdmin(payload);

  const login = await request(server).post('/v1/authentications')
    .send({ email: payload.email, password: payload.password });

  const { accessToken } = login.body.data;
  return accessToken;
};

const registerAndLoginUser = async (server) => {
  const payload = {
    id: 'user-12345',
    username: 'userkeren',
    email: 'userkeren@gmail.com',
    password: 'superuser',
  };
  await UsersTableTestHelper.addUser(payload);

  const login = await request(server).post('/v1/authentications')
    .send({ email: payload.email, password: payload.password });

  const { accessToken } = login.body.data;
  return accessToken;
};

describe('/v1/payments endpoint', () => {
  let server;
  let accessTokenAdmin;
  let accessTokenUser;

  beforeAll(async () => {
    server = createServer();
  });

  beforeEach(async () => {
    accessTokenAdmin = await registerAndLoginAdmin(server);
    accessTokenUser = await registerAndLoginUser(server);
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
    await PaymentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /v1/payments', () => {
    it('should return response code 200 and return all payment data', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ interval: 6 });

      // Action
      const response = await request(server)
        .get('/v1/payments')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.payments).toHaveLength(1);
    });
  });
  describe('GET /v1/payments/:id', () => {
    it('should return response code 200 and get detail payment', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { paymentId } = (await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ interval: 6 })).body.data;

      // Action
      const response = await request(server)
        .get(`/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.payment.id).toBe(paymentId);
    });
    it('should return response 404 if payment not found', async () => {
      // Arrange
      const paymentId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('pembayaran tidak ditemukan');
    });
  });

  describe('PUT /v1/payments/:id', () => {
    it('should return response code 200 and verify payment correctly', async () => {
      // Arrange
      const requestPayload = {
        paymentStatus: 'completed',
        paymentMethod: 'BRI',
        transactionDescription: 'Payment successfully verified',
      };
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { paymentId } = (await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ interval: 6 })).body.data;

      // Action
      const response = await request(server)
        .put(`/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response 404 if payment not found', async () => {
      // Arrange
      const requestPayload = {
        paymentStatus: 'completed',
        paymentMethod: 'BRI',
        transactionDescription: 'Payment successfully verified',
      };
      const paymentId = 'notfound';

      // Action
      const response = await request(server)
        .put(`/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('PATCH /v1/payments/:id', () => {
    it('should return response code 404 and delete payment correctly', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { paymentId } = (await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ interval: 6 })).body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response 404 if payment not found', async () => {
      // Arrange
      const paymentId = 'notfound';

      // Action
      const response = await request(server)
        .patch(`/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('pembayaran tidak ditemukan');
    });
  });
});

import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import RentalsTableTestHelper from '../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../tests/DevicesTableTestHelper.js';
import PaymentsTableTestHelper from '../../../tests/PaymentTableTestHelper.js';
import ReportsTableTestHelper from '../../../tests/ReportTableTestHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';

dotenv.config();

const formatDate = (date) => date.toISOString().split('T')[0];

const generateReportDates = () => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 4);

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 3);

  return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
};

const { startDate, endDate } = generateReportDates();

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

describe('/v1/reports endpoint', () => {
  let server;
  let accessTokenAdmin;
  let accessTokenUser;

  beforeAll(async () => {
    server = createServer();
    accessTokenAdmin = await registerAndLoginAdmin(server);
    accessTokenUser = await registerAndLoginUser(server);
    const requestPayload = {
      paymentStatus: 'completed',
      paymentMethod: 'BRI',
      transactionDescription: 'Payment successfully verified',
    };
    await DevicesTableTestHelper.addDevice({ id: 'device-123' });
    await DevicesTableTestHelper.addDevice({ id: 'device-456' });
    const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
    const payload = {
      interval: 6,
      shippingAddressId: addressId,
      shippingCost: 500000,
    };
    const response1 = (await request(server)
      .post('/v1/rentals')
      .set('Authorization', `Bearer ${accessTokenUser}`)
      .send(payload));

    const response2 = (await request(server)
      .post('/v1/rentals')
      .set('Authorization', `Bearer ${accessTokenUser}`)
      .send(payload));

    const paymentId1 = response1.body.data.paymentId;
    const paymentId2 = response2.body.data.paymentId;

    await request(server)
      .put(`/v1/payments/${paymentId1}`)
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .send(requestPayload);

    await request(server)
      .put(`/v1/payments/${paymentId2}`)
      .set('Authorization', `Bearer ${accessTokenAdmin}`)
      .send(requestPayload);
  });

  afterEach(async () => {
    await ReportsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
    await PaymentsTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('POST /v1/reports', () => {
    it('should return response code 201 and add new report', async () => {
      // Arrange and Action
      const response = await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate,
          endDate,
        });
      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.reportId).toBeDefined();
    });
    it('should return response code 400 if startDate morethan endDate', async () => {
      // Arrange and Action
      const response = await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate: '2025-03-13',
          endDate: '2025-03-11',
        });
      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('GET /v1/reports', () => {
    it('should return code 200 and get all reports', async () => {
      // Arrange
      await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate,
          endDate,
        });

      await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate,
          endDate,
        });
      // Action
      const response = await request(server)
        .get('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.reports).toHaveLength(2);
    });
  });

  describe('GET /v1/reports/:id', () => {
    it('should return response code 200 and get detail report', async () => {
      // Arrange
      const reports = await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate,
          endDate,
        });
      const { reportId } = reports.body.data;

      // Action
      const response = await request(server)
        .get(`/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      const report = await ReportsTableTestHelper.findReportById(reportId);
      expect(response.statusCode).toBe(200);
      expect(responseJson.data.report.id).toBe(reportId);
      expect(responseJson.data.report.total_transaction).toBe(report.total_transaction);
      expect(responseJson.data.report.total_amount).toBe(report.total_amount);
      expect(responseJson.data.report.payments).toHaveLength(2);
    });
    it('should return response code 404 if report not found', async () => {
      // Arrange
      const reportId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.status).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('GET /v1/reports/:id/download', () => {
    it('should return return response code 200 and have Content-Type application/pdf', async () => {
      // Arrange
      const reports = await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate,
          endDate,
        });
      const { reportId } = reports.body.data;

      // Action
      const response = await request(server)
        .get(`/v1/reports/${reportId}/download`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });
    it('should return response code 404 if report not found', async () => {
      // Arrange
      const reportId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/reports/${reportId}/download`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('DELETE /v1/reports/:id', () => {
    it('should return response code 200 and delete report by id', async () => {
      // Arrange
      const reports = await request(server)
        .post('/v1/reports')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          startDate,
          endDate,
        });
      const { reportId } = reports.body.data;

      // Action
      const response = await request(server)
        .delete(`/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response code 404 if report not found', async () => {
      // Arrange
      const reportId = 'notfound';

      // Action
      const response = await request(server)
        .delete(`/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });
});

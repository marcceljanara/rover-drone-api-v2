import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import DevicesTableTestHelper from '../../../tests/DevicesTableTestHelper.js';
import SensorTableTestHelper from '../../../tests/SensorTableTestHelper.js';
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

describe('/v1/devices endpoint', () => {
  let server;
  let accessTokenAdmin;

  beforeAll(async () => {
    server = createServer();
  });

  beforeEach(async () => {
    accessTokenAdmin = await registerAndLoginAdmin(server);
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
    await SensorTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /v1/devices', () => {
    it('should respond with 201 and add new device', async () => {
      // Arrange and Actions
      const response = await request(server)
        .post('/v1/devices')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.deviceId).toBeDefined();
    });
  });

  describe('DELETE /v1/devices/:id', () => {
    it('should respond with 200 and delete device by id', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Action
      const response = await request(server)
        .put(`/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.status).toBe(200);
      expect(responseJson.status).toBe('success');
    });

    it('should response with 404 if device not found', async () => {
      // Arrange and Action
      const response = await request(server)
        .put('/v1/devices/notfound')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('PUT /v1/devices/:id/status', () => {
    it('should respond with 200 and put status device by id', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const requestPayload = {
        status: 'active',
      };

      // Action
      const response = await request(server)
        .put(`/v1/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.status).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.message).toBe('status device berhasil diubah');
    });

    it('should response with 404 if device not found', async () => {
      // Arrange and Action
      const response = await request(server)
        .put('/v1/devices/notfound/status')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ status: 'active' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('PUT /v1/devices/:id/mqttsensor', () => {
    it('should respond with 200 and put sensor topic device by id', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Action
      const response = await request(server)
        .put(`/v1/devices/${deviceId}/mqttsensor`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.status).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.message).toBe('topic MQTT sensor berhasil diubah');
    });

    it('should response with 404 if device not found', async () => {
      // Arrange and Action
      const response = await request(server)
        .put('/v1/devices/notfound/mqttsensor')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('PUT /v1/devices/:id/mqttcontrol', () => {
    it('should respond with 200 and put control topic device by id', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Action
      const response = await request(server)
        .put(`/v1/devices/${deviceId}/mqttcontrol`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.status).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.message).toBe('topic MQTT control berhasil diubah');
    });

    it('should response with 404 if device not found', async () => {
      // Arrange and Action
      const response = await request(server)
        .put('/v1/devices/notfound/mqttcontrol')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('GET /v1/devices', () => {
    it('should response with 200 and get all device by admin', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });

      // Action
      const response = await request(server)
        .get('/v1/devices')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.devices).toHaveLength(2);
    });
  });

  describe('GET /v1/devices/:id', () => {
    it('should response with 200 and get device detail by admin', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });

      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.device.id).toBe(deviceId);
    });
    it('should response with 404 if device not found', async () => {
      // Arrange and Action
      const response = await request(server)
        .get('/v1/devices/notfound')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('PUT /device/:id/control', () => {
    it('should response with 200 and put device status to active', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Actions
      const response = await request(server)
        .put(`/v1/devices/${deviceId}/control`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ action: 'on', command: 'power' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should response with 404 if device not found', async () => {
      // Arrange and Action
      const response = await request(server)
        .get('/v1/devices/notfound/control')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ action: 'on', command: 'power' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
    it('should response with 400 and need input payload correctly', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      // Action
      const response = await request(server)
        .put(`/v1/devices/${deviceId}/control`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ action: 'active', command: 'power' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('GET /v1/devices/:id/sensors/intervals', () => {
    it('should response with 200 and get sensor data based intervals', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/intervals?interval=12h`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.sensors).toHaveLength(2);
    });
    it('should response with 200 and get sensor data based intervals default', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/intervals`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.sensors).toHaveLength(2);
    });
    it('should response with 400 and need input query correctly', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/intervals?interval=9h`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('GET /v1/devices/:id/sensors/limits', () => {
    it('should response with 200 and get sensor data based limit', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-111', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-222', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-333', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-444', deviceId });

      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/limits?limit=5`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.sensors).toHaveLength(5);
    });
    it('should response with 200 and get sensor data based limit', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-111', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-222', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-333', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-444', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/limits`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.sensors).toHaveLength(6);
    });
    it('should response with 400 and need input query correctly', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/limits?limit=7`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('GET /v1/devices/:id/sensors/downloads', () => {
    it('should response with 200 and get sensor data download csv based downloads', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/downloads?interval=12h`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();
    });
    it('should response with 200 and get sensor data download csv based downloads default', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/downloads`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeDefined();
    });
    it('should response with 400 and need input query correctly', async () => {
      // Arrange
      const deviceId = await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-000', deviceId });
      // Action
      const response = await request(server)
        .get(`/v1/devices/${deviceId}/sensors/downloads?interval=9h`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });
});

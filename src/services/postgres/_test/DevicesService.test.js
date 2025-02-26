import pkg from 'pg';
import dotenv from 'dotenv';
import DevicesService from '../DevicesService.js';
import RentalsService from '../RentalsService.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import SensorTableTestHelper from '../../../../tests/SensorTableTestHelper.js';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper.js';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper.js';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool();

describe('DevicesService', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    // Membersihkan tabel `devices` setelah setiap test
    await DevicesTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await SensorTableTestHelper.cleanTable();
  });

  describe('addDevice function', () => {
    it('should add device and return its ID', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Action
      const deviceId = await devicesService.addDevice();

      // Assert
      const query = {
        text: 'SELECT * FROM devices WHERE id = $1',
        values: [deviceId],
      };
      const result = await pool.query(query);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(deviceId);
    });
  });

  describe('deleteDevice function', () => {
    it('should delete device correctly', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const deletedDevice = await devicesService.deleteDevice(deviceId);

      // Assert
      expect(deletedDevice.id).toBe(deviceId);
      const query = {
        text: 'SELECT * FROM devices WHERE id = $1 AND is_deleted = FALSE',
        values: [deviceId],
      };
      const result = await pool.query(query);
      expect(result.rows).toHaveLength(0);
    });

    it('should throw NotFoundError when device not found', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Action and Assert
      await expect(devicesService.deleteDevice('nonexistent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('changeStatusDevice function', () => {
    it('should change device status correctly', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const updatedDevice = await devicesService.changeStatusDevice(deviceId, 'active');

      // Assert
      expect(updatedDevice.id).toBe(deviceId);
      const query = {
        text: 'SELECT status FROM devices WHERE id = $1',
        values: [deviceId],
      };
      const result = await pool.query(query);
      expect(result.rows[0].status).toBe('active');
    });

    it('should throw NotFoundError when device not found', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Action and Assert
      await expect(devicesService.changeStatusDevice('nonexistent-id', 'active')).rejects.toThrow(NotFoundError);
    });
  });

  describe('ChangeMqttSensor function', () => {
    it('should change MQTT topic sensor correctly', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const updatedMqttSensor = await devicesService.changeMqttSensor(deviceId);

      // Assert
      expect(updatedMqttSensor.id).toBe(deviceId);
      const query = {
        text: 'SELECT sensor_topic FROM devices WHERE id = $1',
        values: [deviceId],
      };
      const result = await pool.query(query);
      expect(result.rows[0].sensor_topic).toBeDefined();
    });

    it('should throw NotFoundError when device not found', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = 'device-notfound';

      // Action and Assert
      await expect(devicesService.changeMqttSensor(deviceId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('ChangeMqttControl function', () => {
    it('should change MQTT topic control correctly', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const updatedMqttSensor = await devicesService.changeMqttControl(deviceId);

      // Assert
      expect(updatedMqttSensor.id).toBe(deviceId);
      const query = {
        text: 'SELECT control_topic FROM devices WHERE id = $1',
        values: [deviceId],
      };
      const result = await pool.query(query);
      expect(result.rows[0].control_topic).toBeDefined();
    });

    it('should throw NotFoundError when device not found', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = 'device-notfound';

      // Action and Assert
      await expect(devicesService.changeMqttControl(deviceId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDevice function', () => {
    it('should return device details correctly by admin', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const device = await devicesService.getDevice('admin-123', 'admin', deviceId);

      // Assert
      expect(device.id).toBe(deviceId);
    });
    it('should return device details correctly by user authenticated', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-1234567', username: 'otng123', email: 'totonggg@gmail.com' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');

      // Action
      const device = await devicesService.getDevice(user1, 'user', deviceId);

      // Assert
      expect(device.id).toBe(deviceId);
    });

    it('should throw NotFoundError when device not found by admin', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Action and Assert
      await expect(devicesService.getDevice('admin-123', 'admin', 'nonexistent-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when device not found by user', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Action and Assert
      await expect(devicesService.getDevice('user-123', 'user', 'nonexistent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllDevice function', () => {
    it('should return all devices by admin', async () => {
      // Arrange
      const devicesService = new DevicesService();
      await devicesService.addDevice();
      await devicesService.addDevice();

      // Action
      const devices = await devicesService.getAllDevice('admin-123', 'admin');

      // Assert
      expect(devices).toHaveLength(2);
    });
    it('should return all devices by user autheticated', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');

      // Action
      const devices = await devicesService.getAllDevice(user1, 'user');

      // Assert
      expect(devices).toHaveLength(1);
    });
  });

  describe('deviceControl function', () => {
    it('should control device on correctly by admin', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const device = await devicesService.deviceControl('admin-123', 'admin', { id: deviceId, action: 'on' });

      // Assert
      expect(device.status).toBe('active');
      expect(device.id).toBe(deviceId);
    });
    it('should control device off correctly by admin', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action
      const device = await devicesService.deviceControl('admin-123', 'admin', { id: deviceId, action: 'off' });

      // Assert
      expect(device.status).toBe('inactive');
      expect(device.id).toBe(deviceId);
    });
    it('should control device on correctly by user', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-111', username: 'user111', email: 'user111@gmail.com' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');

      // Action
      const device = await devicesService.deviceControl(user1, 'user', { id: deviceId, action: 'on' });

      // Assert
      expect(device.status).toBe('active');
      expect(device.id).toBe(deviceId);
    });
    it('should control device off correctly by user', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-000', username: 'user000', email: 'user000@gmail.com' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');

      // Action
      const device = await devicesService.deviceControl(user1, 'user', { id: deviceId, action: 'off' });

      // Assert
      expect(device.status).toBe('inactive');
      expect(device.id).toBe(deviceId);
    });

    it('should throw not found error when device not exist by admin', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = 'device-notexist';

      // Action and Asser
      await expect(devicesService.deviceControl('admin-123', 'admin', { id: deviceId, action: 'on' })).rejects.toThrow(NotFoundError);
    });
    it('should throw not found error when device not exist by user authenticated', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = 'device-notexist';

      // Action and Asser
      await expect(devicesService.deviceControl('user-123', 'user', { id: deviceId, action: 'on' })).rejects.toThrow(NotFoundError);
    });
  });
  describe('getSensorData function', () => {
    it('return all sensor data by admin based timestamp', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });

      // Actions
      const sensors = await devicesService.getSensorData('admin-123', 'admin', deviceId, '12h');

      // Assert
      expect(sensors).toHaveLength(1);
    });
    it('return all sensor data by user based timestamp', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });

      // Actions
      const sensors = await devicesService.getSensorData(user1, 'user', deviceId, '12h');

      // Assert
      expect(sensors).toHaveLength(1);
    });
  });
  describe('getSensorDataLimit function', () => {
    it('return all sensor data by admin based limit', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-111', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-222', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-333', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-444', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-555', deviceId });

      // Actions
      const sensors = await devicesService.getSensorDataLimit('admin-123', 'admin', deviceId, 5);

      // Assert
      expect(sensors).toHaveLength(5);
    });
    it('return all sensor data by user based timestamp', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-111', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-222', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-333', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-444', deviceId });
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-555', deviceId });

      // Actions
      const sensors = await devicesService.getSensorDataLimit(user1, 'user', deviceId, 5);

      // Assert
      expect(sensors).toHaveLength(5);
    });
  });
  describe('getSensorDataDownload function', () => {
    it('return all sensor data download by admin based timestamp', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });

      // Actions
      const sensors = await devicesService.getSensorDataDownload('admin-123', 'admin', deviceId, '12h');

      // Assert
      expect(sensors).toBeDefined();
    });
    it('return all sensor data download by user based timestamp', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const { id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });

      // Actions
      const sensors = await devicesService.getSensorDataDownload(user1, 'user', deviceId, '12h');

      // Assert
      expect(sensors).toBeDefined();
    });
  });
});

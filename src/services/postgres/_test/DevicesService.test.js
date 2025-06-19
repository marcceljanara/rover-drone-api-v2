import dotenv from 'dotenv';
import DevicesService from '../DevicesService.js';
import RentalsService from '../RentalsService.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import SensorTableTestHelper from '../../../../tests/SensorTableTestHelper.js';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper.js';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper.js';
import pool from '../../../config/postgres/pool.js';
import InvariantError from '../../../exceptions/InvariantError.js';

dotenv.config();

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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
      await rentalsService.changeStatusRental(id, 'active');

      // Action
      const devices = await devicesService.getAllDevice(user1, 'user');

      // Assert
      expect(devices).toHaveLength(1);
    });
  });

  describe('getAvailableDevices function', () => {
    it('should return available devices correctly', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Menambahkan perangkat yang tersedia (tidak memiliki rental_id dan tidak dihapus)
      await devicesService.addDevice();
      await devicesService.addDevice();

      // Menambahkan perangkat yang sedang disewa (memiliki rental_id)
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await devicesService.addDevice();
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
      await rentalsService.changeStatusRental(id, 'active');

      // // Mengupdate perangkat sewa dengan rental_id
      // const queryUpdate = {
      //   text: 'UPDATE devices SET rental_id = $1 WHERE id = $2',
      //   values: [rentalId, rentedDevice],
      // };
      // await pool.query(queryUpdate);

      // Action
      const availableDevices = await devicesService.getAvailableDevices();

      // Assert
      expect(availableDevices).toHaveLength(2);
    });

    it('should return empty array if no available devices', async () => {
      // Arrange
      const devicesService = new DevicesService();

      // Action
      const availableDevices = await devicesService.getAvailableDevices();

      // Assert
      expect(availableDevices).toHaveLength(0);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });

      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });

      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });

      // Actions
      const sensors = await devicesService.getSensorData(user1, 'user', deviceId, '12h');

      // Assert
      expect(sensors).toHaveLength(1);
    });
    it('should reject rental Not Found Error', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action and Assert
      await expect(devicesService.getSensorData('user1', 'user', deviceId, '12h')).rejects.toThrow(NotFoundError);
    });
  });
  describe('getSensorDataLimit function', () => {
    it('return all sensor data by admin based limit', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
    it('should reject rental Not Found Error', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const deviceId = await devicesService.addDevice();

      // Action and Assert
      await expect(devicesService.getSensorDataLimit('user1', 'user', deviceId, 5)).rejects.toThrow(NotFoundError);
    });
  });
  describe('getSensorDataDownload function', () => {
    it('return all sensor data download by admin based timestamp', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
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
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
      await rentalsService.changeStatusRental(id, 'active');
      await SensorTableTestHelper.addDataSensor({ sensorId: 'sensor-123', deviceId });

      // Actions
      const sensors = await devicesService.getSensorDataDownload(user1, 'user', deviceId, '12h');

      // Assert
      expect(sensors).toBeDefined();
    });
    it('should throw Data Not Found error', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const rentalsService = new RentalsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const deviceId = await devicesService.addDevice();
      const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
      const payload = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user1, 6, 'user', addressId, payload);
      await rentalsService.changeStatusRental(id, 'active');

      // Actions and Assert
      await expect(devicesService.getSensorDataDownload(user1, 'user', deviceId, '12h')).rejects.toThrow(NotFoundError);
    });

    it('should throw Rental Not Found error', async () => {
      // Arrange
      const devicesService = new DevicesService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });

      // Actions and Assert
      await expect(devicesService.getSensorDataDownload(user1, 'user', 'notfound', '12h')).rejects.toThrow(NotFoundError);
    });
  });

  describe('_checkDailyUsageLimit', () => {
    let instance;
    let mockQuery;

    beforeEach(() => {
      mockQuery = jest.fn();
      instance = new DevicesService();
      instance._pool = { query: mockQuery };
      jest.useFakeTimers('modern').setSystemTime(new Date('2025-06-04T10:00:00Z').getTime());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should throw InvariantError if total usage >= 8 hours', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { start_time: '2025-06-04T01:00:00Z', end_time: '2025-06-04T05:00:00Z' }, // 4 jam
          { start_time: '2025-06-04T06:00:00Z', end_time: '2025-06-04T10:00:00Z' }, // 4 jam
        ],
      });

      await expect(instance._checkDailyUsageLimit('device-123'))
        .rejects.toThrow(new InvariantError('Batas penggunaan perangkat 8 jam per hari telah tercapai'));
    });

    test('should throw InvariantError if total usage >= 4 hours and session 2 starts too soon', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { start_time: '2025-06-04T01:00:00Z', end_time: '2025-06-04T05:00:00Z' }, // 4 jam
          { start_time: '2025-06-04T05:30:00Z', end_time: null }, // hanya jeda 30 menit
        ],
      });

      await expect(instance._checkDailyUsageLimit('device-123'))
        .rejects.toThrow(InvariantError);
    });

    test('should NOT throw error if total usage < 4 hours', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { start_time: '2025-06-04T07:00:00Z', end_time: '2025-06-04T09:30:00Z' }, // 2.5 jam
        ],
      });

      await expect(instance._checkDailyUsageLimit('device-123')).resolves.not.toThrow();
    });

    test('should NOT throw error if total usage >= 4 hours and session 2 starts after 1 hour pause', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { start_time: '2025-06-04T01:00:00Z', end_time: '2025-06-04T05:00:00Z' }, // 4 jam
          { start_time: '2025-06-04T06:30:00Z', end_time: null }, // jeda 1.5 jam, boleh
        ],
      });

      await expect(instance._checkDailyUsageLimit('device-123')).resolves.not.toThrow();
    });
  });
  describe('getDevicesOverFirstSession', () => {
    let instance;
    let mockQuery;

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-18T12:00:00+07:00').getTime());

      mockQuery = jest.fn();
      instance = new DevicesService();
      instance._pool = { query: mockQuery };
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return device IDs that have used >= 4 hours in total across first session', async () => {
      const start1 = new Date('2025-06-18T00:00:00+07:00');
      const end1 = new Date('2025-06-18T02:30:00+07:00'); // 2.5 jam

      const start2 = new Date('2025-06-18T02:30:00+07:00');
      const end2 = new Date('2025-06-18T04:30:00+07:00'); // 2 jam (total 4.5 jam)

      mockQuery.mockResolvedValue({
        rows: [
          { device_id: 'device-1', start_time: start1.toISOString(), end_time: end1.toISOString() },
          { device_id: 'device-1', start_time: start2.toISOString(), end_time: end2.toISOString() },
        ],
      });

      const result = await instance.getDevicesOverFirstSession();

      expect(result).toEqual(['device-1']);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test('should return empty array if total session < 4 hours', async () => {
      const start = new Date('2025-06-18T00:00:00+07:00');
      const end = new Date('2025-06-18T02:00:00+07:00'); // hanya 2 jam

      mockQuery.mockResolvedValue({
        rows: [
          { device_id: 'device-2', start_time: start.toISOString(), end_time: end.toISOString() },
        ],
      });

      const result = await instance.getDevicesOverFirstSession();
      expect(result).toEqual([]);
    });

    test('should ignore devices that have already been marked as handled', async () => {
      mockQuery.mockResolvedValue({ rows: [] }); // tidak ada karena sudah first_session_flag = TRUE

      const result = await instance.getDevicesOverFirstSession();
      expect(result).toEqual([]);
    });
  });

  describe('getOverusedActiveDevices', () => {
    let instance;
    let mockQuery;

    beforeEach(() => {
      mockQuery = jest.fn();
      instance = new DevicesService();
      instance._pool = { query: mockQuery };

      // Set waktu sistem ke 2025-06-04 pukul 10:00 UTC
      jest.useFakeTimers('modern').setSystemTime(new Date('2025-06-04T10:00:00Z').getTime());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return device IDs with usage >= 8 hours and active status', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 'device-1' }, { id: 'device-2' }],
      });

      const result = await instance.getOverusedActiveDevices();

      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [queryText, params] = mockQuery.mock.calls[0];

      expect(queryText).toContain('SELECT d.id');
      expect(params[0]).toBeInstanceOf(Date); // Memastikan parameter pertama adalah Date

      expect(result).toEqual(['device-1', 'device-2']);
    });
  });
  describe('getDailyUsedHours', () => {
    let instance;
    let mockQuery;

    beforeEach(() => {
      mockQuery = jest.fn();
      instance = new DevicesService();
      instance._pool = { query: mockQuery };

      // Set tanggal ke 2025-06-04T10:00:00Z
      jest.useFakeTimers('modern').setSystemTime(new Date('2025-06-04T10:00:00Z').getTime());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return parsed and rounded used hours', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ used_hours: '5.678912' }],
      });

      const result = await instance.getDailyUsedHours('device-123');

      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [queryText, params] = mockQuery.mock.calls[0];
      expect(queryText.replace(/\s+/g, ' ')).toContain('SUM( EXTRACT(EPOCH FROM');

      expect(params[0]).toBe('device-123');
      expect(params.length).toBe(1);

      expect(result).toBe(5.679); // dibulatkan ke 3 angka desimal
    });

    test('should return 0 if used_hours is null', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ used_hours: null }],
      });

      const result = await instance.getDailyUsedHours('device-456');

      expect(result).toBe(0);
    });

    test('should return 0 if no rows returned', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
      });

      const result = await instance.getDailyUsedHours('device-789');

      expect(result).toBe(0);
    });
  });
});

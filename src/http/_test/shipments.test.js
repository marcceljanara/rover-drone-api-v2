import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import RentalsTableTestHelper from '../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../tests/DevicesTableTestHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';
import calculateShippingCost from '../../utils/calculateShippingCost.js';

dotenv.config();

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

jest.mock('../../services/storage/storageService.js', () => jest.fn().mockImplementation(() => ({
  uploadObject: jest.fn().mockResolvedValue({
    key: 'delivery-proofs/fake-proof.jpg',
    url: 'https://fake-r2-url.com/delivery-proofs/fake-proof.jpg',
  }),
  getSignedUrl: jest.fn().mockResolvedValue({
    url: 'https://fake-r2-url.com/delivery-proofs/fake-proof.jpg',
  }), // kalau dipakai di code lain
  getUploadUrl: jest.fn(), // kalau dipakai di code lain
})));

const registerAndLoginAdmin = async (server) => {
  const payload = {
    id: 'admin-12345',
    email: 'adminkeren@gmail.com',
    password: 'superadmin',
  };
  await UsersTableTestHelper.addAdmin(payload);

  const login = await request(server).post('/v1/authentications')
    .send({ email: payload.email, password: payload.password });

  const adminCookie = login.headers['set-cookie'];
  return adminCookie;
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

  const userCookie = login.headers['set-cookie'];
  return userCookie;
};

jest.mock('../../utils/calculateShippingCost.js', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('/v1/shipments endpoints', () => {
  let server;
  let adminCookie;
  let userCookie;

  beforeAll(async () => {
    server = createServer();
  });

  beforeEach(async () => {
    adminCookie = await registerAndLoginAdmin(server);
    userCookie = await registerAndLoginUser(server);
    calculateShippingCost.mockResolvedValue({
      shippingName: 'JNE',
      serviceName: 'JTR23',
      shippingCost: 500000,
      etd: '4',
    });
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    jest.clearAllMocks(); // reset semua mock state agar test tetap bersih
  });

  describe('(User) GET /v1/shipments/:id', () => {
    it('should return 200 and shipments data for valid rentalId', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      // Action
      const response = await request(server)
        .get(`/v1/shipments/${rentalId}`)
        .set('Cookie', userCookie);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.data.shipment).toHaveProperty('rental_id', rentalId);
    });
    it('should return 404 for non-existent rentalId', async () => {
      // Arrange
      const nonExistentRentalId = 'rental-99999';
      // Action
      const response = await request(server)
        .get(`/v1/shipments/${nonExistentRentalId}`)
        .set('Cookie', userCookie);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('(User) GET /v1/shipments/:id/delivery-proof', () => {
    const setupRentalAndShipment = async (deviceId, addressId) => {
      await DevicesTableTestHelper.addDevice({ id: deviceId });
      const realAddressId = await UsersTableTestHelper.addAddress('user-12345', { id: addressId });

      const rentalPayload = {
        interval: 6,
        shippingAddressId: realAddressId,
        subdistrictName: 'Rejo Binangun',
      };

      const rentalResponse = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(rentalPayload);

      const rentalId = rentalResponse.body.data.id;

      const verifyResponse = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      return verifyResponse.body.data.shipmentId;
    };

    it('should get delivery proof and return 200 with photoUrl', async () => {
      const shipmentId = await setupRentalAndShipment('device-456', 'address-456');

      await request(server)
        .post(`/v1/shipments/${shipmentId}/delivery-proof`)
        .set('Cookie', adminCookie).attach('photo', '__tests__/assets/delivery-proof.jpg');

      const response = await request(server)
        .get(`/v1/shipments/${shipmentId}/delivery-proof`)
        .set('Cookie', userCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.url).toBeDefined();
    });
  });
  describe('GET /v1/shipments', () => {
    it('should return 200 and all shipments for admin', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      // Action
      const response = await request(server)
        .get('/v1/shipments')
        .set('Cookie', adminCookie);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.data.shipments).toBeInstanceOf(Array);
      expect(response.body.data.shipments.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      // Action
      const response = await request(server)
        .get('/v1/shipments')
        .set('Cookie', userCookie);

      // Assert
      expect(response.statusCode).toBe(403);
    });
  });
  describe('PUT /v1/shipments/:id/info', () => {
    it('should update shipping info and return 200', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .put(`/v1/shipments/${shipmentId}/info`)
        .set('Cookie', adminCookie).send({
          courierName: 'JNE',
          trackingNumber: 'JNE123456789',
          courierService: 'JTR23',
          notes: 'Handle with care',
        });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent shipment', async () => {
      // Arrange
      const nonExistentRentalId = 'rental-99999';

      // Action
      const response = await request(server)
        .put(`/v1/shipments/${nonExistentRentalId}/info`)
        .set('Cookie', adminCookie).send({
          courierName: 'JNE',
          trackingNumber: 'JNE123456789',
          courierService: 'JTR23',
          notes: 'Handle with care',
        });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
  describe('PATCH /v1/shipments/:id/status', () => {
    it('should update shipping status and return 200', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${shipmentId}/status`)
        .set('Cookie', adminCookie).send({ status: 'shipped' });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent shipment', async () => {
      // Arrange
      const nonExistentShipmentId = 'shipment-99999';

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${nonExistentShipmentId}/status`)
        .set('Cookie', adminCookie).send({ status: 'shipped' });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
  describe('PATCH /v1/shipments/:id/actual-shipping', () => {
    it('should confirm actual shipping date and return 200', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${shipmentId}/actual-shipping`)
        .set('Cookie', adminCookie).send({ date: '2023-10-01T10:00:00Z' });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent shipment', async () => {
      // Arrange
      const nonExistentShipmentId = 'shipment-99999';

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${nonExistentShipmentId}/actual-shipping`)
        .set('Cookie', adminCookie).send({ date: '2023-10-01T10:00:00Z' });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
  describe('PATCH /v1/shipments/:id/actual-delivery', () => {
    it('should confirm actual delivery date and return 200', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${shipmentId}/actual-delivery`)
        .set('Cookie', adminCookie).send({ date: '2023-10-02T10:00:00Z' });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent shipment', async () => {
      // Arrange
      const nonExistentShipmentId = 'shipment-99999';

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${nonExistentShipmentId}/actual-delivery`)
        .set('Cookie', adminCookie).send({ date: '2023-10-02T10:00:00Z' });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
  describe('POST /v1/shipments/:id/delivery-proof', () => {
    const setupRentalAndShipment = async (deviceId, addressId) => {
      await DevicesTableTestHelper.addDevice({ id: deviceId });
      const realAddressId = await UsersTableTestHelper.addAddress('user-12345', { id: addressId });

      const rentalPayload = {
        interval: 6,
        shippingAddressId: realAddressId,
        subdistrictName: 'Rejo Binangun',
      };

      const rentalResponse = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(rentalPayload);

      const rentalId = rentalResponse.body.data.id;

      const verifyResponse = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      return verifyResponse.body.data.shipmentId;
    };

    it('should upload delivery proof and return 201 with photoUrl', async () => {
      const shipmentId = await setupRentalAndShipment('device-456', 'address-456');

      const response = await request(server)
        .post(`/v1/shipments/${shipmentId}/delivery-proof`)
        .set('Cookie', adminCookie).attach('photo', '__tests__/assets/delivery-proof.jpg');

      expect(response.statusCode).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.photoUrl).toBeDefined();
    });
  });
  describe('GET /v1/shipments/:id/delivery-proof', () => {
    const setupRentalAndShipment = async (deviceId, addressId) => {
      await DevicesTableTestHelper.addDevice({ id: deviceId });
      const realAddressId = await UsersTableTestHelper.addAddress('user-12345', { id: addressId });

      const rentalPayload = {
        interval: 6,
        shippingAddressId: realAddressId,
        subdistrictName: 'Rejo Binangun',
      };

      const rentalResponse = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(rentalPayload);

      const rentalId = rentalResponse.body.data.id;

      const verifyResponse = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      return verifyResponse.body.data.shipmentId;
    };

    it('should get delivery proof and return 200 with photoUrl', async () => {
      const shipmentId = await setupRentalAndShipment('device-456', 'address-456');

      await request(server)
        .post(`/v1/shipments/${shipmentId}/delivery-proof`)
        .set('Cookie', adminCookie).attach('photo', '__tests__/assets/delivery-proof.jpg');

      const response = await request(server)
        .get(`/v1/shipments/${shipmentId}/delivery-proof`)
        .set('Cookie', adminCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.url).toBeDefined();
    });
  });
  describe('(Admin) GET /v1/shipments/:id', () => {
    it('should return 200 and shipments data for valid rentalId', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Cookie', userCookie)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Cookie', adminCookie).send({ rentalStatus: 'active' });

      // Action
      const response = await request(server)
        .get(`/v1/shipments/${rentalId}`)
        .set('Cookie', adminCookie);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.data.shipment).toHaveProperty('rental_id', rentalId);
    });
    it('should return 404 for non-existent rentalId', async () => {
      // Arrange
      const nonExistentRentalId = 'rental-99999';
      // Action
      const response = await request(server)
        .get(`/v1/shipments/${nonExistentRentalId}`)
        .set('Cookie', adminCookie);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
});

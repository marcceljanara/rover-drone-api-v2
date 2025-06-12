import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import RentalsTableTestHelper from '../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../tests/DevicesTableTestHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';
import calculateShippingCost from '../../utils/calculateShippingCost.js';

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

jest.mock('../../utils/calculateShippingCost.js', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('/v1/shipments endpoints', () => {
  let server;
  let accessTokenAdmin;
  let accessTokenUser;

  beforeAll(async () => {
    server = createServer();
  });

  beforeEach(async () => {
    accessTokenAdmin = await registerAndLoginAdmin(server);
    accessTokenUser = await registerAndLoginUser(server);
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

  describe('GET /v1/shipments/:id', () => {
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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      // Action
      const response = await request(server)
        .get(`/v1/shipments/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

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
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      // Action
      const response = await request(server)
        .get('/v1/shipments')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.data.shipments).toBeInstanceOf(Array);
      expect(response.body.data.shipments.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      // Action
      const response = await request(server)
        .get('/v1/shipments')
        .set('Authorization', `Bearer ${accessTokenUser}`);

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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .put(`/v1/shipments/${shipmentId}/info`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
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
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${shipmentId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ status: 'shipped' });

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
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ status: 'shipped' });

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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${shipmentId}/actual-shipping`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ date: '2023-10-01T10:00:00Z' });

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
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ date: '2023-10-01T10:00:00Z' });

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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      const responseVerify = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      const { shipmentId } = responseVerify.body.data;

      // Action
      const response = await request(server)
        .patch(`/v1/shipments/${shipmentId}/actual-delivery`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ date: '2023-10-02T10:00:00Z' });

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
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ date: '2023-10-02T10:00:00Z' });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
  describe('POST /v1/shipments/:id/delivery-proof', () => {
    let uploadedFilePath;

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
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(rentalPayload);

      const rentalId = rentalResponse.body.data.id;

      const verifyResponse = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      return verifyResponse.body.data.shipmentId;
    };

    it('should upload delivery proof and return 201 with photoUrl', async () => {
      const shipmentId = await setupRentalAndShipment('device-456', 'address-456');

      const response = await request(server)
        .post(`/v1/shipments/${shipmentId}/delivery-proof`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .attach('photo', '__tests__/assets/delivery-proof.jpg');

      expect(response.statusCode).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.photoUrl).toMatch(/^\/uploads\/delivery-proofs\/.+\.jpg$/);

      // Simpan path absolut untuk cleanup
      uploadedFilePath = path.resolve(
        __dirname,
        '..',
        'uploads',
        'delivery-proofs',
        path.basename(response.body.data.photoUrl),
      );
    });

    afterAll(() => {
      if (uploadedFilePath) {
        try {
          if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
            console.log('✅ File berhasil dihapus:', uploadedFilePath);
          } else {
            console.warn('⚠️ File tidak ditemukan untuk dihapus:', uploadedFilePath);
          }
        } catch (err) {
          console.error('❌ Gagal menghapus file:', err);
        }
      }
    });
  });
});

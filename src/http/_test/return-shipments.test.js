import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';
import RentalsTableTestHelper from '../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../tests/DevicesTableTestHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';
import calculateShippingCost from '../../utils/calculateShippingCost.js';
import ReturnShippingTableTestHelper from '../../../tests/ReturnShippingTableTestHelper.js';

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

describe('v1/returns endpoints', () => {
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
    await ReturnShippingTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    jest.clearAllMocks(); // reset semua mock state agar test tetap bersih
  });

  describe('(Admin) GET /v1/returns/:id', () => {
    it('should return 200 and return data for valid rentalId', async () => {
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

      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .get(`/v1/returns/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.return).toBeDefined();
    });
    it('should return 404 if return data not found for rentalId', async () => {
      // Arrange
      const rentalId = 'nonexistent-rental-id';

      // Action
      const response = await request(server)
        .get(`/v1/returns/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('PATCH /v1/returns/:id/status', () => {
    it('should update return status successfully', async () => {
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

      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .patch(`/v1/returns/${returnId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ status: 'returning' });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });
    it('should return 404 if return data not found for rentalId', async () => {
      // Arrange
      const returnId = 'nonexistent-return-id';
      // Action
      const response = await request(server)
        .patch(`/v1/returns/${returnId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ status: 'returning' });
      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('PATCH /v1/returns/:id/note', () => {
    it('should add return note successfully', async () => {
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

      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .patch(`/v1/returns/${returnId}/note`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ note: 'Catatan penting untuk return ini' });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });
    it('should return 404 if return data not found for rentalId', async () => {
      // Arrange
      const returnId = 'nonexistent-return-id';
      // Action
      const response = await request(server)
        .patch(`/v1/returns/${returnId}/note`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ note: 'Catatan penting untuk return ini' });
      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('PUT /v1/returns/:id', () => {
    it('should update return shipping info successfully', async () => {
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

      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .put(`/v1/returns/${returnId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          courierName: 'JNE',
          courierService: 'JTR23',
          trackingNumber: 'JNE1234567890',
        });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });
    it('should return 404 if return data not found for rentalId', async () => {
      // Arrange
      const returnId = 'nonexistent-return-id';
      // Action
      const response = await request(server)
        .put(`/v1/returns/${returnId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({
          courierName: 'JNE',
          courierService: 'JTR23',
          trackingNumber: 'JNE1234567890',
        });
      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('GET /v1/returns', () => {
    it('should return all returns for admin', async () => {
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

      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .get('/v1/returns')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.returns).toBeDefined();
    });
    it('should return 403 if user tries to access returns endpoint', async () => {
      // Arrange
      // Action
      const response = await request(server)
        .get('/v1/returns')
        .set('Authorization', `Bearer ${accessTokenUser}`);
      // Assert
      expect(response.statusCode).toBe(403);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('(User) GET /v1/returns/:id', () => {
    it('should return 200 and return data for valid rentalId', async () => {
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

      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .get(`/v1/returns/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.return).toBeDefined();
    });
    it('should return 404 if return data not found for rentalId', async () => {
      // Arrange
      const rentalId = 'nonexistent-rental-id';

      // Action
      const response = await request(server)
        .get(`/v1/returns/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
  describe('PATCH /v1/returns/:id/address', () => {
    it('should update return address successfully', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const newAddressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-456' });
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

      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: rentalId,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const response = await request(server)
        .patch(`/v1/returns/${rentalId}/address`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ newAddressId });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
    });
    it('should return 404 if return data not found for rentalId', async () => {
      // Arrange
      const rentalId = 'nonexistent-rental-id';
      const newAddressId = 'address-456';
      // Action
      const response = await request(server)
        .patch(`/v1/returns/${rentalId}/address`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ newAddressId });
      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('fail');
    });
  });
});

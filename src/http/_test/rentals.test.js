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

describe('/v1/rentals endpoint', () => {
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

  describe('PUT /v1/rentals/:id/status', () => {
    it('should return response code 200 and change status rental', async () => {
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

      // Action
      const response = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response code 404 if rental not found', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const rentalId = 'notfound';

      // Action
      const response = await request(server)
        .put(`/v1/rentals/${rentalId}/status`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send({ rentalStatus: 'active' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Rental tidak ditemukan');
    });
  });

  describe('PUT /v1/rentals/:id', () => {
    it('should return response code 200 and soft delete rental', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });

      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      }; const responseRental = await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);
      const rentalId = responseRental.body.data.id;

      // Action
      const response = await request(server)
        .put(`/v1/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response code 404 if rental not found', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const rentalId = 'notfound';

      // Action
      const response = await request(server)
        .put(`/v1/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Rental tidak ditemukan');
    });
  });

  describe('(Admin) GET /v1/rentals', () => {
    it('should return response code 200 and return all rental data', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
      };
      await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);

      // Action
      const response = await request(server)
        .get('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.rentals).toHaveLength(1);
    });
  });

  describe('(Admin) GET /v1/rentals/:id', () => {
    it('should return response code 200 and get detail rental', async () => {
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

      // Action
      const response = await request(server)
        .get(`/v1/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.rental.id).toBe(rentalId);
      expect(responseJson.data.rental).toBeDefined();
    });
    it('should return response code 404 if rental not found', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const rentalId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('rental tidak ditemukan');
    });
  });

  describe('(Admin) GET /v1/extensions/:id', () => {
    it('should return response code 200 and get detail extension', async () => {
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

      const responseExtension = await request(server)
        .post('/v1/extensions')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalId, interval: 6 });
      const extensionId = responseExtension.body.data.id;

      // Action
      const response = await request(server)
        .get(`/v1/extensions/${extensionId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.extension.id).toBe(extensionId);
    });
    it('should return response code 404 if extension not found', async () => {
      // Arrange
      const extensionId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/extensions/${extensionId}`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('(Admin) GET /v1/rentals/:id/extensions', () => {
    it('should return response code 200 and get all extensions for rental', async () => {
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

      await request(server)
        .post('/v1/extensions')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalId, interval: 6 });

      // Action
      const response = await request(server)
        .get(`/v1/rentals/${rentalId}/extensions`)
        .set('Authorization', `Bearer ${accessTokenAdmin}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.extensions).toHaveLength(1);
    });
  });

  describe('POST /v1/rentals', () => {
    it('should return response 201 and add new rental', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const addressId = await UsersTableTestHelper.addAddress('user-12345', { id: 'address-123' });
      const payload = {
        interval: 6,
        shippingAddressId: addressId,
        subdistrictName: 'Rejo Binangun',
        sensors: ['humidity'],
      };
      // Action
      const response = await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(payload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.id).toBeDefined();
    });
    it('should return response 404 if device not available', async () => {
      // Arrange
      const payload = {
        interval: 6,
        shippingAddressId: 'addressId',
        subdistrictName: 'Rejo Binangun',
        sensors: ['humidity'],
      };
      // Action
      const response = await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send(
          payload,
        );

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Tidak ada perangkat yang tersedia untuk disewakan');
    });
    it('should return response 403 if admin add rental', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payload = {
        interval: 6,
        shippingAddressId: 'addressId',
        subdistrictName: 'Rejo Binangun',
        sensors: ['humidity'],
      };
      // Action
      const response = await request(server)
        .post('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenAdmin}`)
        .send(payload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(403);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Admin tidak bisa melakukan aksi mengajukan rental');
    });
  });

  describe('PUT /v1/rentals/:id/cancel', () => {
    it('should return response code 200 and cancel rental', async () => {
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

      // Action
      const response = await request(server)
        .put(`/v1/rentals/${rentalId}/cancel`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalStatus: 'cancelled' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response code 404 if rental not found', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const rentalId = 'notfound';

      // Action
      const response = await request(server)
        .put(`/v1/rentals/${rentalId}/cancel`)
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalStatus: 'cancelled' });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('rental tidak ditemukan');
    });
  });
  describe('(User) GET /v1/rentals', () => {
    it('should return response code 200 and return all rental data', async () => {
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
        .get('/v1/rentals')
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.rentals).toHaveLength(1);
    });
  });
  describe('GET /v1/sensors/available', () => {
    it('should return response code 200 and return all sensor id', async () => {
      // Action
      const response = await request(server)
        .get('/v1/sensors/available')
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.sensors).toHaveLength(3);
    });
  });
  describe('(User) GET /v1/rentals/:id', () => {
    it('should return response code 200 and return rental data', async () => {
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
        .get(`/v1/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.rental.id).toBe(rentalId);
      expect(responseJson.data.rental).toBeDefined();
    });
    it('should return response code 404 if rental not found', async () => {
      // Arrange
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const rentalId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('rental tidak ditemukan');
    });
  });
  describe('GET /v1/shipping-cost', () => {
    it('should return response code 200 and return shipping cost', async () => {
      // Arrange
      const subdistrictName = 'Rejo Binangun';

      // Action
      const response = await request(server)
        .get('/v1/shipping-cost')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ subdistrictName });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.shippingInfo).toBeDefined();
      expect(responseJson.data.shippingInfo.shippingName).toBe('JNE');
      expect(responseJson.data.shippingInfo.serviceName).toBe('JTR23');
      expect(responseJson.data.shippingInfo.shippingCost).toBe(500000);
      expect(responseJson.data.shippingInfo.etd).toBe('4');
    });
  });
  describe('POST /v1/extensions', () => {
    it('should return response code 201 and add extension', async () => {
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
        .post('/v1/extensions')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalId, interval: 6 });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.id).toBeDefined();
    });
    it('should return response code 404 if rental not found', async () => {
      // Arrange
      const rentalId = 'notfound';

      // Action
      const response = await request(server)
        .post('/v1/extensions')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalId, interval: 6 });

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('(User) GET /v1/extensions/:id', () => {
    it('should return response code 200 and get detail extension', async () => {
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

      const responseExtension = await request(server)
        .post('/v1/extensions')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalId, interval: 6 });
      const extensionId = responseExtension.body.data.id;

      // Action
      const response = await request(server)
        .get(`/v1/extensions/${extensionId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.extension.id).toBe(extensionId);
    });
    it('should return response code 404 if extension not found', async () => {
      // Arrange
      const extensionId = 'notfound';

      // Action
      const response = await request(server)
        .get(`/v1/extensions/${extensionId}`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('(User) GET /v1/rentals/:id/extensions', () => {
    it('should return response code 200 and get all extensions for rental', async () => {
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

      await request(server)
        .post('/v1/extensions')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ rentalId, interval: 6 });

      // Action
      const response = await request(server)
        .get(`/v1/rentals/${rentalId}/extensions`)
        .set('Authorization', `Bearer ${accessTokenUser}`);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.extensions).toHaveLength(1);
    });
  });
});

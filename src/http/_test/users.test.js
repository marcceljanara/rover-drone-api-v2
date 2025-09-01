import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper.js';
import createServer from '../server.js';
import pool from '../../config/postgres/pool.js';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper.js';

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

describe('/v1/users endpoints', () => {
  let server;
  let userCookie;

  beforeAll(async () => {
    server = createServer();
  });

  beforeEach(async () => {
    userCookie = await registerAndLoginUser(server);
  });

  afterAll(async () => {
    await pool.end();
  });
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('POST /v1/users/register', () => {
    it('should response 201 and register new user', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      // Action
      const response = await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.userId).toBeDefined();
    });
    it('should response 400 and fail error email or username already exists', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };
      await UsersTableTestHelper.addUser({
        username: requestPayload.username,
        email: requestPayload.email,
      });

      // Action
      const response = await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('POST /v1/users/verify-otp', () => {
    it('should return response 200 and verify otp', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      const responseRegister = await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      const otpCode = await UsersTableTestHelper.findOtpUserById(responseRegister.body.data.userId);

      // Action
      const response = await request(server)
        .post('/v1/users/verify-otp')
        .send({ email: requestPayload.email, otp: otpCode });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });

    it('should return response 404 if email notfound', async () => {
      // Arrange and Action
      const response = await request(server)
        .post('/v1/users/verify-otp')
        .send({ email: 'notfound@gmail.com', otp: '123456' });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });

    it('should return response 401 if otp code is wrong', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Action
      const response = await request(server)
        .post('/v1/users/verify-otp')
        .send({ email: requestPayload.email, otp: '123456' });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(401);
      expect(responseJson.status).toBe('fail');
    });
  });
  describe('POST /v1/users/resend-otp', () => {
    it('should return response 200 and resend new otp code', async () => {
      // Arrange
      const requestPayload = {
        username: 'codingkeren',
        fullname: 'Coding Keren',
        email: 'codingkeren123@gmail.com',
        password: 'supercoding',
      };

      await request(server)
        .post('/v1/users/register')
        .send(requestPayload);

      // Action
      const response = await request(server)
        .post('/v1/users/resend-otp')
        .send({ email: requestPayload.email });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });
    it('should return response 404 if email notfound', async () => {
      // Arrange and Action
      const response = await request(server)
        .post('/v1/users/resend-otp')
        .send({ email: 'notfound@gmail.com' });

      // Assert
      const responseJson = await response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('POST /v1/users/addresses', () => {
    it('should return response code 200 and add new address', async () => {
      // Arrange
      const requestPayload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };

      // Action
      const response = await request(server)
        .post('/v1/users/addresses')
        .set('Cookie', userCookie).send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.addressId).toBeDefined();
    });

    it('should return code 400 bad request becauce invalid payload', async () => {
      // Arrange
      const requestPayload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'Jalan Bali Indah, depan beringin RT X/RW X',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        isDefault: true,
      };

      // Action
      const response = await request(server)
        .post('/v1/users/addresses')
        .set('Cookie', userCookie).send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('GET /v1/users/addresses', () => {
    it('should return response code 200 and get all address', async () => {
      // Arrange
      const user = 'user-12345';
      await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await UsersTableTestHelper.addAddress(user, { id: 'address-345' });

      // Action
      const response = await request(server)
        .get('/v1/users/addresses')
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.addresses).toHaveLength(2);
    });
    it('should return response code 404 if address not found', async () => {
      // Action
      const response = await request(server)
        .get('/v1/users/addresses')
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('GET /v1/users/addresses/:id', () => {
    it('should return response code 200 and get detail address', async () => {
      // Arrange
      const user = 'user-12345';
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await UsersTableTestHelper.addAddress(user, { id: 'address-345' });

      // Action
      const response = await request(server)
        .get(`/v1/users/addresses/${addressId}`)
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.address).toBeDefined();
    });
    it('should return response code 404 if address not found', async () => {
      // Arrange
      const addressId = 'user-12345';

      // Action
      const response = await request(server)
        .get(`/v1/users/addresses/${addressId}`)
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('PUT /v1/users/addresses/:id', () => {
    it('should return response code 200 and update address user', async () => {
      // Arrange
      const user = 'user-12345';
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      const requestPayload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'xxx',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };

      // Action
      const response = await request(server)
        .put(`/v1/users/addresses/${addressId}`)
        .set('Cookie', userCookie).send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });

    it('should return response code 404 if address not found', async () => {
      // Arrange
      const addressId = 'user-12345';
      const requestPayload = {
        namaPenerima: 'I Nengah Marccel',
        noHp: '085212345678',
        alamatLengkap: 'xxx',
        provinsi: 'Lampung',
        kabupatenKota: 'Lampung Timur',
        kecamatan: 'Raman Utara',
        kelurahan: 'Rejo Binangun',
        kodePos: '34371',
        isDefault: true,
      };

      // Action
      const response = await request(server)
        .put(`/v1/users/addresses/${addressId}`)
        .set('Cookie', userCookie).send(requestPayload);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('PATCH /v1/users/addresses/:id', () => {
    it('should return response code 200 and set default address', async () => {
      // Arrange
      const user = 'user-12345';
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });

      // Action
      const response = await request(server)
        .patch(`/v1/users/addresses/${addressId}`)
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.message).toBe('Alamat pengiriman utama berhasil diperbarui');
    });
    it('should return response code 404 if address not found', async () => {
      // Action
      const response = await request(server)
        .patch('/v1/users/addresses/notfound')
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('DELETE /v1/users/addresses', () => {
    it('should return response code 200 and delete address', async () => {
      // Arrange
      const user = 'user-12345';
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });

      // Action
      const response = await request(server)
        .delete(`/v1/users/addresses/${addressId}`)
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.message).toBe('Alamat pengiriman berhasil dihapus!');
    });
    it('should return response code 404 if address not found', async () => {
      // Action
      const response = await request(server)
        .delete('/v1/users/addresses/notfound')
        .set('Cookie', userCookie);

      // Assert
      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
    });
  });
});

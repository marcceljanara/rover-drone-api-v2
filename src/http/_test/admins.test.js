import pkg from 'pg';
import request from 'supertest';
import dotenv from 'dotenv';
import UsersTableTestHelper from '../../../tests/UserTableHelper';
import AuthenticationsTableTestHelper from '../../../tests/AuthenticationTableHelper';
import createServer from '../server';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool();

const registerAndLoginAdmin = async (server) => {
  const payload = {
    id: 'admin-12345',
    email: 'adminkeren@gmail.com',
    password: 'superadmin',
  };
  await UsersTableTestHelper.addAdmin(payload);

  const login = await request(server).post('/authentications')
    .send({ email: payload.email, password: payload.password });

  const { accessToken } = login.body.data;
  return accessToken;
};
describe('/admin/management endpoint', () => {
  let server;
  let accessToken;

  afterAll(async () => {
    await pool.end();
  });

  beforeAll(async () => {
    server = createServer();
  });

  beforeEach(async () => {
    accessToken = await registerAndLoginAdmin(server);
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  const addUser = async (userData = {}) => {
    const defaultUser = {
      id: 'user-a',
      username: 'userA',
      email: 'usera@gmail.com',
      password: 'usertest',
    };

    const user = await UsersTableTestHelper.addUser({ ...defaultUser, ...userData });
    return user;
  };

  describe('POST /admin/management', () => {
    it('should respond with 201 and register user', async () => {
      const requestPayload = {
        username: 'userdummy',
        password: 'userpassword',
        fullname: 'User Dummy',
        email: 'userdummy@gmail.com',
      };

      const response = await request(server)
        .post('/admin/management')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      const responseJson = response.body;
      expect(response.statusCode).toBe(201);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.userId).toBeDefined();
    });

    it('should respond with 400 if user already exists', async () => {
      const requestPayload = {
        username: 'userdummy',
        password: 'userpassword',
        fullname: 'User Dummy',
        email: 'userdummy@gmail.com',
      };
      await UsersTableTestHelper.addUser({ email: 'userdummy@gmail.com', username: 'userdummy' });

      const response = await request(server)
        .post('/admin/management')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      const responseJson = response.body;

      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });

  describe('GET /admin/management', () => {
    beforeEach(async () => {
      // Menambahkan data user dan admin untuk pengujian
      await addUser({ id: 'user-b', username: 'userB', email: 'userb@gmail.com' });
      await addUser({ id: 'user-c', username: 'userC', email: 'userc@gmail.com' });
      await UsersTableTestHelper.addAdmin({ id: 'admin-a', username: 'adminA', email: 'adminA@gmail.com' });
      await UsersTableTestHelper.addAdmin({ id: 'admin-b', username: 'adminB', email: 'adminB@gmail.com' });
    });

    it('should respond with 200 and get all users and admins with default limit and page', async () => {
      const response = await request(server)
        .get('/admin/management')
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.users).toHaveLength(5); // Total users and admins
      expect(responseJson.page).toBe(1);
      expect(responseJson.limit).toBe(10); // Default limit
    });

    it('should respond with 200 and paginated users when page and limit are provided', async () => {
      const response = await request(server)
        .get('/admin/management?page=1&limit=2') // Testing pagination
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.users).toHaveLength(2); // Limited to 2 users per page
      expect(responseJson.page).toBe(1);
      expect(responseJson.limit).toBe(2);
      expect(responseJson.totalPages).toBe(3); // Total pages based on totalCount
    });

    it('should respond with 200 and filtered users when search query is provided', async () => {
      const response = await request(server)
        .get('/admin/management?search=admin') // Testing search feature
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.users).toHaveLength(3); // Only users with "admin" in their data
      expect(responseJson.page).toBe(1);
      expect(responseJson.limit).toBe(10); // Default limit
    });

    it('should respond with 200 and empty users when search query does not match any user', async () => {
      const response = await request(server)
        .get('/admin/management?search=nonexistent') // Search for non-existent data
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.users).toHaveLength(0); // No users match the search query
      expect(responseJson.page).toBe(1);
      expect(responseJson.limit).toBe(10); // Default limit
    });
  });

  describe('GET /admin/management/:id', () => {
    it('should respond with 200 and get user details', async () => {
      const userId = await addUser();

      const response = await request(server)
        .get(`/admin/management/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.user).toBeDefined();
    });

    it('should respond with 404 if user not found', async () => {
      const response = await request(server)
        .get('/admin/management/notfound')
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('User tidak ditemukan');
    });
  });

  describe('DELETE /admin/management/:id', () => {
    it('should respond with 200 and delete user by id', async () => {
      const userId = await addUser();

      const response = await request(server)
        .delete(`/admin/management/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });

    it('should respond with 404 if user not found', async () => {
      const response = await request(server)
        .delete('/admin/management/notfound')
        .set('Authorization', `Bearer ${accessToken}`);

      const responseJson = response.body;
      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('User tidak ditemukan');
    });
  });

  describe('PUT /admin/management/:id', () => {
    it('should respond with 200 and update user password', async () => {
      const userId = await addUser();
      const requestPayload = {
        newPassword: 'newpassword',
        confNewPassword: 'newpassword',
      };

      const response = await request(server)
        .put(`/admin/management/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      const responseJson = response.body;
      expect(response.statusCode).toBe(200);
      expect(responseJson.status).toBe('success');
    });

    it('should respond with 400 if passwords do not match', async () => {
      const userId = await addUser();
      const requestPayload = {
        newPassword: 'newpassword',
        confNewPassword: 'mismatch',
      };

      const response = await request(server)
        .put(`/admin/management/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      const responseJson = response.body;
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
    });
  });
});

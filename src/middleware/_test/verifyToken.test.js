import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import verifyToken from '../verifyToken.js';

dotenv.config();

// Setup Express App
const app = express();
app.use(express.json());
app.use(cookieParser()); // <- WAJIB biar cookie bisa dibaca di middleware

app.get('/protected', verifyToken, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Anda berhasil mengakses endpoint yang dilindungi',
    user: { id: req.id, role: req.role },
  });
});

describe('verifyToken Middleware (pakai cookie)', () => {
  const validToken = jwt.sign(
    { id: 'user123', role: 'admin' },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '1h' },
  );
  const expiredToken = jwt.sign(
    { id: 'user123', role: 'admin' },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '-1s' },
  );
  const invalidToken = 'invalidtokenstring';

  it('should return 401 if token is not provided', async () => {
    const response = await request(app).get('/protected');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'fail',
      message: 'Token tidak ditemukan',
    });
  });

  it('should return 401 if token is expired', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${expiredToken}`]);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 'fail',
      message: 'Token sudah kadaluarsa',
    });
  });

  it('should return 403 if token is invalid', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${invalidToken}`]);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 'fail',
      message: 'Token tidak valid',
    });
  });

  it('should return 500 for unexpected errors', async () => {
    // Mock jwt.verify untuk melempar error tak terduga
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const response = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${validToken}`]);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });

    jwt.verify.mockRestore();
  });

  it('should call next middleware and set req.id and req.role if token is valid', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${validToken}`]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      message: 'Anda berhasil mengakses endpoint yang dilindungi',
      user: { id: 'user123', role: 'admin' },
    });
  });
});

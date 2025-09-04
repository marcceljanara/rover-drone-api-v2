import request from 'supertest';
import createServer from '../server.js'; // Sesuaikan path ke file createServer.js

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

let app;

beforeAll(() => {
  app = createServer(); // Inisialisasi server sebelum pengujian
});

describe('HTTP server', () => {
  it('should respond with 500 server error when an unexpected error occurs', async () => {
    // Simulasi kesalahan server dengan mengakses endpoint yang akan menyebabkan error.
    const response = await request(app).get('/cause-error'); // Buat rute ini di server.js

    // Assert
    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual({
      status: 'fail',
      message: 'Unexpected error',
    });
  });
});

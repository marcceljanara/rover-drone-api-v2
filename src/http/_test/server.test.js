import request from 'supertest';
import createServer from '../server.js'; // Sesuaikan path ke file createServer.js

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
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  });
});

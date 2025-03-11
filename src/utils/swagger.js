/* eslint-disable import/no-extraneous-dependencies */
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load konfigurasi dari .env
dotenv.config();

// Mendapatkan direktori saat ini dalam ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rover Drone API Documentation',
      version: '1.0.0',
      description: 'Dokumentasi API menggunakan Swagger pada Express.js dengan autentikasi JWT',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:5000', // Gunakan URL dari .env atau default localhost
        description: 'API Server',
      },
    ],
    tags: [
      { name: 'Users', description: 'API untuk mengelola pengguna' },
      { name: 'Admins', description: 'API untuk mengelola users oleh admin' },
      { name: 'Authentications', description: 'API untuk mengelola autentikasi' },
      { name: 'Devices', description: 'API untuk mengelola device' },
      { name: 'Rentals', description: 'API untuk mengelola rental' },
      { name: 'Payments', description: 'API untuk mengelola pembayaran' },
      { name: 'Reports', description: 'API untuk mengelola laporan' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../api/**/routes.js')], // Sesuaikan path dengan struktur proyek
};

const swaggerDocs = swaggerJSDoc(options);

const setupSwagger = (app) => {
  if (process.env.ENABLE_SWAGGER === 'true') {
    app.use('/v1/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
    console.log('Swagger aktif di:', `${process.env.BASE_URL}/v1/api-docs`);
  } else {
    console.log('Swagger dinonaktifkan di production.');
  }
};

export default setupSwagger;

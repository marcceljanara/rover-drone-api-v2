/* eslint-disable import/no-extraneous-dependencies */
import helmet from 'helmet';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';

// plugin
import usersPlugin from '../api/users/index.js';
import authenticationsPlugin from '../api/authentications/index.js';
import adminsPlugin from '../api/admins/index.js';
import rentalsPlugin from '../api/rentals/index.js';
import devicesPlugin from '../api/devices/index.js';
import paymentsPlugin from '../api/payments/index.js';
import reportsPlugin from '../api/reports/index.js';
import shipmentsPlugin from '../api/shipments/index.js';

// service
import UserService from '../services/postgres/UserServices.js';
import AuthenticationsService from '../services/postgres/AuthenticationsService.js';
import AdminsService from '../services/postgres/AdminsService.js';
import RentalsService from '../services/postgres/RentalsService.js';
import DevicesService from '../services/postgres/DevicesService.js';
import PaymentsService from '../services/postgres/PaymentsService.js';
import ProducerService from '../services/rabbitmq/ProducerService.js';
import PublisherService from '../services/mqtt/PublisherServiceMqtt.js';
import ReportsService from '../services/postgres/ReportsService.js';
import ShipmentsService from '../services/postgres/ShipmentsService.js';

// validator
import UsersValidator from '../validator/users/index.js';
import AuthenticationsValidator from '../validator/authentications/index.js';
import AdminsValidator from '../validator/admins/index.js';
import RentalsValidator from '../validator/rentals/index.js';
import DevicesValidator from '../validator/devices/index.js';
import PaymentsValidator from '../validator/payments/index.js';
import ReportsValidator from '../validator/reports/index.js';
import ShipmentsValidator from '../validator/shipments/index.js';

// token manager
import TokenManager from '../tokenize/TokenManager.js';

// Exceptions
import ClientError from '../exceptions/ClientError.js';
import ServerError from '../exceptions/ServerError.js';

dotenv.config();

function createServer() {
  const app = express();
  app.use(express.json());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.noSniff()); // Mencegah MIME-sniffing
  app.use(cors({
    origin: ['https://roverhub.xsmartagrichain.site', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // ⬅️ aktifkan kalau pakai cookie / token JWT dengan Auth header
  }));

  app.options('*', cors()); // ⬅️ Wajib biar preflight dijawab

  // Expose folder uploads secara publik
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Dependency Injection
  const userService = new UserService();
  const authenticationsService = new AuthenticationsService();
  const adminsService = new AdminsService();
  const rentalsService = new RentalsService();
  const devicesService = new DevicesService();
  const paymentsService = new PaymentsService();
  const reportsService = new ReportsService();
  const shipmentsService = new ShipmentsService();

  usersPlugin({
    app,
    userService,
    rabbitmqService: ProducerService,
    validator: UsersValidator,
  });

  authenticationsPlugin({
    app,
    authenticationsService,
    tokenManager: TokenManager,
    validator: AuthenticationsValidator,
  });

  adminsPlugin({
    app,
    adminsService,
    userService,
    validator: AdminsValidator,
  });

  rentalsPlugin({
    app,
    rentalsService,
    rabbitmqService: ProducerService,
    validator: RentalsValidator,
  });

  devicesPlugin({
    app,
    devicesService,
    mqttPublisher: PublisherService,
    validator: DevicesValidator,
  });

  paymentsPlugin({
    app,
    paymentsService,
    rentalsService,
    rabbitmqService: ProducerService,
    validator: PaymentsValidator,
  });

  reportsPlugin({
    app,
    reportsService,
    validator: ReportsValidator,
  });

  shipmentsPlugin({
    app,
    shipmentsService,
    rabbitmqService: ProducerService,
    validator: ShipmentsValidator,
  });

  // Global Error Handling Middleware
  // eslint-disable-next-line no-unused-vars
  app.get('/cause-error', (req, res) => {
    throw new ServerError('Unexpected error'); // Memicu error untuk pengujian
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Jika error merupakan instance ClientError
    if (err instanceof ClientError) {
      return res.status(err.statusCode).json({
        status: 'fail',
        message: err.message,
      });
    }
    if (err instanceof ServerError) {
      return res.status(err.statusCode).json({
        status: 'fail',
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'fail',
      message: err.message,
    });
  });

  return app;
}

export default createServer;

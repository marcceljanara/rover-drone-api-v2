import pkg from 'pg';
import dotenv from 'dotenv';
import ReportsService from '../ReportsService.js';
import RentalsService from '../RentalsService.js';
import PaymentsService from '../PaymentsService.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import InvariantError from '../../../exceptions/InvariantError.js';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import PaymentsTableTestHelper from '../../../../tests/PaymentTableTestHelper.js';
import ReportsTableTestHelper from '../../../../tests/ReportTableTestHelper.js';
import CacheService from '../../redis/CacheService.js';

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

const { Pool } = pkg;
const pool = new Pool();

describe('ReportsService', () => {
  let admin;
  let mockResponse;
  const cacheService = new CacheService();
  afterAll(async () => {
    await pool.end();
    await UsersTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
    await PaymentsTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    await ReportsTableTestHelper.cleanTable();
  });

  beforeAll(async () => {
    // Mock objek Response
    mockResponse = {
      setHeader: jest.fn(),
      pipe: jest.fn().mockImplementation(() => mockResponse),
      end: jest.fn(),
    };
    admin = await UsersTableTestHelper.addAdmin({ id: 'admin-123' });
    const rentalsService = new RentalsService(cacheService);
    const paymentsService = new PaymentsService(cacheService);
    const user1 = await UsersTableTestHelper.addUser({ id: 'user-123', username: 'user123', email: 'user123@gmail.com' });
    const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456', email: 'user456@gmail.com' });
    await DevicesTableTestHelper.addDevice({ id: 'device-123' });
    await DevicesTableTestHelper.addDevice({ id: 'device-456' });
    const addressId = await UsersTableTestHelper.addAddress(user1, { id: 'address-123' });
    const addressId2 = await UsersTableTestHelper.addAddress(user2, { id: 'address-456' });
    const payloadRental = {
      shippingName: 'JNE',
      serviceName: 'JTR23',
      shippingCost: 500000,
      etd: '4',
    };
    const paymentId1 = (await rentalsService.addRental(user1, 6, 'user', addressId, payloadRental)).payment_id;
    const paymentId2 = (await rentalsService.addRental(user2, 6, 'user', addressId2, payloadRental)).payment_id;
    const payload1 = {
      id: paymentId1,
      paymentStatus: 'completed',
      paymentMethod: 'BRI',
      transactionDescription: 'Payment successfully verified',
    };
    const payload2 = {
      id: paymentId2,
      paymentStatus: 'completed',
      paymentMethod: 'BNI',
      transactionDescription: 'Payment successfully verified',
    };
    await paymentsService.verificationPayment(payload1);
    await paymentsService.verificationPayment(payload2);

    // Mock cacheService.get agar mengembalikan null (memaksa query DB)
    // cacheService.get.mockResolvedValue(null);
    // cacheService.set.mockResolvedValue('OK');
    // cacheService.delete.mockResolvedValue(1);
  });

  describe('addReport Function', () => {
    it('should add report correctly', async () => {
      // Arrange
      const reportsService = new ReportsService(cacheService);

      // Action
      const id = await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');

      // Assert
      const report = await ReportsTableTestHelper.findReportById(id);
      expect(report).toBeDefined();
      expect(report.id).toBe(id);
      expect(report.user_id).toBe(admin);
    });
    it('should throw invariant error when startDate morethan endDate', async () => {
      // Arrange
      const reportsService = new ReportsService(cacheService);

      // Action and Assert
      await expect(reportsService.addReport(admin, '2025-02-08 00:00:00', '2025-02-05 00:00:00')).rejects.toThrow(InvariantError);
    });
  });

  describe('getAllReport function', () => {
    it('should return reports from DB when cache miss', async () => {
      jest.spyOn(cacheService, 'get').mockImplementation(() => { throw new Error('Cache miss'); });

      const reportsService = new ReportsService(cacheService);
      await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');
      await reportsService.addReport(admin, '2025-02-05 00:00:00', '2025-02-08 00:00:00');

      const reports = await reportsService.getAllReport();
      expect(reports).toHaveLength(2);
    });

    it('should return reports from cache when cache hit', async () => {
      const cachedReports = [
        {
          id: 'report-1', total_transactions: 1, total_amount: 1000, start_date: '2025-01-30', end_date: '2025-02-01', report_date: '2025-02-01',
        },
        {
          id: 'report-2', total_transactions: 2, total_amount: 2000, start_date: '2025-02-05', end_date: '2025-02-08', report_date: '2025-02-08',
        },
      ];
      jest.spyOn(cacheService, 'get').mockResolvedValue(JSON.stringify(cachedReports));

      const reportsService = new ReportsService(cacheService);
      const reports = await reportsService.getAllReport();
      expect(reports).toHaveLength(2);
    });
  });

  describe('getReport function', () => {
    it('should get detail report correctly when cache miss', async () => {
    // Arrange
      const reportsService = new ReportsService(cacheService);
      const reportId = await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');

      // Spy cacheService.get agar throw error → memaksa ambil dari DB
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        throw new Error('Cache miss');
      });

      // Action
      const report = await reportsService.getReport(reportId);

      // Assert
      expect(report).toBeDefined();
      expect(report.user_id).toBe(admin);
      expect(report.id).toBe(reportId);
      expect(report.payments).toBeDefined();
    });

    it('should get detail report correctly when cache hit', async () => {
    // Arrange
      const reportsService = new ReportsService(cacheService);
      const reportId = await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');

      // Siapkan data cache (harus berupa JSON string)
      const cachedReport = {
        id: reportId,
        user_id: admin,
        report_interval: 'Laporan 2025-01-30 - 2025-02-01',
        total_transactions: 1,
        total_amount: 5000,
        report_date: '2025-02-01',
        payments: [],
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(JSON.stringify(cachedReport));

      // Action
      const report = await reportsService.getReport(reportId);

      // Assert
      expect(report).toBeDefined();
      expect(report.user_id).toBe(admin);
      expect(report.id).toBe(reportId);
      expect(report.payments).toHaveLength(0);
    });

    it('should throw not found error when report not exist', async () => {
    // Arrange
      const reportsService = new ReportsService(cacheService);
      const reportId = 'notfound';

      // Spy cacheService.get agar throw error → masuk ke DB
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        throw new Error('Cache miss');
      });

      // Action and Assert
      await expect(reportsService.getReport(reportId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteReport function', () => {
    it('should delete report by id correctly', async () => {
      // Arrange
      const reportsService = new ReportsService(cacheService);
      const reportId = await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');

      // Action
      await reportsService.deleteReport(reportId);

      // Assert
      const report = await ReportsTableTestHelper.findReportById(reportId);
      expect(report).not.toBeDefined();
    });
    it('should throw not found error when report not found', async () => {
      // Arrange
      const reportsService = new ReportsService(cacheService);
      const reportId = 'notfound';

      // Action and Assert
      await expect(reportsService.deleteReport(reportId)).rejects.toThrow(NotFoundError);
    });
  });
});

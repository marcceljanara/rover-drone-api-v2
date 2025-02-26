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

dotenv.config();

const { Pool } = pkg;
const pool = new Pool();

const addRentalPayload = ((userId) => {
  const today = new Date();
  const tommorow = new Date(today);
  const threeDaysLater = new Date(today);

  // Sent startDate menjadi besok
  tommorow.setDate(today.getDate() + 1);

  // Set endDate menjadi 3 hari setelah hari ini
  threeDaysLater.setDate(today.getDate() + 3);

  // Format tanggal menjadi YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    userId, // Ganti dengan ID user dinamis
    startDate: formatDate(tommorow),
    endDate: formatDate(threeDaysLater),
  };
});

describe('ReportsService', () => {
  let admin;
  let mockResponse;
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
    const rentalsService = new RentalsService();
    const paymentsService = new PaymentsService();
    const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
    const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'user456', email: 'user456@gmail.com' });
    await DevicesTableTestHelper.addDevice({ id: 'device-123' });
    await DevicesTableTestHelper.addDevice({ id: 'device-456' });
    const paymentId1 = (await rentalsService.addRental(user1, 6, 'user')).payment_id;
    const paymentId2 = (await rentalsService.addRental(user2, 6, 'user')).payment_id;
    const payload1 = {
      id: paymentId1,
      paymentDate: new Date().toISOString(),
      paymentStatus: 'completed',
      paymentMethod: 'BRI',
      transactionDescription: 'Payment successfully verified',
    };
    const payload2 = {
      id: paymentId2,
      paymentDate: new Date().toISOString(),
      paymentStatus: 'completed',
      paymentMethod: 'BNI',
      transactionDescription: 'Payment successfully verified',
    };
    await paymentsService.verificationPayment(payload1);
    await paymentsService.verificationPayment(payload2);
  });

  describe('addReport Function', () => {
    it('should add report correctly', async () => {
      // Arrange
      const reportsService = new ReportsService();

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
      const reportsService = new ReportsService();

      // Action and Assert
      await expect(reportsService.addReport(admin, '2025-02-08 00:00:00', '2025-02-05 00:00:00')).rejects.toThrow(InvariantError);
    });
    it('should throw invariant error when startDate and endDate more than today', async () => {
      // Arrange
      const reportsService = new ReportsService();
      const payload = addRentalPayload('dummy');

      // Action and Assert
      await expect(reportsService
        .addReport(payload.startDate, payload.endDate)).rejects.toThrow(InvariantError);
    });
  });

  describe('getAllReport function', () => {
    it('should get all report correctly', async () => {
      // Arrange
      const reportsService = new ReportsService();
      await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');
      await reportsService.addReport(admin, '2025-02-05 00:00:00', '2025-02-08 00:00:00');

      // Action
      const reports = await reportsService.getAllReport();

      // Assert
      expect(reports).toHaveLength(2);
    });
  });

  describe('getReport function', () => {
    it('should get detail report correctly', async () => {
      // Arrange
      const reportsService = new ReportsService();
      const reportId = await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');

      // Action
      const report = await reportsService.getReport(reportId);

      // Assert
      expect(report).toBeDefined();
      expect(report.user_id).toBe(admin);
      expect(report.id).toBe(reportId);
    });
    it('should throw not found error when report not exist', async () => {
      // Arrange
      const reportsService = new ReportsService();
      const reportId = 'notfound';

      // Action and Assert
      await expect(reportsService.getReport(reportId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteReport function', () => {
    it('should delete report by id correctly', async () => {
      // Arrange
      const reportsService = new ReportsService();
      const reportId = await reportsService.addReport(admin, '2025-01-30 00:00:00', '2025-02-01 00:00:00');

      // Action
      await reportsService.deleteReport(reportId);

      // Assert
      const report = await ReportsTableTestHelper.findReportById(reportId);
      expect(report).not.toBeDefined();
    });
    it('should throw not found error when report not found', async () => {
      // Arrange
      const reportsService = new ReportsService();
      const reportId = 'notfound';

      // Action and Assert
      await expect(reportsService.deleteReport(reportId)).rejects.toThrow(NotFoundError);
    });
  });
});

import dotenv from 'dotenv';
import PaymentsService from '../PaymentsService.js';
import RentalsService from '../RentalsService.js';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper.js';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UserTableHelper.js';
import PaymentsTableTestHelper from '../../../../tests/PaymentTableTestHelper';
import InvariantError from '../../../exceptions/InvariantError.js';
import NotFoundError from '../../../exceptions/NotFoundError.js';
import pool from '../../../config/postgres/pool.js';

dotenv.config();

describe('PaymentsService', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
    await PaymentsTableTestHelper.cleanTable();
  });

  describe('getUserByPaymentId function', () => {
    it('should return user data when payment exists', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const paymentsService = new PaymentsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123000', email: 'user@example.com', fullname: 'John Doe' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const { payment_id } = await rentalsService.addRental(user, 6, 'user');

      // Action
      const userData = await paymentsService.getUserByPaymentId(payment_id);

      // Assert
      expect(userData.user_id).toBe(user);
      expect(userData.email).toBe('user@example.com');
      expect(userData.fullname).toBe('John Doe');
    });

    it('should throw NotFoundError when payment not found', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      const nonExistingPaymentId = 'non-existing-payment-id';

      // Action & Assert
      await expect(paymentsService
        .getUserByPaymentId(nonExistingPaymentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllPayments function', () => {
    it('should return all payments', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const paymentsService = new PaymentsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

      // Action
      const payment = await paymentsService.getAllPayments();

      // Assert
      expect(payment).toHaveLength(2);
    });
  });

  describe('getDetailPayment function', () => {
    it('should get detail payment', async () => {
      // Arrange
      const rentalsService = new RentalsService();
      const paymentsService = new PaymentsService();
      const user1 = await UsersTableTestHelper.addUser({ id: 'user-123' });
      const user2 = await UsersTableTestHelper.addUser({ id: 'user-456', username: 'userkeren', email: 'userkeren@gmail.com' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const { payment_id } = await rentalsService.addRental(user1, 6, 'user');
      await rentalsService.addRental(user2, 6, 'user');

      // Action
      const payment = await paymentsService.getDetailPayment(payment_id);

      // Assert
      expect(payment.id).toBe(payment_id);
    });

    it('should throw error when payment not found', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      const id = 'notfound';

      // Action and Assert
      await expect(paymentsService.getDetailPayment(id)).rejects.toThrow(NotFoundError);
    });
  });
  describe('verificationPayment function', () => {
    it('should verify payment and update payment details', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { payment_id } = await rentalsService.addRental(user, 6, 'user');

      const payload = {
        id: payment_id,
        paymentStatus: 'completed',
        paymentMethod: 'BRI',
        transactionDescription: 'Payment successfully verified',
      };

      // Action
      const result = await paymentsService.verificationPayment(payload);

      // Assert
      expect(result.id).toBe(payment_id);
      expect(result.payment_status).toBe(payload.paymentStatus);
    });

    it('should throw error if payment not found', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      const payload = {
        id: 'notfound',
        paymentStatus: 'completed',
        paymentMethod: 'BRI',
        transactionDescription: 'Payment successfully verified',
      };

      // Action & Assert
      await expect(paymentsService.verificationPayment(payload)).rejects.toThrow(NotFoundError);
    });
    it('should throw InvariantError when updating payment fails', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { payment_id } = await rentalsService.addRental(user, 6, 'user');

      const payload = {
        id: payment_id,
        paymentStatus: 'completed',
        paymentMethod: 'BRI',
        transactionDescription: 'Payment successfully verified',
      };

      // Mock query to simulate the payment being found
      const mockCheckQuery = jest.spyOn(paymentsService._pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: payment_id }],
        }) // Simulate payment found
        // Mock the update query to fail by returning rowCount: 0
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });

      // Action & Assert
      await expect(paymentsService
        .verificationPayment(payload)).rejects.toThrowError(InvariantError);
      expect(mockCheckQuery)
        .toHaveBeenCalledTimes(2); // Ensure both check and update queries were called
    });
  });

  describe('deletePayment function', () => {
    it('should delete payment by marking it as deleted', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      const rentalsService = new RentalsService();
      const user = await UsersTableTestHelper.addUser({ id: 'user-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const { payment_id } = await rentalsService.addRental(user, 6, 'user');

      // Action
      const result = await paymentsService.deletePayment(payment_id);

      // Assert
      expect(result.id).toBe(payment_id);

      // Verify the payment is marked as deleted
      const deletedPayment = await paymentsService.getDetailPayment(payment_id).catch((err) => err);
      expect(deletedPayment).toBeInstanceOf(NotFoundError);
    });

    it('should throw error if payment not found', async () => {
      // Arrange
      const paymentsService = new PaymentsService();
      const id = 'notfound';

      // Action & Assert
      await expect(paymentsService.deletePayment(id)).rejects.toThrow(NotFoundError);
    });
  });
  describe('transaction function', () => {
    it('should commit the transaction successfully', async () => {
      const paymentsService = new PaymentsService();
      const mockCallback = jest.fn().mockResolvedValue('Transaction Completed');

      const result = await paymentsService.transaction(mockCallback);

      expect(mockCallback).toHaveBeenCalled();
      expect(result).toBe('Transaction Completed');
    });

    it('should rollback the transaction when an error occurs', async () => {
      const paymentsService = new PaymentsService();
      const mockCallback = jest.fn().mockRejectedValue(new Error('Transaction Failed'));

      await expect(paymentsService.transaction(mockCallback)).rejects.toThrow('Transaction Failed');
      expect(mockCallback).toHaveBeenCalled();
    });
  });
});

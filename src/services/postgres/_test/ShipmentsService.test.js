import dotenv from 'dotenv';
import ShipmentsService from '../ShipmentsService';
import RentalsService from '../RentalsService';
import UsersTableTestHelper from '../../../../tests/UserTableHelper';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper';
import InvariantError from '../../../exceptions/InvariantError';
import NotFoundError from '../../../exceptions/NotFoundError';
import pool from '../../../config/postgres/pool';
import ReturnShippingTableTestHelper from '../../../../tests/ReturnShippingTableTestHelper';
import CacheService from '../../redis/CacheService';

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

describe('ShipmentsService', () => {
  const cacheService = new CacheService();
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
    await ReturnShippingTableTestHelper.cleanTable();
  });

  describe('getShipmentByRentalId', () => {
    it('should get shipment correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik@gmail.com', username: 'usernameunik', password: 'password',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      // Action
      const shipment = await shipmentsService.getShipmentByRentalId(id);

      // Assert
      expect(shipment.id).toEqual(expect.any(String));
      expect(shipment.rental_id).toBe(id);
      expect(shipment.shipping_address_id).toBe(addressId);
      expect(shipment.courier_name).toBe('JNE');
      expect(shipment.courier_service).toBe('JTR23');
      expect(shipment.tracking_number).toBe('');
      expect(shipment.shipping_status).toBe('waiting');
      expect(shipment.estimated_shipping_date).toBeInstanceOf(Date);
      expect(shipment.estimated_delivery_date).toBeInstanceOf(Date);
      expect(shipment.created_at).toBeInstanceOf(Date);
      expect(shipment.updated_at).toBeInstanceOf(Date);
      expect(shipment.notes).toBeNull();
      expect(shipment.actual_shipping_date).toBeNull();
      expect(shipment.actual_delivery_date).toBeNull();
    });
    it('should throw NotFoundError when shipment not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const rentalId = 'rental-123';

      // Action & Assert
      await expect(shipmentsService.getShipmentByRentalId(rentalId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateShippingInfo', () => {
    it('should update shipping info correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');
      const payload = {
        courierName: 'JNE',
        courierService: 'JTR23',
        trackingNumber: '1234567890',
        notes: 'Pengiriman cepat',
      };

      // Action and Assert
      await expect(shipmentsService.updateShippingInfo(shipmentId, payload))
        .resolves.not.toThrow();
    });
    it('should throw NotFoundError when shipment not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const shipmentId = 'shipment-123';
      const payload = {
        courierName: 'JNE',
        courierService: 'JTR23',
        trackingNumber: '1234567890',
        notes: 'Pengiriman cepat',
      };

      // Action & Assert
      await expect(shipmentsService.updateShippingInfo(shipmentId, payload))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('updateShippingStatus function', () => {
    it('should update shipping status correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');

      // Action
      const updatedShipment = await shipmentsService.updateShippingStatus(shipmentId, 'shipped');

      // Assert
      expect(updatedShipment.id).toBe(shipmentId);
      expect(updatedShipment.shipping_status).toBe('shipped');
    });
    it('should throw InvariantError for invalid status', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');

      // Action & Assert
      await expect(shipmentsService.updateShippingStatus(shipmentId, 'invalid_status')).rejects.toThrow(InvariantError);
    });
    it('should throw NotFoundError when shipment not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const shipmentId = 'shipment-123';

      // Action & Assert
      await expect(shipmentsService.updateShippingStatus(shipmentId, 'shipped'))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('confirmActualShipping function', () => {
    it('should confirm actual shipping correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');
      const shippingDate = new Date();

      // Action
      const shipment = await shipmentsService.confirmActualShipping(shipmentId, shippingDate);

      // Assert
      expect(shipment.id).toBe(shipmentId);
      expect(shipment.actual_shipping_date).toBeInstanceOf(Date);
    });
    it('should throw NotFoundError when shipment not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const shipmentId = 'shipment-123';
      const shippingDate = new Date();

      // Action & Assert
      await expect(shipmentsService.confirmActualShipping(shipmentId, shippingDate))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('confirmDelivery function', () => {
    it('should confirm delivery correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');
      const shippingDate = new Date();

      // Action
      const shipment = await shipmentsService.confirmDelivery(shipmentId, shippingDate);

      // Assert
      expect(shipment.id).toBe(shipmentId);
      expect(shipment.actual_delivery_date).toBeInstanceOf(Date);
    });
    it('should throw NotFoundError when shipment not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const shipmentId = 'shipment-123';
      const shippingDate = new Date();

      // Action & Assert
      await expect(shipmentsService.confirmDelivery(shipmentId, shippingDate))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('getAllShipments function', () => {
    const shipmentsService = new ShipmentsService();
    const rentalsService = new RentalsService(cacheService);
    beforeEach(async () => {
      // Arrange
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'all@test.com', username: 'alluser', password: 'password',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      await DevicesTableTestHelper.addDevice({ id: 'device-678' });

      const rental1 = await rentalsService.addRental(user, 6, 'user', addressId, {
        shippingName: 'JNE', serviceName: 'YES', shippingCost: 100000, etd: '2',
      });
      await rentalsService.changeStatusRental(rental1.id, 'active');

      const rental2 = await rentalsService.addRental(user, 6, 'user', addressId, {
        shippingName: 'TIKI', serviceName: 'ONS', shippingCost: 120000, etd: '3',
      });
      await rentalsService.changeStatusRental(rental2.id, 'active');
    });
    it('should return all shipments when no filter is applied', async () => {
      // Act
      const shipments = await shipmentsService.getAllShipments();

      // Assert
      expect(shipments.length).toBeGreaterThanOrEqual(2);
      const courierNames = shipments.map((s) => s.courier_name);
      expect(courierNames).toEqual(expect.arrayContaining(['JNE', 'TIKI']));
    });

    it('should filter shipments by shipping_status', async () => {
      // Act
      const filtered = await shipmentsService.getAllShipments({ status: 'waiting' });

      // Assert
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((shipment) => {
        expect(shipment.shipping_status).toBe('waiting');
      });
    });

    it('should filter shipments by courierName (case-insensitive, partial match)', async () => {
      // Act
      const filtered = await shipmentsService.getAllShipments({ courierName: 'jne' });

      // Assert
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((shipment) => {
        expect(shipment.courier_name.toLowerCase()).toContain('jne');
      });
    });

    it('should return empty array when no shipments match filter', async () => {
      // Act
      const filtered = await shipmentsService.getAllShipments({
        status: 'failed',
        courierName: 'unknown-courier',
      });

      // Assert
      expect(filtered).toEqual([]);
    });
  });
  describe('getReturnByRentalId function', () => {
    it('should get return shipment by rental ID', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const returnShipment = await shipmentsService.getReturnByRentalId(id);

      // Assert
      expect(returnShipment.id).toBe('return-123');
      expect(returnShipment.rental_id).toBe(id);
      expect(returnShipment.pickup_address_id).toBe(addressId);
      expect(returnShipment.status).toBe('requested');
      expect(returnShipment.pickup_method).toBe('pickup');
    });
    it('should throw NotFoundError when return shipment not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const rentalId = 'rental-123';

      // Action & Assert
      await expect(shipmentsService.getReturnByRentalId(rentalId))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('updateReturnAddress function', () => {
    it('should update return address correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123', isDefault: true });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });
      const newAddressId = await UsersTableTestHelper.addAddress(user, { id: 'address-456' });

      // Action and Assert
      await expect(shipmentsService.updateReturnAddress(id, user, newAddressId))
        .resolves.not.toThrow();
    });
    it('should throw NotFoundError when return shipping info not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const rentalId = 'rental-123';
      const userId = 'user-123';
      const newAddressId = 'address-456';

      // Action & Assert
      await expect(shipmentsService.updateReturnAddress(rentalId, userId, newAddressId))
        .rejects.toThrow(NotFoundError);
    });
    it('should throw InvariantError when trying to update return address after 2 days', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123', isDefault: true });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });
      const newAddressId = await UsersTableTestHelper.addAddress(user, { id: 'address-456' });

      // Simulate that the return was created more than 48 hours ago
      const returnCreatedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      await pool.query('UPDATE return_shipping_info SET created_at = $1 WHERE id = $2', [returnCreatedAt, 'return-123']);

      // Action & Assert
      await expect(shipmentsService.updateReturnAddress(id, user, newAddressId))
        .rejects.toThrow(InvariantError);
    });
  });
  describe('updateReturnStatus function', () => {
    it('should update return status correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const updatedReturn = await shipmentsService.updateReturnStatus(returnId, 'returning');

      // Assert
      expect(updatedReturn.id).toBe(returnId);
      expect(updatedReturn.status).toBe('returning');
    });
    it('should throw InvariantError for invalid status', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action & Assert
      await expect(shipmentsService.updateReturnStatus(returnId, 'invalid_status'))
        .rejects.toThrow(InvariantError);
    });
    it('should throw NotFoundError when return not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const returnId = 'return-123';

      // Action & Assert
      await expect(shipmentsService.updateReturnStatus(returnId, 'returning'))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('addReturnNote function', () => {
    it('should add return note correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action & Assert
      await expect(shipmentsService.addReturnNote(returnId, 'Catatan tambahan untuk return')).resolves.not.toThrow();
    });
    it('should throw NotFoundErrror when return not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const returnId = 'return-123';
      const note = 'Catatan tambahan untuk return';

      // Action & Assert
      await expect(shipmentsService.addReturnNote(returnId, note))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('updateReturnShippingInfo function', () => {
    it('should update return shipping info correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService(cacheService);
      const shipmentsService = new ShipmentsService();
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'emailunik2@gmail.com', username: 'usernameunik2', password: 'password2',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'JTR23',
        shippingCost: 500000,
        etd: '4',
      };
      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      await rentalsService.changeStatusRental(id, 'active');
      const returnId = await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-123',
        rental_id: id,
        pickup_address_id: addressId,
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Action
      const updatedReturn = await shipmentsService.updateReturnShippingInfo(returnId, {
        courierName: 'TIKI',
        courierService: 'ONS',
        trackingNumber: '0987654321',
        pickedUpAt: new Date(),
      });

      // Assert
      expect(updatedReturn.id).toBe(returnId);
    });

    it('should throw NotFoundError when return shipping info not found', async () => {
      // Arrange
      const shipmentsService = new ShipmentsService();
      const returnId = 'return-123';
      const payload = {
        courierName: 'TIKI',
        courierService: 'ONS',
        trackingNumber: '0987654321',
        pickedUpAt: new Date(),
      };

      // Action & Assert
      await expect(shipmentsService.updateReturnShippingInfo(returnId, payload))
        .rejects.toThrow(NotFoundError);
    });
  });
  describe('getAllReturns function', () => {
    const shipmentsService = new ShipmentsService();
    const rentalsService = new RentalsService(cacheService);

    beforeEach(async () => {
    // Arrange
      const user = await UsersTableTestHelper.addUser({
        id: 'user-123', email: 'returnuser@test.com', username: 'returnuser', password: 'password',
      });
      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-123' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });
      await DevicesTableTestHelper.addDevice({ id: 'device-45678' });

      // Rental 1 - JNE, status requested
      const rental1 = await rentalsService.addRental(user, 6, 'user', addressId, {
        shippingName: 'JNE', serviceName: 'YES', shippingCost: 100000, etd: '2',
      });
      await rentalsService.changeStatusRental(rental1.id, 'active');
      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-1',
        rental_id: rental1.id,
        pickup_address_id: addressId,
        courier_name: 'JNE',
        status: 'requested',
        pickup_method: 'pickup',
      });

      // Rental 2 - TIKI, status returning
      const rental2 = await rentalsService.addRental(user, 6, 'user', addressId, {
        shippingName: 'TIKI', serviceName: 'ONS', shippingCost: 120000, etd: '3',
      });
      await rentalsService.changeStatusRental(rental2.id, 'active');
      await ReturnShippingTableTestHelper.addReturnShippingInfo({
        id: 'return-2',
        rental_id: rental2.id,
        pickup_address_id: addressId,
        courier_name: 'TIKI',
        status: 'returning',
        pickup_method: 'pickup',
      });
    });

    it('should return all returns when no filter is applied', async () => {
      const result = await shipmentsService.getAllReturns();

      expect(result.length).toBeGreaterThanOrEqual(2);
      const returnIds = result.map((r) => r.id);
      expect(returnIds).toEqual(expect.arrayContaining(['return-1', 'return-2']));
    });

    it('should filter returns by status', async () => {
      const result = await shipmentsService.getAllReturns({ status: 'requested' });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((item) => {
        expect(item.status).toBe('requested');
      });
    });

    it('should filter returns by courier name (case-insensitive, partial match)', async () => {
      const result = await shipmentsService.getAllReturns({ courierName: 'jne' });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((item) => {
        expect(item.courier_name.toLowerCase()).toContain('jne');
      });
    });
    it('should return empty array if no return matches the filter', async () => {
      const result = await shipmentsService.getAllReturns({ courierName: 'invalid-courier' });

      expect(result).toEqual([]);
    });
  });
  describe('addDeliveryProof', () => {
    it('should update delivery_proof_url correctly', async () => {
    // Arrange
      const shipmentsService = new ShipmentsService();

      const user = await UsersTableTestHelper.addUser({
        id: 'user-456',
        email: 'unikdeliveryproof@gmail.com',
        username: 'unikdeliveryproof',
        password: 'password123',
      });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-456' });
      await DevicesTableTestHelper.addDevice({ id: 'device-456' });

      const rentalsService = new RentalsService(cacheService);
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'YES',
        shippingCost: 800000,
        etd: '2',
      };

      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');

      const photoUrl = 'https://example.com/proof/photo.jpg';

      // Action & Assert
      await expect(shipmentsService.addDeliveryProof(shipmentId, photoUrl))
        .resolves.not.toThrow();
    });

    it('should throw NotFoundError when shipment not found', async () => {
    // Arrange
      const shipmentsService = new ShipmentsService();
      const fakeShipmentId = 'shipment-404';
      const photoUrl = 'https://example.com/proof/notfound.jpg';

      // Action & Assert
      await expect(shipmentsService.addDeliveryProof(fakeShipmentId, photoUrl))
        .rejects.toThrowError('Pengiriman tidak ditemukan');
    });
  });
  describe('getDeliveryProofUrl', () => {
    it('should return delivery proof URL correctly', async () => {
    // Arrange
      const shipmentsService = new ShipmentsService();

      const user = await UsersTableTestHelper.addUser({
        id: 'user-789',
        email: 'proofurl@gmail.com',
        username: 'proofurluser',
        password: 'securepass',
      });

      const addressId = await UsersTableTestHelper.addAddress(user, { id: 'address-789' });
      await DevicesTableTestHelper.addDevice({ id: 'device-789' });

      const rentalsService = new RentalsService(cacheService);
      const payloadRental = {
        shippingName: 'JNE',
        serviceName: 'REG',
        shippingCost: 600000,
        etd: '3',
      };

      const { id } = await rentalsService.addRental(user, 6, 'user', addressId, payloadRental);
      const { shipmentId } = await rentalsService.changeStatusRental(id, 'active');

      const photoUrl = 'https://example.com/proof/image.jpg';
      await shipmentsService.addDeliveryProof(shipmentId, photoUrl);

      // Action
      const result = await shipmentsService.getDeliveryProofUrl(shipmentId);

      // Assert
      expect(result).toEqual(photoUrl);
    });

    it('should throw NotFoundError when shipment is not found', async () => {
    // Arrange
      const shipmentsService = new ShipmentsService();
      const fakeShipmentId = 'shipment-notfound';

      // Action & Assert
      await expect(shipmentsService.getDeliveryProofUrl(fakeShipmentId))
        .rejects.toThrowError('Data shipment tidak ditemukan');
    });
  });
});

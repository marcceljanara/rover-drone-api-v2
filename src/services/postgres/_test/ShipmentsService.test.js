import dotenv from 'dotenv';
import ShipmentsService from '../ShipmentsService';
import RentalsService from '../RentalsService';
import UsersTableTestHelper from '../../../../tests/UserTableHelper';
import RentalsTableTestHelper from '../../../../tests/RentalsTableTestHelper';
import DevicesTableTestHelper from '../../../../tests/DevicesTableTestHelper';
import InvariantError from '../../../exceptions/InvariantError';
import NotFoundError from '../../../exceptions/NotFoundError';
import pool from '../../../config/postgres/pool';

dotenv.config();

describe('ShipmentsService', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await RentalsTableTestHelper.cleanTable();
    await DevicesTableTestHelper.cleanTable();
  });

  describe('getShipmentByRentalId', () => {
    it('should get shipment correctly', async () => {
      // Arrange
      const rentalsService = new RentalsService();
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
      const rentalsService = new RentalsService();
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
      const rentalsService = new RentalsService();
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
      const rentalsService = new RentalsService();
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
      const rentalsService = new RentalsService();
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
      const rentalsService = new RentalsService();
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
    const rentalsService = new RentalsService();
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
});

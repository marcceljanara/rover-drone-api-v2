import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import pool from '../../config/postgres/pool.js';

class ShipmentsService {
  constructor() {
    this._pool = pool;
  }

  async getShipmentByRentalId(rentalId) {
    const query = {
      text: 'SELECT * FROM shipment_orders WHERE rental_id = $1',
      values: [rentalId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }

    return result.rows[0];
  }

  async updateShippingInfo(shipmentId, payload) {
    const {
      courierName,
      courierService,
      trackingNumber,
      estimatedShippingDate,
      notes,
    } = payload;

    const query = {
      text: `UPDATE shipment_orders
      SET
        courier_name = $1,
        courier_service = $2,
        tracking_number = $3,
        estimated_shipping_date = $4,
        notes = $5,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $6`,
      values: [
        courierName,
        courierService,
        trackingNumber,
        estimatedShippingDate,
        notes,
        shipmentId,
      ],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
  }

  async updateShippingStatus(shipmentId, status) {
    const allowedStatuses = [
      'waiting',
      'packed',
      'shipped',
      'delivered',
      'failed',
    ];
    if (!allowedStatuses.includes(status)) {
      throw new InvariantError('Status pengiriman tidak valid');
    }

    const query = {
      text: 'UPDATE shipment_orders SET shipping_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      values: [status, shipmentId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
  }

  async confirmActualShipping(shipmentId, date) {
    const query = {
      text: `UPDATE shipment_orders 
             SET actual_shipping_date = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
      values: [date, shipmentId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
  }

  async confirmDelivery(shipmentId, date) {
    const query = {
      text: `UPDATE shipment_orders 
             SET actual_delivery_date = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
      values: [date, shipmentId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
  }

  async getAllShipments(filter = {}) {
    let baseQuery = 'SELECT * FROM shipment_orders WHERE 1=1';
    const values = [];
    let idx = 1;

    if (filter.status) {
      baseQuery += ` AND shipping_status = $${idx}`;
      values.push(filter.status);
      idx += 1;
    }

    if (filter.courierName) {
      baseQuery += ` AND courier_name ILIKE $${idx}`;
      values.push(`%${filter.courierName}%`);
      idx += 1;
    }

    baseQuery += ' ORDER BY created_at DESC';

    const result = await this._pool.query({ text: baseQuery, values });

    return result.rows;
  }
}

export default ShipmentsService;

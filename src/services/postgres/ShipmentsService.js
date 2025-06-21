/* eslint-disable import/no-extraneous-dependencies */
import { differenceInHours } from 'date-fns';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import pool from '../../config/postgres/pool.js';

class ShipmentsService {
  constructor() {
    this._pool = pool;
  }

  async getShipmentByRentalId(rentalId) {
    const query = {
      text: `SELECT so.*,
      ua.nama_penerima,
      ua.no_hp,
      CONCAT_WS(', ',
        ua.alamat_lengkap,
        ua.kelurahan,
        ua.kecamatan,
        ua.kabupaten_kota,
        ua.provinsi,
        ua.kode_pos
      ) AS full_address 
      FROM shipment_orders so 
      LEFT JOIN user_addresses ua on ua.id = so.shipping_address_id AND ua.is_deleted = FALSE
      WHERE rental_id = $1`,
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
      notes,
    } = payload;

    const query = {
      text: `UPDATE shipment_orders
      SET
        courier_name = $1,
        courier_service = $2,
        tracking_number = $3,
        notes = $4,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $5`,
      values: [
        courierName,
        courierService,
        trackingNumber,
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
      text: 'UPDATE shipment_orders SET shipping_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, shipping_status',
      values: [status, shipmentId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
    return result.rows[0];
  }

  async confirmActualShipping(shipmentId, date) {
    const query = {
      text: `UPDATE shipment_orders 
             SET actual_shipping_date = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING id, actual_shipping_date`,
      values: [date, shipmentId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
    return result.rows[0];
  }

  async confirmDelivery(shipmentId, date) {
    const query = {
      text: `UPDATE shipment_orders 
             SET actual_delivery_date = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING id, actual_delivery_date`,
      values: [date, shipmentId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Pengiriman tidak ditemukan');
    }
    return result.rows[0];
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

  async addDeliveryProof(shipmentId, photoUrl) {
    const result = await this._pool.query({
      text: 'UPDATE shipment_orders SET delivery_proof_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      values: [photoUrl, shipmentId],
    });

    if (!result.rowCount) throw new NotFoundError('Pengiriman tidak ditemukan');
  }

  async getDeliveryProofUrl(shipmentId) {
    const result = await this._pool.query(
      'SELECT delivery_proof_url FROM shipment_orders WHERE id = $1',
      [shipmentId],
    );

    if (!result.rowCount) {
      throw new NotFoundError('Data shipment tidak ditemukan');
    }

    return result.rows[0].delivery_proof_url;
  }

  // 1. Ambil data return berdasarkan rentalId
  async getReturnByRentalId(rentalId) {
    const query = {
      text: `SELECT rsi.*,
      ua.nama_penerima,
      ua.no_hp,
      CONCAT_WS(', ',
        ua.alamat_lengkap,
        ua.kelurahan,
        ua.kecamatan,
        ua.kabupaten_kota,
        ua.provinsi,
        ua.kode_pos
      ) AS full_address 
      FROM return_shipping_info rsi 
      LEFT JOIN user_addresses ua on ua.id = rsi.pickup_address_id AND ua.is_deleted = FALSE
      WHERE rental_id = $1`,
      values: [rentalId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Informasi return tidak ditemukan');
    }

    return result.rows[0];
  }

  // 2. Update alamat penjemputan return, hanya jika belum lebih dari 2 hari
  async updateReturnAddress(rentalId, userId, newAddressId) {
    const result = await this._pool.query({
      text: `
      SELECT rsi.id, rsi.created_at
      FROM return_shipping_info rsi
      JOIN rentals r ON r.id = rsi.rental_id
      WHERE rsi.rental_id = $1 AND r.user_id = $2
    `,
      values: [rentalId, userId],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Data pengembalian tidak ditemukan atau Anda tidak berhak mengaksesnya');
    }

    const returnData = result.rows[0];
    const hoursSinceCreation = differenceInHours(new Date(), returnData.created_at);

    if (hoursSinceCreation > 48) {
      throw new InvariantError('Batas waktu untuk mengubah alamat sudah lewat');
    }

    await this._pool.query({
      text: `
      UPDATE return_shipping_info
      SET pickup_address_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      values: [newAddressId, returnData.id],
    });
  }

  // 3. Update status return oleh logistik/admin
  async updateReturnStatus(returnId, newStatus) {
    const allowedStatuses = ['requested', 'returning', 'returned', 'failed'];
    if (!allowedStatuses.includes(newStatus)) {
      throw new InvariantError('Status return tidak valid');
    }

    const result = await this._pool.query({
      text: 'UPDATE return_shipping_info SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      values: [newStatus, returnId],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Return tidak ditemukan');
    }
    return result.rows[0];
  }

  // 4. Tambahkan catatan return oleh admin
  async addReturnNote(returnId, note) {
    const result = await this._pool.query({
      text: 'UPDATE return_shipping_info SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      values: [note, returnId],
    });

    if (!result.rowCount) {
      throw new NotFoundError('Return tidak ditemukan');
    }
  }

  // 5. Ambil daftar return dengan filter
  async getAllReturns(filter = {}) {
    let query = 'SELECT * FROM return_shipping_info WHERE 1=1';
    const values = [];
    let idx = 1;

    if (filter.status) {
      query += ` AND status = $${idx}`;
      values.push(filter.status);
      idx += 1;
    }

    if (filter.courierName) {
      query += ` AND courier_name ILIKE $${idx}`;
      values.push(`%${filter.courierName}%`);
      idx += 1;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this._pool.query({ text: query, values });
    return result.rows;
  }

  // 6. Update data pengiriman return (logistik/admin)
  async updateReturnShippingInfo(returnId, payload) {
    const {
      courierName = null,
      courierService = null,
      trackingNumber = null,
      pickedUpAt = null,
      returnedAt = null,
    } = payload;

    const query = {
      text: `
      UPDATE return_shipping_info
      SET
        courier_name = $1,
        courier_service = $2,
        tracking_number = $3,
        picked_up_at = $4,
        returned_at = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id
    `,
      values: [
        courierName,
        courierService,
        trackingNumber,
        pickedUpAt,
        returnedAt,
        returnId,
      ],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Return tidak ditemukan');
    }

    return result.rows[0];
  }
}

export default ShipmentsService;

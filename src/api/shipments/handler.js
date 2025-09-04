import autoBind from 'auto-bind';

class ShipmentsHandler {
  constructor({ shipmentsService, rabbitmqService, validator }) {
    this._shipmentsService = shipmentsService;
    this._rabbitmqService = rabbitmqService;
    this._validator = validator;

    autoBind(this);
  }

  // Shipments Handlers
  async getShipmentByRentalIdHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const shipment = await this._shipmentsService.getShipmentByRentalId(id);

      return res.status(200).json({
        status: 'success',
        data: { shipment },
      });
    } catch (error) {
      return next(error);
    }
  }

  async putShippingInfoHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateShippingInfoPayload(req.body);

      const { id } = req.params;
      await this._shipmentsService.updateShippingInfo(id, req.body);

      return res.status(200).json({
        status: 'success',
        message: 'Informasi pengiriman berhasil diperbarui',
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchShippingStatusHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateShippingStatusPayload(req.body);

      const { id } = req.params;
      const { status } = req.body;

      await this._shipmentsService.updateShippingStatus(id, status);
      const message = {
        shipmentId: id,
        status,
      };
      await this._rabbitmqService.sendMessage('shipment:status', JSON.stringify(message));

      return res.status(200).json({
        status: 'success',
        message: 'Status pengiriman berhasil diperbarui',
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchConfirmActualShippingHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateShippingDatePayload(req.body);

      const { id } = req.params;
      const { date } = req.body;

      await this._shipmentsService.confirmActualShipping(id, date);

      return res.status(200).json({
        status: 'success',
        message: 'Tanggal pengiriman aktual berhasil dikonfirmasi',
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchConfirmDeliveryHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateShippingDatePayload(req.body);

      const { id } = req.params;
      const { date } = req.body;

      await this._shipmentsService.confirmDelivery(id, date);

      return res.status(200).json({
        status: 'success',
        message: 'Tanggal pengiriman diterima berhasil dikonfirmasi',
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllShipmentsHandler(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        courierName: req.query.courierName,
      };

      const shipments = await this._shipmentsService.getAllShipments(filters);

      return res.status(200).json({
        status: 'success',
        data: { shipments },
      });
    } catch (error) {
      return next(error);
    }
  }

  async uploadDeliveryProofHandler(req, res, next) {
    try {
      const { id: shipmentId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'File terlalu besar atau tidak sesuai format atau tidak ditemukan',
        });
      }

      const photoUrl = `/uploads/delivery-proofs/${req.file.filename}`;
      await this._shipmentsService.addDeliveryProof(shipmentId, photoUrl);

      return res.status(201).json({
        status: 'success',
        message: 'Bukti pengiriman berhasil diunggah',
        data: { photoUrl },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDeliveryProofHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id: shipmentId } = req.params;

      const deliveryProofUrl = await this._shipmentsService.getDeliveryProofUrl(shipmentId);

      return res.status(200).json({
        status: 'success',
        data: { deliveryProofUrl },
      });
    } catch (error) {
      return next(error);
    }
  }

  // Returns Shipping Handler
  async getReturnByRentalIdHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const returnData = await this._shipmentsService.getReturnByRentalId(id);

      return res.status(200).json({
        status: 'success',
        data: { return: returnData },
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchReturnAddressHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateUpdateReturnAddressPayload(req.body);

      const { id: rentalId } = req.params;
      const userId = req.id;
      const { newAddressId } = req.body;

      await this._shipmentsService.updateReturnAddress(rentalId, userId, newAddressId);

      return res.status(200).json({
        status: 'success',
        message: 'Alamat penjemputan return berhasil diperbarui',
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchReturnStatusHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateReturnStatusPayload(req.body);

      const { id: returnId } = req.params;
      const { status } = req.body;

      await this._shipmentsService.updateReturnStatus(returnId, status);

      return res.status(200).json({
        status: 'success',
        message: 'Status return berhasil diperbarui',
      });
    } catch (error) {
      return next(error);
    }
  }

  async patchReturnNoteHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateReturnNotePayload(req.body);

      const { id: returnId } = req.params;
      const { note } = req.body;

      await this._shipmentsService.addReturnNote(returnId, note);

      return res.status(200).json({
        status: 'success',
        message: 'Catatan return berhasil ditambahkan',
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllReturnsHandler(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        courierName: req.query.courierName,
      };

      const returns = await this._shipmentsService.getAllReturns(filters);

      return res.status(200).json({
        status: 'success',
        data: { returns },
      });
    } catch (error) {
      return next(error);
    }
  }

  async putReturnShippingInfoHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validateUpdateReturnShippingInfoPayload(req.body);

      const { id } = req.params;
      const returnData = await this._shipmentsService.updateReturnShippingInfo(id, req.body);

      return res.status(200).json({
        status: 'success',
        data: { return: returnData },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default ShipmentsHandler;

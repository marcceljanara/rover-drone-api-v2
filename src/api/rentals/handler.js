import calculateShippingCost from '../../utils/calculateShippingCost.js';

class RentalsHandler {
  constructor({ rentalsService, rabbitmqService, validator }) {
    this._rentalsService = rentalsService;
    this._rabbitmqService = rabbitmqService;
    this._validator = validator;

    // Admin
    this.putStatusRentalHandler = this.putStatusRentalHandler.bind(this);
    this.deleteRentalHandler = this.deleteRentalHandler.bind(this);

    // User (same id)
    this.postAddRentalHandler = this.postAddRentalHandler.bind(this);
    this.getAllRentalHandler = this.getAllRentalHandler.bind(this);
    this.getDetailRentalHandler = this.getDetailRentalHandler.bind(this);
    this.putCancelRentalHandler = this.putCancelRentalHandler.bind(this);
    this.getAllSensorsHandler = this.getAllSensorsHandler.bind(this);
    this.getShippingCostHandler = this.getShippingCostHandler.bind(this);
    this.postExtendRentalHandler = this.postExtendRentalHandler.bind(this);
    this.getAllExtensionsHandler = this.getAllExtensionsHandler.bind(this);
    this.getDetailExtensionHandler = this.getDetailExtensionHandler.bind(this);
  }

  async putStatusRentalHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      this._validator.validatePutStatusRentalPayload(req.body);
      const { id } = req.params;
      const { rentalStatus } = req.body;
      const rental = await this._rentalsService.changeStatusRental(id, rentalStatus);
      return res.status(200).json({
        status: 'success',
        message: `status rental ${rental.id} menjadi ${rental.rental_status}`,
        data: {
          shipmentId: rental.shipmentId,
          rentalId: rental.id,
          rentalStatus: rental.rental_status,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteRentalHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const rentalId = await this._rentalsService.deleteRental(id);
      return res.status(200).json({
        status: 'success',
        message: `${rentalId} berhasil dihapus`,
      });
    } catch (error) {
      return next(error);
    }
  }

  async postAddRentalHandler(req, res, next) {
    try {
      const { role } = req;
      const userId = req.id;
      await this._validator.validatePostAddRentalPayload(req.body);
      const {
        interval, sensors, shippingAddressId, subdistrictName,
      } = req.body;
      const shippingInfo = await calculateShippingCost(subdistrictName);
      const rental = await this._rentalsService
        .addRental(userId, interval, role, shippingAddressId, shippingInfo, sensors);
      const message = {
        userId,
        rentalId: rental.id,
        paymentId: rental.payment_id,
        cost: rental.cost,
        startDate: rental.start_date,
        endDate: rental.end_date,
      };
      await this._rabbitmqService.sendMessage('rental:request', JSON.stringify(message));
      await this._rabbitmqService.sendMessage('rental:payment', JSON.stringify(message));
      return res.status(201).json({
        status: 'success',
        message: `Berhasil mengajukan penyewaan, silahkan melakukan pembayaran sebesar ${rental.cost} dengan catatan menulis (Pembayaran ${rental.id})`,
        data: {
          id: rental.id,
          paymentId: rental.payment_id,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllRentalHandler(req, res) {
    const { role } = req;
    const userId = req.id;
    const rentals = await this._rentalsService.getAllRental(role, userId);
    return res.status(200).json({
      status: 'success',
      data: { rentals },
    });
  }

  async getAllSensorsHandler(req, res) {
    const sensors = await this._rentalsService.getAllSensors();
    return res.status(200).json({
      status: 'success',
      data: { sensors },
    });
  }

  async getDetailRentalHandler(req, res, next) {
    try {
      const { role } = req;
      const userId = req.id;
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;

      const rental = await this._rentalsService.getDetailRental(id, role, userId);
      return res.status(200).json({
        status: 'success',
        data: { rental },
      });
    } catch (error) {
      return next(error);
    }
  }

  async putCancelRentalHandler(req, res, next) {
    try {
      const userId = req.id;
      const { role } = req;
      this._validator.validateParamsPayload(req.params);
      this._validator.validatePutCancelRentalPayload(req.body);
      const { id } = req.params;
      const { rentalStatus } = req.body;
      await this._rentalsService.cancelRental({ userId, id, rentalStatus }, role);
      return res.status(200).json({
        status: 'success',
        message: 'rental berhasil dibatalkan',
      });
    } catch (error) {
      return next(error);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async getShippingCostHandler(req, res) {
    const { subdistrictName } = req.body;
    const shippingInfo = await calculateShippingCost(subdistrictName);
    return res.status(200).json({
      status: 'success',
      data: { shippingInfo },
    });
  }

  // Beri rabbitMq untuk perpanjangan rental
  async postExtendRentalHandler(req, res, next) {
    try {
      const userId = req.id;
      const { role } = req;
      this._validator.validatePostExtendRentalPayload(req.body);
      const { rentalId, interval } = req.body;
      const extension = await this._rentalsService
        .extensionRental(userId, rentalId, interval, role);
      return res.status(201).json({
        status: 'success',
        message: `Berhasil mengajukan perpanjangan rental ${rentalId}`,
        data: {
          id: extension.id,
          newEndDate: extension.new_end_date,
          status: extension.status,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllExtensionsHandler(req, res) {
    const userId = req.id;
    const { role } = req;
    this._validator.validateParamsPayload(req.params);
    const { id: rentalId } = req.params;

    const extensions = await this._rentalsService.getAllRentalExtensions(rentalId, userId, role);
    return res.status(200).json({
      status: 'success',
      data: { extensions },
    });
  }

  async getDetailExtensionHandler(req, res, next) {
    try {
      const userId = req.id;
      const { role } = req;
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const extension = await this._rentalsService.getRentalExtensionById(id, userId, role);
      return res.status(200).json({
        status: 'success',
        data: { extension },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default RentalsHandler;

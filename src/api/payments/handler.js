class PaymentsHandler {
  constructor({
    paymentsService, rentalsService, rabbitmqService, validator,
  }) {
    this._paymentsService = paymentsService;
    this._rentalsService = rentalsService;
    this._validator = validator;
    this._rabbitmqService = rabbitmqService;

    this.getAllPaymentsHandler = this.getAllPaymentsHandler.bind(this);
    this.getDetailPaymentHandler = this.getDetailPaymentHandler.bind(this);
    this.putVerificationPaymentHandler = this.putVerificationPaymentHandler.bind(this);
    this.deletePaymentHandler = this.deletePaymentHandler.bind(this);
  }

  async getAllPaymentsHandler(req, res) {
    const payments = await this._paymentsService.getAllPayments();
    return res.status(200).json({
      status: 'success',
      data: { payments },
    });
  }

  async getDetailPaymentHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;

      const payment = await this._paymentsService.getDetailPayment(id);
      return res.status(200).json({
        status: 'success',
        data: { payment },
      });
    } catch (error) {
      return next(error);
    }
  }

  async putVerificationPaymentHandler(req, res, next) {
    try {
      // Validasi input
      this._validator.validateParamsPayload(req.params);
      this._validator.validatePutVerificationPaymentPayload(req.body);

      const { id } = req.params;
      const {
        paymentStatus, paymentMethod, transactionDescription,
      } = req.body;

      // Status rental yang akan diubah
      const RENTAL_STATUS_ACTIVE = 'active';

      // Gunakan transaksi database untuk memastikan konsistensi
      const result = await this._paymentsService.transaction(async (transaction) => {
        // Verifikasi pembayaran
        const payment = await this._paymentsService.verificationPayment({
          id, paymentStatus, paymentMethod, transactionDescription,
        }, transaction);

        // Ubah status rental
        const rental = await this._rentalsService
          .changeStatusRental(payment.rental_id, RENTAL_STATUS_ACTIVE);

        const user = await this._paymentsService.getUserByPaymentId(id, transaction);
        const message = {
          userId: user.user_id,
          email: user.email,
          fullname: user.fullname,
          paymentId: payment.id,
        };
        await this._rabbitmqService.sendMessage('payment:success', JSON.stringify(message));

        // Return nilai untuk memastikan transaksi mengembalikan data
        return {
          payment,
          rental,
        };
      });

      // Kirim respons di luar transaksi
      return res.status(200).json({
        status: 'success',
        message: `Pembayaran ${result.payment.id} berhasil diverifikasi dan rental telah ${result.rental.rental_status}`,
      });
    } catch (error) {
      // Tangani error
      return next(error);
    }
  }

  async deletePaymentHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const payment = await this._paymentsService.deletePayment(id);
      return res.status(200).json({
        status: 'success',
        message: `${payment.id} berhasil dihapus`,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default PaymentsHandler;

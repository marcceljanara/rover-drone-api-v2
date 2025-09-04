import autoBind from 'auto-bind';

class PaymentsHandler {
  constructor({
    paymentsService, rentalsService, rabbitmqService, validator,
  }) {
    this._paymentsService = paymentsService;
    this._rentalsService = rentalsService;
    this._validator = validator;
    this._rabbitmqService = rabbitmqService;

    autoBind(this);
  }

  async getAllPaymentsHandler(req, res) {
    const { role } = req;
    const userId = req.id;
    const payments = await this._paymentsService.getAllPayments(role, userId);
    return res.status(200).json({
      status: 'success',
      data: { payments },
    });
  }

  async getDetailPaymentHandler(req, res, next) {
    try {
      const { role } = req;
      const userId = req.id;
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;

      const payment = await this._paymentsService.getDetailPayment(id, role, userId);
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

      const RENTAL_STATUS_ACTIVE = 'active';

      // Proses transaksi pembayaran (jangan ubah bagian ini)
      const result = await this._paymentsService.transaction(async (transaction) => {
        const payment = await this._paymentsService.verificationPayment({
          id, paymentStatus, paymentMethod, transactionDescription,
        }, transaction);

        const user = await this._paymentsService.getUserByPaymentId(id, transaction);

        return { payment, user };
      });

      const { payment, user } = result;

      // Jika payment_type = initial → aktifkan rental & kirim notifikasi
      if (payment.payment_type === 'initial') {
        const rental = await this._rentalsService
          .changeStatusRental(payment.rental_id, RENTAL_STATUS_ACTIVE);

        await this._rabbitmqService.sendMessage('payment:success', JSON.stringify({
          userId: user.user_id,
          email: user.email,
          fullname: user.fullname,
          paymentId: payment.id,
        }));

        await this._rabbitmqService.sendMessage('shipment:pending', JSON.stringify({
          userId: user.user_id,
          email: user.email,
          paymentId: payment.id,
          rentalId: payment.rental_id,
        }));

        return res.status(200).json({
          status: 'success',
          message: `Pembayaran ${payment.id} berhasil diverifikasi dan rental telah ${rental.rental_status}`,
        });
      }

      // Jika payment_type = extension → panggil completeExtension
      if (payment.payment_type === 'extension') {
        await this._rentalsService.completeExtension(payment.rental_id);

        await this._rabbitmqService.sendMessage('payment:success', JSON.stringify({
          userId: user.user_id,
          email: user.email,
          fullname: user.fullname,
          paymentId: payment.id,
        }));

        await this._rabbitmqService.sendMessage('extension:completed', JSON.stringify({
          userId: user.user_id,
          email: user.email,
          paymentId: payment.id,
          rentalId: payment.rental_id,
        }));

        return res.status(200).json({
          status: 'success',
          message: `Pembayaran ${payment.id} berhasil diverifikasi dan perpanjangan telah diterapkan.`,
        });
      }

      // Jika tipe pembayaran tidak dikenal
      throw new Error(`Unknown payment_type: ${payment.payment_type}`);
    } catch (error) {
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

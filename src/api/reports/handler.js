import autoBind from 'auto-bind';

class ReportsHandler {
  constructor({ reportsService, validator }) {
    this._reportsService = reportsService;
    this._validator = validator;

    autoBind(this);
  }

  async postReportHandler(req, res, next) {
    try {
      const userId = req.id;
      this._validator.validatePostReportPayload(req.body);
      const { startDate, endDate } = req.body;
      const reportId = await this._reportsService.addReport(userId, startDate, endDate);
      return res.status(201).json({
        status: 'success',
        message: 'laporan berhasil dibuat',
        data: { reportId },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllReportHandler(req, res) {
    const reports = await this._reportsService.getAllReport();
    return res.status(200).json({
      status: 'success',
      data: { reports },
    });
  }

  async getDetailReportHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const report = await this._reportsService.getReport(id);
      return res.status(200).json({
        status: 'success',
        data: { report },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDownloadReportHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;

      // Panggil service yang langsung meng-stream PDF ke response
      await this._reportsService.downloadReportPdf(id, res);
    } catch (error) {
      next(error);
    }
  }

  async deleteReportHandler(req, res, next) {
    try {
      this._validator.validateParamsPayload(req.params);
      const { id } = req.params;
      const report = await this._reportsService.deleteReport(id);
      return res.status(200).json({
        status: 'success',
        message: `${report} berhasil dihapus`,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default ReportsHandler;

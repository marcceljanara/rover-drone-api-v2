class LlmHandler {
  constructor({ llmService, devicesService, validator }) {
    this._llmService = llmService;
    this._devicesService = devicesService;
    this._validator = validator;

    this.postChatHandler = this.postChatHandler.bind(this);
    this.postAnalyzeSensor = this.postAnalyzeSensor.bind(this);
  }

  async postChatHandler(req, res, next) {
    try {
      this._validator.validateChatPayload(req.body);
      const { messages } = req.body;
      const chats = await this._llmService.chat(messages);
      return res.status(200).json({
        status: 'success',
        data: chats,
      });
    } catch (error) {
      return next(error);
    }
  }

  async postAnalyzeSensor(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.id;
      const { role } = req;
      const limit = parseInt(req.query.limit, 10) || 1;
      const sensor = await this._devicesService
        .getSensorDataLimit(userId, role, id, limit);
      const analyze = await this._llmService.analyzeSensor(sensor[0]);
      return res.status(200).json({
        status: 'success',
        data: analyze,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default LlmHandler;

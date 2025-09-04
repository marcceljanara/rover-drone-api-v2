import ClientError from './ClientError.js';

class UnsupportedMediaError extends ClientError {
  constructor(message) {
    super(message, 415);
    this.name = 'UnsupportedMediaError';
  }
}

export default UnsupportedMediaError;

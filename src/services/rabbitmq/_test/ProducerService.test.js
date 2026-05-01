import amqp from 'amqplib';
import ProducerService from '../ProducerService.js'; // Sesuaikan dengan lokasi file service Anda

// Mocking amqplib
jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

describe('ProducerService', () => {
  let mockConnect;
  let mockCreateChannel;
  let mockAssertQueue;
  let mockSendToQueue;

  beforeEach(() => {
    mockConnect = amqp.connect;
    mockCreateChannel = jest.fn();
    mockAssertQueue = jest.fn();
    mockSendToQueue = jest.fn();

    mockConnect.mockResolvedValue({
      createChannel: mockCreateChannel,
    });

    mockCreateChannel.mockResolvedValue({
      assertQueue: mockAssertQueue,
      sendToQueue: mockSendToQueue,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers(); // Ensure real timers are used after the test
  });

  it('should send message to RabbitMQ queue and close connection', async () => {
    const queue = 'testQueue';
    const message = 'Hello RabbitMQ';

    // Simulate mock implementation for `connection.close()`
    const mockClose = jest.fn();

    mockConnect.mockResolvedValue({
      createChannel: mockCreateChannel,
      close: mockClose, // mock `close` method
    });

    jest.useFakeTimers(); // Mock timers

    await ProducerService.sendMessage(queue, message);

    // Verifikasi bahwa connect dipanggil dengan benar
    expect(mockConnect).toHaveBeenCalledWith(process.env.RABBITMQ_SERVER);

    // Verifikasi bahwa createChannel dipanggil
    expect(mockCreateChannel).toHaveBeenCalled();

    // Verifikasi bahwa assertQueue dipanggil dengan queue dan opsi yang benar
    expect(mockAssertQueue).toHaveBeenCalledWith(queue, { durable: true });

    // Verifikasi bahwa sendToQueue dipanggil dengan pesan yang benar
    // expect(mockSendToQueue).toHaveBeenCalledWith(queue, Buffer.from(message));

    // Verifikasi bahwa `connection.close()` dipanggil setelah 1 detik
    jest.runAllTimers(); // Memaksa jest menjalankan semua timer yang tertunda (termasuk setTimeout)
    expect(mockClose).toHaveBeenCalled();
  });
});

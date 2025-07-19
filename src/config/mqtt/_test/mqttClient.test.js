/* eslint-disable no-shadow */
/* eslint-disable no-undef */
import mqtt from 'mqtt';
import MqttClient from '../mqttClient.js';

jest.mock('mqtt'); // Mocking MQTT library

describe('MqttClient', () => {
  let mqttClient;
  let mockMqttClient;

  beforeEach(() => {
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the MQTT client's methods
    mockMqttClient = {
      on: jest.fn(),
      subscribe: jest.fn((topic, callback) => callback(null)), // Simulate successful subscription
      publish: jest
        .fn((topic, message, options, callback) => callback(null)), // Simulate successful publish
      end: jest.fn((callback) => callback && callback()),
    };

    mqtt.connect.mockReturnValue(mockMqttClient);

    // Instantiate MqttClient
    mqttClient = new MqttClient({
      url: 'mqtt://test-broker',
      username: 'test-user',
      password: 'test-pass',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Restore mocked console.error
  });

  test('should initialize and connect to MQTT broker', () => {
    expect(mqtt.connect).toHaveBeenCalledWith('mqtt://test-broker', {
      username: 'test-user',
      password: 'test-pass',
    });
    expect(mockMqttClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockMqttClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockMqttClient.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('should subscribe to topics', () => {
    const topics = ['test/topic1', 'test/topic2'];
    mqttClient.subscribe(topics, jest.fn());

    expect(mockMqttClient.subscribe).toHaveBeenCalledTimes(topics.length);
    topics.forEach((topic) => {
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(topic, expect.any(Function));
    });
  });

  test('should publish messages to topics', () => {
    const topic = 'test/topic';
    const payload = { key: 'value' };
    const jsonMessage = JSON.stringify(payload);

    mqttClient.publish(topic, payload);

    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      topic,
      jsonMessage,
      { qos: 2 },
      expect.any(Function),
    );
  });

  test('should handle incoming messages', () => {
    const topic = 'test/topic';
    const message = 'test message';
    const mockOnMessage = jest.fn();

    mqttClient.subscribe([topic], mockOnMessage);

    // Simulate receiving a message
    const messageHandler = mockMqttClient.on.mock.calls.find((call) => call[0] === 'message')[1];
    messageHandler(topic, Buffer.from(message));

    expect(mockOnMessage).toHaveBeenCalledWith(topic, message);
  });

  test('should handle MQTT error events', () => {
    const mockErrorHandler = mockMqttClient.on.mock.calls.find((call) => call[0] === 'error')[1];
    const error = new Error('Connection failed');

    // Trigger error event
    mockErrorHandler(error);

    expect(console.error).toHaveBeenCalledWith('MQTT Error:', error.message);
  });

  test('should log error when subscription fails', () => {
    const topic = 'test/topic';
    const error = new Error('Subscription failed');
    mockMqttClient.subscribe.mockImplementation((topic, callback) => callback(error));

    mqttClient.subscribe([topic], jest.fn());

    expect(mockMqttClient.subscribe).toHaveBeenCalledWith(topic, expect.any(Function));
    expect(console.error).toHaveBeenCalledWith(`Failed to subscribe to topic: ${topic}`, error.message);
  });

  test('should log error when publishing fails', () => {
    const topic = 'test/topic';
    const payload = { key: 'value' };
    const jsonMessage = JSON.stringify(payload);
    const error = new Error('Publish failed');
    mockMqttClient.publish
      .mockImplementation((topic, message, options, callback) => callback(error));

    mqttClient.publish(topic, payload);

    expect(mockMqttClient.publish)
      .toHaveBeenCalledWith(topic, jsonMessage, { qos: 2 }, expect.any(Function));
    expect(console.error).toHaveBeenCalledWith(`Failed to publish to topic ${topic}: ${error.message}`);
  });
});

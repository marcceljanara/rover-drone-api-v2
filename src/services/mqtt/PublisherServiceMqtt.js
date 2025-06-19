import mqttService from '../../config/mqtt/mqttSingleton.js';

const PublisherService = {
  publishMessage: (topic, message) => {
    if (mqttService) {
      mqttService.publish(topic, message);
      console.log(`Message published to topic "${topic}":`, message);
    } else {
      console.log(`[TEST-MODE] Skip publish to ${topic}:`, message);
    }
  },
};

export default PublisherService;

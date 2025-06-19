// mqttSingleton.js
import dotenv from 'dotenv';
import MqttClient from './mqttClient.js';

dotenv.config();

const mqttOptions = {
  url: process.env.MQTT_URL,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

const mqttService = new MqttClient(mqttOptions);

export default mqttService;

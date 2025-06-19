/* eslint-disable import/no-mutable-exports */
// mqttSingleton.js
import dotenv from 'dotenv';
import MqttClient from './mqttClient.js';

dotenv.config();

let mqttService = null;

if (process.env.NODE_ENV !== 'test') {
  const mqttOptions = {
    url: process.env.MQTT_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  };

  mqttService = new MqttClient(mqttOptions);
}

export default mqttService;

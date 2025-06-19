/* eslint-disable import/no-extraneous-dependencies */
import mqtt from 'mqtt';

class MqttClient {
  /**
   * Inisialisasi MqttClient
   * @param {Object} options - Konfigurasi MQTT
   * @param {string} options.url - URL broker MQTT
   * @param {string} options.username - Username untuk autentikasi MQTT
   * @param {string} options.password - Password untuk autentikasi MQTT
   */
  constructor(options) {
    this._mqttClient = mqtt.connect(options.url, {
      username: options.username,
      password: options.password,
    });

    // Event handler untuk koneksi
    this._mqttClient.on('connect', () => {
      // console.log('Connected to MQTT broker');
    });

    // Event handler untuk pesan masuk
    this._mqttClient.on('message', (topic, message) => {
      console.log(`Message received on ${topic}: ${message.toString()}`);
      if (this._onMessage) {
        this._onMessage(topic, message.toString());
      }
    });

    // Event handler untuk error
    this._mqttClient.on('error', (err) => {
      console.error('MQTT Error:', err.message);
    });
  }

  /**
   * Subscribe ke daftar topik
   * @param {string[]} topics - Daftar topik yang akan di-subscribe
   * @param {Function} onMessage - Callback untuk menangani pesan masuk
   */
  subscribe(topics, onMessage) {
    this._onMessage = onMessage;
    const topicsArray = Array.isArray(topics) ? topics : [topics];
    topicsArray.forEach((topic) => {
      this._mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${topic}`);
        } else {
          console.error(`Failed to subscribe to topic: ${topic}`, err.message);
        }
      });
    });
  }

  /**
   * Publish data ke topik tertentu
   * @param {string} topic - Topik untuk publikasi
   * @param {Object} payload - Data yang akan dipublikasikan
   */
  publish(topic, payload) {
    const message = JSON.stringify(payload);
    this._mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish to topic ${topic}: ${err.message}`);
      } else {
        // console.log(`Published to topic: ${topic}`);
      }
    });
  }

  /**
   * Menutup koneksi MQTT
   */
  disconnect() {
    this._mqttClient.end();
  }
}

export default MqttClient;

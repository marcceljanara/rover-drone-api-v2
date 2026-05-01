/* eslint-disable import/no-extraneous-dependencies */
import amqp from 'amqplib';

const ProducerService = {
  sendMessage: async (queue, messsage) => {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
      durable: true,
    });
    await channel.sendToQueue(queue, Buffer.from(messsage), {
      persistent: true,
    });

    setTimeout(() => {
      connection.close();
    }, 1000);
  },
};

export default ProducerService;

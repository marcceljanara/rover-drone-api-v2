/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import dotenv from 'dotenv';
import NotFoundError from '../exceptions/NotFoundError.js';
import ServerError from '../exceptions/ServerError.js';

dotenv.config();

const { KOMERCE_BASE_URL } = process.env;
const { KOMERCE_API_KEY } = process.env;
const DEFAULT_SHIPPER_ID = 73939;

async function calculateShippingCost(subdistrictName) {
  try {
    // Step 1: Search for receiver destination ID
    const searchUrl = `${KOMERCE_BASE_URL}/destination/search?keyword=${encodeURIComponent(subdistrictName)}`;
    const searchResp = await axios.get(searchUrl, {
      headers: { 'x-api-key': KOMERCE_API_KEY },
    });

    const destinations = searchResp.data.data;
    if (!destinations || destinations.length === 0) {
      throw new NotFoundError('Tujuan pengiriman tidak ditemukan.');
    }

    const receiverDestinationId = destinations[0].id;

    // Step 2: Calculate shipping
    const calculateUrl = `${KOMERCE_BASE_URL}/calculate?shipper_destination_id=${DEFAULT_SHIPPER_ID}&receiver_destination_id=${receiverDestinationId}&weight=80&item_value=50000&cod=no`;
    const calcResp = await axios.get(calculateUrl, {
      headers: { 'x-api-key': KOMERCE_API_KEY },
    });

    const cargoOptions = calcResp.data.data.calculate_cargo;
    const jneOption = cargoOptions.find((opt) => opt.shipping_name === 'JNE');

    if (!jneOption) {
      throw new NotFoundError('Ekspedisi JNE tidak tersedia untuk tujuan ini.');
    }

    return {
      shippingName: jneOption.shipping_name,
      serviceName: jneOption.service_name,
      shippingCost: jneOption.shipping_cost * 2, // Mengalikan biaya ongkir dengan 2
      etd: jneOption.etd,
    };
  } catch (error) {
    throw new ServerError(`Gagal menghitung ongkir: ${error.message}`);
  }
}

// async function calculateShippingCost(subdistrictName) {
//   return {
//     shippingName: 'JNE',
//     serviceName: 'JTR23',
//     shippingCost: 800000 * 2, // Mengalikan biaya ongkir dengan 2
//     etd: '5',
//   };
// }

export default calculateShippingCost;

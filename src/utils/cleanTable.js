import dotenv from 'dotenv';
import AuthenticationsTableTestHelper from '../../tests/AuthenticationTableHelper.js';
import DevicesTableTestHelper from '../../tests/DevicesTableTestHelper.js';
import PaymentsTableTestHelper from '../../tests/PaymentTableTestHelper.js';
import RentalsTableTestHelper from '../../tests/RentalsTableTestHelper.js';
import ReportsTableTestHelper from '../../tests/ReportTableTestHelper.js';
import SensorTableTestHelper from '../../tests/SensorTableTestHelper.js';
import UsersTableTestHelper from '../../tests/UserTableHelper.js';

dotenv.config();

const cleanTable = async () => {
  await AuthenticationsTableTestHelper.cleanTable();
  await DevicesTableTestHelper.cleanTable();
  await PaymentsTableTestHelper.cleanTable();
  await RentalsTableTestHelper.cleanTable();
  await ReportsTableTestHelper.cleanTable();
  await SensorTableTestHelper.cleanTable();
  await UsersTableTestHelper.cleanTable();
};

cleanTable();

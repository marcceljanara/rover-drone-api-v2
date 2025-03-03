/* eslint-disable import/no-extraneous-dependencies */
import pkg from 'pg';
import { nanoid } from 'nanoid';
import PDFDocument from 'pdfkit';
import NotFoundError from '../../exceptions/NotFoundError.js';
import InvariantError from '../../exceptions/InvariantError.js';

const { Pool } = pkg;

class ReportsService {
  constructor() {
    this._pool = new Pool();
  }

  async addReport(userId, start_date, end_date) {
    const id = `report-${nanoid(16)}`;

    // Validasi format tanggal
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate > endDate) {
      throw new InvariantError('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
    }

    // Format tanggal agar sesuai dengan PostgreSQL (YYYY-MM-DD)
    const startDateFormatted = startDate.toISOString().split('T')[0];
    const endDateFormatted = endDate.toISOString().split('T')[0];

    // Query pembayaran dalam rentang tanggal
    const paymentQuery = {
      text: `
        SELECT COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS total_transactions 
        FROM payments 
        WHERE payment_date BETWEEN $1 AND $2 
        AND payment_status = 'completed' 
        AND is_deleted = FALSE
      `,
      values: [startDateFormatted, endDateFormatted],
    };

    const { rows } = await this._pool.query(paymentQuery);
    const totalAmount = Number(rows[0].total_amount) || 0;
    const totalTransaction = Number(rows[0].total_transactions) || 0;

    // Simpan laporan ke database
    const query = {
      text: `
        INSERT INTO reports (id, user_id, total_transactions, total_amount, start_date, end_date) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `,
      values: [id, userId, totalTransaction, totalAmount, startDateFormatted, endDateFormatted],
    };

    const result = await this._pool.query(query);
    return result.rows[0].id;
  }

  async getAllReport() {
    const query = {
      text: `SELECT id,
      report_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS report_date, 
      total_transactions, 
      start_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS start_date, 
      end_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS end_date
      FROM reports`,
      values: [],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getReport(id) {
    const query = {
      text: `SELECT *,
      report_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS report_date 
      FROM reports WHERE id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Laporan tidak ditemukan');
    }

    const startDate = result.rows[0].start_date;
    const endDate = result.rows[0].end_date;
    const report = result.rows[0];

    const paymentQuery = {
      text: `SELECT id,
       rental_id,
        amount,
        payment_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS payment_date,
        payment_status, 
        payment_method 
        FROM payments 
        WHERE payment_date BETWEEN $1 AND $2 
        AND payment_status = 'completed' 
        AND is_deleted = FALSE`,
      values: [startDate, endDate],
    };

    const paymentResult = await this._pool.query(paymentQuery);

    return {
      id: report.id,
      user_id: report.user_id,
      report_interval: `Laporan ${report.start_date} - ${report.end_date}`,
      total_transactions: report.total_transactions,
      total_amount: report.total_amount,
      report_date: report.report_date,
      payments: paymentResult.rows,
    };
  }

  async downloadReportPdf(id, res) {
    const report = await this.getReport(id);
    const doc = new PDFDocument({ margin: 30 });

    // Set response header agar browser mengunduh file
    res.setHeader('Content-Disposition', `attachment; filename="report_${id}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe PDF output langsung ke response
    doc.pipe(res);

    // Tambahkan Judul Laporan
    doc.fontSize(18).text('Laporan Transaksi', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`ID Laporan: ${report.id}`);
    doc.text(`User ID: ${report.user_id}`);
    doc.text(`Periode: ${report.report_interval}`);
    doc.text(`Total Transaksi: ${report.total_transactions}`);
    doc.text(`Total Jumlah: Rp${report.total_amount.toLocaleString('id-ID')}`);
    doc.text(`Tanggal Laporan: ${report.report_date}`);
    doc.moveDown();

    // Tambahkan Daftar Pembayaran
    doc.fontSize(14).text('Detail Pembayaran', { underline: true }).moveDown();
    report.payments.forEach((payment, index) => {
      doc.fontSize(10).text(`${index + 1}. Rental ID: ${payment.rental_id}`);
      doc.text(`   Amount: Rp${payment.amount.toLocaleString('id-ID')}`);
      doc.text(`   Status: ${payment.payment_status}`);
      doc.text(`   Metode: ${payment.payment_method}`);
      doc.text(`   Tanggal: ${payment.payment_date}`);
      doc.moveDown();
    });

    // Akhiri pembuatan PDF
    doc.end();
  }

  async deleteReport(id) {
    const query = {
      text: 'DELETE FROM reports WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Laporan tidak ditemukan');
    }
    return result.rows[0].id;
  }
}

export default ReportsService;

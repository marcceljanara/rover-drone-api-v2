function calculateRentalCost(interval) {
  const dailyRate = 100000; // Harga per hari
  const daysInMonth = 30; // Rata-rata hari dalam sebulan
  const rentalDays = interval * daysInMonth; // Hitung total hari berdasarkan bulan

  // Skema diskon
  const discountRates = {
    6: 0.05, // 5% diskon
    12: 0.10, // 10% diskon
    24: 0.15, // 15% diskon
    36: 0.20, // 20% diskon
  };

  const baseCost = rentalDays * dailyRate; // Harga sebelum diskon
  const discount = baseCost * (discountRates[interval] || 0); // Hitung diskon
  const finalCost = baseCost - discount; // Harga setelah diskon

  return {
    rentalDays, baseCost, discount, finalCost,
  };
}

export default calculateRentalCost;

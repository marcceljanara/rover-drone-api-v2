import generateUsernameFromEmail from '../generateUserNameFromEmail.js';

describe('generateUsernameFromEmail', () => {
  test('harus mengembalikan username yang diawali dengan bagian local dari email', () => {
    const email = 'johndoe@example.com';
    const username = generateUsernameFromEmail(email);
    expect(username.startsWith('johndoe')).toBe(true);
  });

  test('harus menambahkan 6 digit angka acak di akhir', () => {
    const email = 'testuser@example.com';
    const username = generateUsernameFromEmail(email);
    const suffix = username.slice(-6);

    expect(suffix).toMatch(/^\d{6}$/); // pastikan 6 digit angka
  });

  test('harus memotong local part hingga maksimal 12 karakter', () => {
    const email = 'averylongemailaddress@example.com';
    const username = generateUsernameFromEmail(email);
    const prefix = username.slice(0, username.length - 6); // bagian sebelum angka acak

    expect(prefix.length).toBeLessThanOrEqual(12);
  });

  test('harus menghasilkan username berbeda untuk pemanggilan berulang', () => {
    const email = 'duplicate@example.com';
    const username1 = generateUsernameFromEmail(email);
    const username2 = generateUsernameFromEmail(email);

    // Kemungkinan sangat kecil untuk sama, tapi kita tetap uji
    expect(username1).not.toBe(username2);
  });

  test('harus tetap berfungsi meskipun local part hanya 1 karakter', () => {
    const email = 'a@example.com';
    const username = generateUsernameFromEmail(email);

    expect(username.length).toBeGreaterThan(6); // pasti lebih dari 6 karena ditambah angka
  });
});

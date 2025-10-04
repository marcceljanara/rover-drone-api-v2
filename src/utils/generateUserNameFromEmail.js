function generateUsernameFromEmail(email) {
  const [localPart] = email.split('@'); // ambil bagian sebelum @
  const base = localPart.slice(0, 12); // ambil maksimal 12 char
  const randomNum = Math.floor(Math.random() * 1_000_000) // 0–999
    .toString()
    .padStart(6, '0'); // selalu 6 digit

  return base + randomNum;
}

export default generateUsernameFromEmail;

// ✅ SINGLE: tetap sesuai template-mu
export default function generateSensorPrompt({
  timestamp,
  temperature,
  humidity,
  light_intensity,
}) {
  return `
You are a smart agriculture assistant that interprets field sensor data from oil palm plantations and gives short, natural-sounding explanations and practical advice for farmers.

Below is an example of how you typically explain things:

---
**Example**  
📆 Date & Time: May 10, 2025  
🌡️ Air Temperature: 30.5°C  
💧 Air Humidity: 75%  
🔆 Light Intensity: 890 lux  

**Response:**  
The weather appears hot and moderately humid, with bright light conditions. High light intensity can be great for photosynthesis, but be cautious with fertilization timing. It’s better to fertilize in the morning or late afternoon to avoid nutrient evaporation.

---

Now analyze this new data in the same style:

📆 Date & Time: ${timestamp}  
🌡️ Air Temperature: ${temperature}°C  
💧 Air Humidity: ${humidity}%  
🔆 Light Intensity: ${light_intensity} lux  

Please write your analysis in natural English — as if you're casually explaining to a field technician. Include:
1. A short summary of the conditions  
2. Any risks or concerns  
3. Clear and friendly recommendations
`;
}

// 🆕 BATCH: minta JSON array of strings (tiap string = analisis singkat per baris)
export function generateBatchSensorPrompt(items = []) {
  const header = `
You are a smart agriculture assistant that interprets field sensor data from oil palm plantations.

TASK:
Write one combined analysis in plain English that summarizes:
- The overall condition
- Any concern or risk
- A practical recommendation for farmers

STYLE:
- Speak simply, like talking to a farmer
- No technical jargon
- No metaphors, keep it practical

Use this tone:
- "The soil is a bit dry, consider additional watering."
- "Light intensity is high, avoid midday fertilization."
- "Temperature is quite high, monitor for heat stress.",
`;

  const body = items.map((d, i) => `
# Item ${i + 1}
📆 Date & Time: ${d.timestamp}
🌡️ Temp: ${d.temperature}°C
💧 Humidity: ${d.humidity}%
🔆 Light: ${d.light_intensity} lux
`).join('\n');

  return [body, header].join('\n');
}

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
For each item, write a short analysis (2–3 simple sentences) in plain English:
1. Brief summary of the condition
2. Any risk or concern
3. A clear recommendation

STYLE:
- Speak simply, like talking to a farmer
- No technical jargon
- No metaphors, keep it practical

IMPORTANT OUTPUT RULES:
- Output ONLY a valid JSON array of strings
- Do NOT add explanations, markdown, comments, or text outside the array
- Each array item = one string in double quotes
- Keep array order same as input
`;

  const example = `
--- Example Input ---
📆 Date & Time: 2025-05-10 09:00  
🌡️ Temp: 30.5°C  
💧 Humidity: 75%  
🔆 Light: 890 lux  

--- Example Output ---
[
  "The weather is hot and moderately humid. Good light for growth, but avoid fertilizing at noon.",
  "Temperature is high with low humidity. Plants may dry faster, so consider watering earlier."
]
`;

  const body = items.map((d, i) => `
# Item ${i + 1}
📆 Date & Time: ${d.timestamp}
🌡️ Temp: ${d.temperature}°C
💧 Humidity: ${d.humidity}%
🔆 Light: ${d.light_intensity} lux
`).join('\n');

  return [body, header, example].join('\n');
}

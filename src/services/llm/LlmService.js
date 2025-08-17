/* eslint-disable import/no-extraneous-dependencies */
import OpenAI from 'openai';
import { translate } from '@vitalets/google-translate-api';
import generateSensorPrompt, { generateBatchSensorPrompt } from '../../utils/promptTemplates.js';

// 🔧 Konfigurasi Ollama (OpenAI-compatible)
const openai = new OpenAI({
  baseURL: 'http://127.0.0.1:11434/v1',
  apiKey: 'ollama-local', // tetap diperlukan meskipun dummy
});

// 🔍 Hapus tag <think>...</think> jika ada
function removeThinkTag(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// ===================
// 🔹 Service Methods
// ===================
const LlmService = {
  // 🔸 General Chat
  async chat(messages) {
    if (!Array.isArray(messages)) {
      throw new Error('`messages[]` is required');
    }

    const translatedMessages = [...messages];

    const lastUserIndex = [...messages].reverse().findIndex((msg) => msg.role === 'user');

    if (lastUserIndex !== -1) {
      const actualIndex = messages.length - 1 - lastUserIndex;
      const translated = await translate(messages[actualIndex].content, { to: 'en' });
      translatedMessages[actualIndex].content = translated.text;
    }

    const fullMessages = [
      {
        role: 'system',
        content: `You are a smart agriculture assistant that helps oil palm field technicians interpret daily sensor data.

Your tasks:
1. Explain the current condition based on the sensor data  
2. Give short, clear, and practical recommendations  
3. Avoid complex technical terms  
4. Keep it brief and to the point  
5. Focus only on important and actionable advice

Use this tone:
- "The soil is a bit dry, consider additional watering."
- "Light intensity is high, avoid midday fertilization."
- "Temperature is quite high, monitor for heat stress."`,
      },
      ...translatedMessages,
    ];

    const completion = await openai.chat.completions.create({
      model: 'deepseek-r1:1.5b',
      messages: fullMessages,
      temperature: 0.3,
    });

    const rawReply = removeThinkTag(completion.choices[0].message.content);

    // ⬇️ translate output saja
    const translated = await translate(rawReply, { to: 'id' });
    return translated.text;
  },

  /**
   * 🔸 Sensor Data Analysis
   * - Single input: { timestamp, temperature, humidity, light_intensity } -> returns string (ID)
   * - Batch input:
   * [ { timestamp, temperature, humidity, light_intensity }, ... ] -> returns string[] (ID)
   */
  async analyzeSensor(input) {
    // ===== Batch mode =====
    if (Array.isArray(input)) {
      const rows = input;

      if (rows.length === 0) {
        throw new Error('Sensor array is empty');
      }

      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i] || {};
        const hasAll = r.timestamp !== undefined
          && r.temperature !== undefined
          && r.humidity !== undefined
          && r.light_intensity !== undefined;
        if (!hasAll) {
          throw new Error(`Incomplete sensor data at index ${i}`);
        }
      }

      const prompt = generateBatchSensorPrompt(rows);
      console.log('Generated prompt:', prompt);

      const messages = [
        {
          role: 'system',
          content: `You are a smart agricultural assistant designed to help oil palm field technicians interpret daily sensor data.

Your job is to:
1. Briefly describe the current condition
2. Give simple, field-ready, and actionable advice
3. Avoid technical terms or long reasoning
4. Respond in 3 short sentences max
`,
        },
        { role: 'user', content: prompt },
      ];

      const completion = await openai.chat.completions.create({
        model: 'deepseek-r1:1.5b',
        messages,
        temperature: 0.3,
      });

      const raw = removeThinkTag(completion.choices[0].message.content);

      // ⬇️ translate output saja
      const translated = await translate(raw, { to: 'id' });

      return translated.text;
      // return raw;
    }

    // ===== Single mode =====
    const {
      timestamp, temperature, humidity, light_intensity,
    } = input || {};
    if (
      !timestamp
      || temperature === undefined
      || humidity === undefined
      || light_intensity === undefined
    ) {
      throw new Error('Incomplete sensor data');
    }

    const prompt = generateSensorPrompt({
      timestamp,
      temperature,
      humidity,
      light_intensity,
    });

    const messages = [
      {
        role: 'system',
        content: `You are a smart agricultural assistant designed to help oil palm field technicians interpret daily sensor data.

Your job is to:
1. Briefly describe the current condition
2. Give simple, field-ready, and actionable advice
3. Avoid technical terms or long reasoning
4. Respond in 3 short sentences max.`,
      },
      { role: 'user', content: prompt },
    ];

    const completion = await openai.chat.completions.create({
      model: 'deepseek-r1:1.5b',
      messages,
      temperature: 0.3,
    });

    const rawReply = removeThinkTag(completion.choices[0].message.content);

    // ⬇️ translate output saja
    const translated = await translate(rawReply, { to: 'id' });
    return translated.text;
  },
};

export default LlmService;

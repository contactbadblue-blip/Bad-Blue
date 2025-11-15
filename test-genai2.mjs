import * as genai from '@google/genai';

console.log('All exports:', Object.keys(genai));

// Try to find the right way to create a model
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (genai.GoogleGenAI) {
  const client = new genai.GoogleGenAI(apiKey);
  console.log('\nGoogleGenAI instance properties:');
  console.log('- Own properties:', Object.keys(client));
  console.log('- Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
  
  // Check if there's a models property or similar
  for (const prop of Object.keys(client)) {
    console.log(`  ${prop}:`, typeof client[prop]);
  }
}

// Check if there's a Models class
if (genai.Models) {
  console.log('\nModels class exists');
  try {
    const models = new genai.Models({ apiKey });
    console.log('Models instance created');
    console.log('Models methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(models)));
  } catch (e) {
    console.log('Models error:', e.message);
  }
}

// Try the Chat class
if (genai.Chat) {
  console.log('\nChat class exists');
}

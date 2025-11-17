import { GoogleGenAI } from '@google/genai';

console.log('Testing GoogleGenAI...');
console.log('GoogleGenAI type:', typeof GoogleGenAI);

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error('No API key found');
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
console.log('Using API key:', apiKey ? 'Found' : 'Missing');

try {
  const genAI = new GoogleGenAI(apiKey);
  console.log('GoogleGenAI instance created');
  console.log('Instance type:', typeof genAI);
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(genAI)));
  
  const { GoogleGenAI } = await import("@google/genai");

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const response = await client.models.generateContent({
  model: "gemini-2.0-flash",   // or "gemini-1.5-pro", whichever you use
  contents: searchQuery,
});

// New SDK response format:
const resultText = response.text;
return resultText;
  
  const result = await model.generateContent('Respond with just "OK" if working');
  const response = await result.response;
  const text = response.text();
  console.log('Response:', text);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}

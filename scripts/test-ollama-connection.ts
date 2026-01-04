/**
 * Quick test to verify Ollama connection
 */

import { OllamaClient } from '../src/llm/OllamaClient';

async function main() {
  console.log('Testing Ollama connection...');
  
  const client = new OllamaClient({
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    timeout: 10000
  });
  
  try {
    console.log('Checking health...');
    await client.health();
    console.log('✅ Connection successful!');
    
    console.log('\nConnecting...');
    await client.connect();
    console.log('✅ Connected!');
    
    console.log('\nTesting simple generation...');
    const response = await client.generate('Say "hello"', { temperature: 0.1 });
    console.log('✅ Generated:', response.text.substring(0, 100));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main().catch(console.error);

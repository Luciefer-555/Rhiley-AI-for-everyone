const fs = require('fs');
const path = require('path');
const https = require('https');
const Module = require('module');

// --- 1. SETUP MOCKS ---
const mockAxios = {
  post: (url, data, config) => {
    return new Promise((resolve, reject) => {
      console.log('\n--- RAW NIM REQUEST PAYLOAD (Sent via axios mock) ---');
      const logData = { ...data };
      if (logData.messages) {
        logData.messages = logData.messages.map(m => {
          if (Array.isArray(m.content)) {
            return {
              ...m,
              content: m.content.map(c => c.type === 'image_url' ? { type: 'image_url', image_url: { url: c.image_url.url.substring(0, 50) + '...[truncated]' } } : c)
            };
          }
          return m;
        });
      }
      console.log(JSON.stringify({ url, model: data.model, messages: logData.messages }, null, 2));

      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          ...config.headers,
          'Content-Length': Buffer.byteLength(JSON.stringify(data))
        }
      };

      const req = https.request(options, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          let responseData;
          try { responseData = JSON.parse(body); } catch(e) { responseData = body; }
          
          console.log('\n--- RAW NIM RESPONSE OBJECT ---');
          console.log(JSON.stringify(responseData, null, 2));
          console.log('-------------------------------\n');
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: responseData, config });
          } else {
            const error = new Error(`Request failed with status ${res.statusCode}`);
            error.response = { data: responseData };
            reject(error);
          }
        });
      });

      req.on('error', e => reject(e));
      req.write(JSON.stringify(data));
      req.end();
    });
  }
};

const mockExpress = {
  Router: () => ({ get: () => {}, post: () => {} }),
  json: () => {}
};

const mockTypescript = {
  transpileModule: () => ({ diagnostics: [] }),
  createSourceFile: () => ({}),
  ScriptTarget: { Latest: 99 },
  ModuleKind: { CommonJS: 1 }
};

// Hook require globally
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'axios') return mockAxios;
  if (id === 'express') return mockExpress;
  if (id === 'typescript') return mockTypescript;
  return originalRequire.apply(this, arguments);
};

// --- 2. LOAD ENV ---
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

if (!process.env.NVIDIA_API_KEY) {
  console.error("NVIDIA_API_KEY missing");
  process.exit(1);
}

// --- 3. RUN TESTS ---
async function runTests() {
  console.log("=============================================");
  console.log("TEST 1: CODE GENERATION via multiModelRouter");
  console.log("=============================================");
  try {
    const multiModelRouter = require('./multiModelRouter');
    const codeResult = await multiModelRouter("Create a simple button", [], "cinematic");
    console.log("Extracted TSX String:\n", codeResult);
  } catch (err) {
    console.error("Test 1 Failed:", err);
  }

  console.log("\n=============================================");
  console.log("TEST 2: VISION REQUEST via chat.js (with PNG)");
  console.log("=============================================");
  try {
    const chatExports = require('./routes/chat');
    // We patched chat.js to export callLLaVA. If not exported, we use fs to eval it.
    // Let's eval callLLaVA from chat.js source
    const chatSrc = fs.readFileSync(path.join(__dirname, './routes/chat.js'), 'utf8');
    // Expose required vars for eval
    const { NIM_BASE_URL, NIM_API_KEY, VISION_MODEL, CODING_MODEL } = require('./config/models');
    const axios = mockAxios;
    
    // Extract callLLaVA function source
    const fnMatch = chatSrc.match(/(async function callLLaVA[\s\S]*?})\n\n\/\/ GET/);
    if (!fnMatch) throw new Error("Could not find callLLaVA in chat.js");
    
    const callLLaVA = eval(`(${fnMatch[1]})`);
    
    // A valid 1x1 transparent PNG in base64 (with PNG magic number)
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    const reply = await callLLaVA("What is this image?", [pngBase64], [], null);
    console.log("Extracted Chat Reply:\n", reply);
  } catch (err) {
    console.error("Test 2 Failed:", err);
  }
}

runTests();

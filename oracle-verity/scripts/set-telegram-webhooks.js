const fs = require('fs');
const path = require('path');

// ── Read .env.local ───────────────────────────────────────────
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found. Make sure you are in the project root.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] ? match[2].trim() : '';
    // Strip quotes
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
  }
});

// Determine Vercel Production URL
const vercelUrl = env.VITE_VERCEL_URL || 'https://oracle-verity.vercel.app';
console.log(`Using Vercel Production URL: ${vercelUrl}`);

// List of bots we want to register
const bots = ['oracle', 'iris', 'anthony', 'atlas', 'athena', 'aegis', 'whisprr'];

async function registerWebhooks() {
  console.log('\n--- Registering Telegram Webhooks ---');

  for (const bot of bots) {
    const envKey = `VITE_TELEGRAM_TOKEN_${bot.toUpperCase()}`;
    const token = env[envKey] || (bot === 'oracle' ? env.VITE_TELEGRAM_TOKEN : null);

    if (!token) {
      console.log(`[-] Skip ${bot}: No token configured in .env.local (${envKey} is empty)`);
      continue;
    }

    // Set Webhook URL pointing to Vercel Endpoint
    const webhookUrl = `${vercelUrl}/api/telegram-webhook?bot=${bot}`;
    const registerUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    try {
      const res = await fetch(registerUrl);
      const data = await res.json();

      if (data.ok) {
        console.log(`[+] Success ${bot}: Webhook set to ${webhookUrl}`);
      } else {
        console.error(`[x] Failed ${bot}: ${data.description}`);
      }
    } catch (err) {
      console.error(`[x] Failed ${bot}: Error making request: ${err.message}`);
    }
  }

  console.log('\nWebhooks configuration process complete.');
}

registerWebhooks();

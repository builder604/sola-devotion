const webPush = require('web-push');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
  console.log('Created .env from .env.example');
}

let envContent = fs.readFileSync(envPath, 'utf-8');

if (envContent.includes('VAPID_PUBLIC_KEY=') &&
    !envContent.match(/VAPID_PUBLIC_KEY=\s*$/m) &&
    !envContent.match(/VAPID_PUBLIC_KEY=\s*\n/)) {
  console.log('VAPID keys already configured in .env');
  process.exit(0);
}

const vapidKeys = webPush.generateVAPIDKeys();

envContent = envContent.replace(
  /VAPID_PUBLIC_KEY=.*/,
  `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`
);
envContent = envContent.replace(
  /VAPID_PRIVATE_KEY=.*/,
  `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`
);

fs.writeFileSync(envPath, envContent);

console.log('VAPID keys generated and saved to .env');
console.log(`Public Key: ${vapidKeys.publicKey}`);

#!/usr/bin/env node
/* Simple installer for restaurant instance */
const fs = require("fs");
const path = require("path");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const QRCode = require("qrcode");

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    output.write("\n=== Configuration d'un nouveau restaurant ===\n\n");

    const restaurantName = (await rl.question("Nom du restaurant: ")).trim();
    const appUrl = (await rl.question("URL complète de l'application (ex: https://chez-mama.vercel.app): ")).trim();

    output.write("\n--- Firebase ---\n");
    const apiKey = (await rl.question("Firebase apiKey: ")).trim();
    const authDomain = (await rl.question("Firebase authDomain: ")).trim();
    const projectId = (await rl.question("Firebase projectId: ")).trim();
    const storageBucket = (await rl.question("Firebase storageBucket: ")).trim();
    const messagingSenderId = (await rl.question("Firebase messagingSenderId: ")).trim();
    const appId = (await rl.question("Firebase appId: ")).trim();

    output.write("\n--- Cloudinary ---\n");
    const cloudName = (await rl.question("Cloudinary cloudName: ")).trim();
    const cloudApiKey = (await rl.question("Cloudinary API Key (optionnel pour upload côté serveur): ")).trim();
    const cloudApiSecret = (await rl.question("Cloudinary API Secret (optionnel): ")).trim();

    // Write .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = `# ${restaurantName}
NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId}

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${cloudName}
CLOUDINARY_API_KEY=${cloudApiKey}
CLOUDINARY_API_SECRET=${cloudApiSecret}
NEXT_PUBLIC_APP_URL=${appUrl}
`;
    fs.writeFileSync(envPath, envContent, "utf8");

    // Ensure config files have the correct shape (idempotent)
    const firebaseCfgPath = path.join(process.cwd(), "src", "config", "firebase.ts");
    const cloudinaryCfgPath = path.join(process.cwd(), "src", "config", "cloudinary.ts");

    if (!fs.existsSync(firebaseCfgPath)) {
      fs.mkdirSync(path.dirname(firebaseCfgPath), { recursive: true });
      fs.writeFileSync(
        firebaseCfgPath,
        `export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};
`,
        "utf8"
      );
    }

    if (!fs.existsSync(cloudinaryCfgPath)) {
      fs.mkdirSync(path.dirname(cloudinaryCfgPath), { recursive: true });
      fs.writeFileSync(
        cloudinaryCfgPath,
        `export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
};
`,
        "utf8"
      );
    }

    // Generate QR code
    const publicDir = path.join(process.cwd(), "public");
    fs.mkdirSync(publicDir, { recursive: true });
    const qrPath = path.join(publicDir, "qr.png");
    await QRCode.toFile(qrPath, appUrl, {
      margin: 1,
      width: 512,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    output.write(`\n✅ Configuration terminée\n`);
    output.write(`- Fichier .env.local généré\n`);
    output.write(`- QR code généré: ${qrPath}\n`);
    output.write(`\nVous pouvez maintenant lancer l'application: npm run dev\n\n`);
  } catch (e) {
    console.error("Erreur durant l'installation:", e);
    process.exitCode = 1;
  } finally {
    await rl.close();
  }
}

main();

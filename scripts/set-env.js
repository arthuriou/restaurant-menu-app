const fs = require('fs');
const path = require('path');

const envName = process.argv[2];

if (!envName) {
    console.error('❌ Erreur : Veuillez spécifier un nom d\'environnement.');
    console.log('Usage : node scripts/set-env.js <nom_env>');
    console.log('Exemple : node scripts/set-env.js dev');
    process.exit(1);
}

const sourcePath = path.join(__dirname, '..', 'envs', `${envName}.env`);
const destPath = path.join(__dirname, '..', '.env.local');

// Vérifier si le fichier source existe
if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Erreur : Le fichier de configuration "${envName}.env" n'existe pas dans le dossier "envs".`);
    process.exit(1);
}

try {
    // Copier le fichier
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Succès : L'environnement "${envName}" a été activé !`);
    console.log(`   Source : envs/${envName}.env`);
    console.log(`   Destination : .env.local`);
} catch (err) {
    console.error('❌ Erreur lors de la copie du fichier :', err);
    process.exit(1);
}

// Copie l'interface web (../public) dans www/ pour l'embarquer dans l'appli Windows
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'public');
const dst = path.join(__dirname, 'www');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: (f) => path.basename(f) !== 'sw.js' });
fs.copyFileSync(path.join(__dirname, '..', 'VERSION'), path.join(dst, 'VERSION'));
console.log('Interface copiée dans www/ (version ' + fs.readFileSync(path.join(dst, 'VERSION'), 'utf8').trim() + ')');

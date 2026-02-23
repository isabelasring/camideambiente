/**
 * Genera dos JSON:
 * - usuariosSiguenCamilo.json: comentadores que siguen a Camilo
 * - usuariosNoSiguenCamilo.json: comentadores que NO siguen a Camilo
 * Fuente: profileUsersComments.json + seguidoresCamilo.csv
 */
const fs = require('fs');
const path = require('path');

const CSVJSON = path.join(__dirname, '..', 'csvjson');
const PROFILE = path.join(CSVJSON, 'profileUsersComments.json');
const SEGUIDORES = path.join(CSVJSON, 'seguidoresCamilo.csv');
const OUT_SIGUEN = path.join(CSVJSON, 'usuariosSiguenCamilo.json');
const OUT_NO_SIGUEN = path.join(CSVJSON, 'usuariosNoSiguenCamilo.json');

function parseCSV(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',' || c === '\n' || c === '\r') {
        row.push(field.trim());
        field = '';
        if (c === '\n' || (c === '\r' && next !== '\n')) {
          if (row.some(cell => cell)) rows.push(row);
          row = [];
        }
        if (c === '\r' && next === '\n') i++;
      } else field += c;
    }
  }
  if (field || row.length) row.push(field.trim()), rows.push(row);
  return rows;
}

const profiles = JSON.parse(fs.readFileSync(PROFILE, 'utf8'));
const rows = parseCSV(fs.readFileSync(SEGUIDORES, 'utf8'));
const headers = rows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
const iUser = headers.indexOf('username');
const sigueSet = new Set();
for (let i = 1; i < rows.length; i++) {
  const u = (rows[i][iUser] || '').trim().toLowerCase();
  if (u) sigueSet.add(u);
}

const siguen = [];
const noSiguen = [];
for (const p of profiles) {
  const user = (p.username || '').toLowerCase();
  const entry = { ...p };
  if (sigueSet.has(user)) {
    siguen.push(entry);
  } else {
    noSiguen.push(entry);
  }
}

fs.writeFileSync(OUT_SIGUEN, JSON.stringify(siguen, null, 2), 'utf8');
fs.writeFileSync(OUT_NO_SIGUEN, JSON.stringify(noSiguen, null, 2), 'utf8');

console.log('Generados:');
console.log('  usuariosSiguenCamilo.json:', siguen.length, 'usuarios');
console.log('  usuariosNoSiguenCamilo.json:', noSiguen.length, 'usuarios');

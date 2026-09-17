const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const constantsPath = path.join(root, 'src', 'constants.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf-8');
const match = constantsContent.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);

if (!match) {
  process.exit(1);
}

const version = match[1];
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const tauriPath = path.join(root, 'src-tauri', 'tauri.conf.json');
const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf-8'));
tauri.version = version;
fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
const cargoPath = path.join(root, 'src-tauri', 'Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf-8');
cargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
fs.writeFileSync(cargoPath, cargo);

// 读取 .env.local 里的 Supabase 配置，写进 build.rs 供 Rust 编译期注入（后端更新检测用）
function readEnvLocal() {
  const envPath = path.join(root, '.env.local');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx < 0) continue;
    out[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return out;
}
const env = readEnvLocal();
const buildRsPath = path.join(root, 'src-tauri', 'build.rs');
let buildRs = fs.readFileSync(buildRsPath, 'utf-8');
function setEnvConst(name, value) {
  // 替换形如：  const NAME: &str = "...";  （没有则追加到文件末尾）
  const re = new RegExp(`(const ${name}: &str = ")[^"]*(";)`);
  if (re.test(buildRs)) {
    buildRs = buildRs.replace(re, `$1${value}$2`);
  } else {
    buildRs = buildRs.replace(/\n*$/u, `\nconst ${name}: &str = "${value}";\n`);
  }
}
setEnvConst('VITE_API_URL', env.VITE_API_URL || '');
setEnvConst('VITE_API_KEY', env.VITE_API_KEY || '');
setEnvConst('APP_VERSION', version);
fs.writeFileSync(buildRsPath, buildRs);
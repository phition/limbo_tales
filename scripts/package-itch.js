import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const distPath = path.resolve('dist');
const zipPath = path.resolve('itch_build.zip');

// itch.io HTML5 업로드 제한
const ITCH_MAX_FILES = 1000;
const ITCH_MAX_TOTAL_MB = 500;
const ITCH_MAX_FILE_MB = 200;

if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'))) {
  console.error('❌ dist/index.html not found. Please run npm run build first.');
  process.exit(1);
}

// dist 내부 파일 목록 수집 + itch.io 제한 사전 점검
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
};
walk(distPath);

let totalBytes = 0;
const oversized = [];
for (const f of files) {
  const size = fs.statSync(f).size;
  totalBytes += size;
  if (size > ITCH_MAX_FILE_MB * 1024 * 1024) oversized.push(path.relative(distPath, f));
}
const totalMb = totalBytes / (1024 * 1024);
console.log(`📊 [itch.io] ${files.length} files, ${totalMb.toFixed(2)} MB (uncompressed)`);
if (files.length > ITCH_MAX_FILES) console.warn(`⚠️ File count exceeds itch.io limit (${ITCH_MAX_FILES}).`);
if (totalMb > ITCH_MAX_TOTAL_MB) console.warn(`⚠️ Total size exceeds itch.io limit (${ITCH_MAX_TOTAL_MB} MB).`);
if (oversized.length) console.warn(`⚠️ Files over ${ITCH_MAX_FILE_MB} MB: ${oversized.join(', ')}`);

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log('📦 [itch.io] Packaging dist folder contents into itch_build.zip...');

// Windows PowerShell 5.1의 Compress-Archive는 zip 엔트리 경로에 역슬래시(\)를 사용하여
// itch.io(리눅스) 서버에서 하위 폴더가 깨지는 문제가 있으므로, .NET ZipArchive로
// 엔트리 이름을 슬래시(/)로 직접 지정하여 생성한다. index.html은 zip 루트에 위치한다.
const psScript = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = [System.IO.Path]::GetFullPath($env:ITCH_DIST)
$dst = $env:ITCH_ZIP
$zip = [System.IO.Compression.ZipFile]::Open($dst, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length).TrimStart('\\','/').Replace('\\','/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally {
  $zip.Dispose()
}
`;

const scriptFile = path.join(os.tmpdir(), `package-itch-${Date.now()}.ps1`);
// BOM 포함 UTF-8로 저장하여 한글 경로에서도 PowerShell이 올바르게 해석하도록 함
fs.writeFileSync(scriptFile, '\uFEFF' + psScript, 'utf8');

try {
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile], {
    stdio: 'inherit',
    env: { ...process.env, ITCH_DIST: distPath, ITCH_ZIP: zipPath },
  });
  const sizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ [itch.io] Successfully created: itch_build.zip (${sizeMb} MB)`);
  console.log('👉 Upload this itch_build.zip file directly to itch.io (HTML5 Play in browser)!');
} catch (err) {
  console.error('❌ Failed to package itch_build.zip:', err);
  process.exit(1);
} finally {
  try { fs.unlinkSync(scriptFile); } catch (_) {}
}

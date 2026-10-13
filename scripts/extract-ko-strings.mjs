// AST 기반 한국어 문자열 추출기 (템플릿 ${expr} -> {N} 플레이스홀더)
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = path.resolve('src');
const OUT_DIR = path.resolve('scripts/i18n');
const CHUNK = 200;
const hangul = /[\uac00-\ud7af]/;

// 개발자 도구/이미지 프롬프트/번역 자체 파일은 제외
const EXCLUDE = [/CustomAssetStudioModal/, /data[\\/]prompts\.ts$/, /[\\/]i18n[\\/]/, /scenes[\\/]/, /PhaserGame/];

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !EXCLUDE.some(r => r.test(p))) files.push(p);
  }
})(ROOT);

const all = new Set();

function isConsoleCall(node) {
  return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'console';
}

function add(s) {
  if (!s) return;
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t || !hangul.test(t)) return;
  all.add(t);
}

// 템플릿 -> "정적{0}정적{1}" 패턴. 표현식 내부의 한글 리터럴은 별도 수집(방문 시 자동 추가)
function templatePattern(node) {
  let out = node.head.text;
  node.templateSpans.forEach((sp, i) => { out += `{${i}}` + sp.literal.text; });
  return out;
}

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  (function visit(node) {
    if (ts.isImportDeclaration(node) || isConsoleCall(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node.text);
    else if (ts.isTemplateExpression(node)) add(templatePattern(node));
    else if (ts.isJsxText(node)) add(node.getText());
    ts.forEachChild(node, visit);
  })(sf);
}

const list = [...all].sort();
fs.mkdirSync(path.join(OUT_DIR, 'chunks'), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, 'out'), { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'ko-all.json'), JSON.stringify(list, null, 1));
let n = 0;
for (let i = 0; i < list.length; i += CHUNK) {
  const name = `chunk_${String(n++).padStart(3, '0')}.json`;
  fs.writeFileSync(path.join(OUT_DIR, 'chunks', name), JSON.stringify(list.slice(i, i + CHUNK), null, 1));
}
console.log('files', files.length, 'unique', list.length, 'chunks', n, 'chars', list.join('').length);

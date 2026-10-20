// 公開するサイトを作り直し、壊れていないかを見る（CI の QA と同じ）。外部ライブラリなし。
// 使い方: node tools/check.js   （_site/ を作り直してから調べる。問題があれば終了コード 1）
// 見るもの: 記事ごとのページがあるか・記事どうしのリンクと画像の行き先がサイトの中にあるか・
//           変換し残し（data-file）が無いか・CSP があるか・フィードの記事数。
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, '_site');

execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });

const bad = [];
const dir = path.join(ROOT, 'posts');
const ids = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => /^[0-9a-f]{32}\.md$/.test(f)).map(f => f.slice(0, 32));
const pages = ['index.html', ...ids.map(id => id + '.html')];
for (const p of pages) {
  const file = path.join(OUT, p);
  if (!fs.existsSync(file)) { bad.push(`${p}: できていない`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('Content-Security-Policy')) bad.push(`${p}: CSP が無い`);
  if (html.includes('data-file=')) bad.push(`${p}: 画像の変換し残し（data-file）がある`);
  for (const [, href] of html.matchAll(/<a href="([0-9a-f]{32}\.html)"/g))
    if (!fs.existsSync(path.join(OUT, href))) bad.push(`${p}: 記事へのリンク先 ${href} が無い`);
  for (const [, src] of html.matchAll(/<img src="(files\/[^"]+)"/g))
    if (!fs.existsSync(path.join(OUT, decodeURIComponent(src)))) bad.push(`${p}: 画像 ${src} が無い`);
}
const feed = fs.existsSync(path.join(OUT, 'feed.xml')) ? fs.readFileSync(path.join(OUT, 'feed.xml'), 'utf8') : '';
const entries = (feed.match(/<entry>/g) || []).length;
if (entries !== ids.length) bad.push(`feed.xml: 記事 ${ids.length} 本に対して entry が ${entries} 個`);

const strays = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => f !== '.gitkeep' && !/^[0-9a-f]{32}\.md$/.test(f));
if (strays.length) console.log(`⚠️ posts/ に記事にならないファイルがある（メモアプリ以外が置いた？）: ${strays.join(' ')}`);

if (bad.length) { console.log(`❌ ${bad.length} 件\n` + bad.map(b => '- ' + b).join('\n')); process.exit(1); }
console.log(`✅ ${pages.length} ページとフィードを確かめた`);

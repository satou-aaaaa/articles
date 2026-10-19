// posts/*.md（メモアプリが書き出した公開記事）から、公開するサイト _site/ を作る。外部ライブラリなし。
// 使い方: node tools/build.js   （_site/ を作り直す）
'use strict';
const fs = require('fs'), path = require('path');
const { md, setPages } = require('./md.js');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, '_site');
const SITE = 'satou の記事';
const BASE = 'https://satou-aaaaa.github.io/articles/';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function parse(text){
  text = text.replace(/\r\n?/g, '\n'); const meta = {}; let body = text;
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4);
    if (end > 0) {
      for (const l of text.slice(4, end).split('\n')) { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
      body = text.slice(end + 4).replace(/^[^\n]*\n/, '');
    }
  }
  meta.title = meta.title || '無題'; return { meta, body };
}
const day = s => (s || '').slice(0, 10);
const desc = body => body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*`|_~-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

const CSS = `:root{--bg:#fbfbfa;--text:#1f2328;--muted:#6b7079;--line:#e3e4e6;--accent:#0f766e;--code:#f2f2f0}
@media (prefers-color-scheme:dark){:root{--bg:#191a1c;--text:#e7e8ea;--muted:#9a9ea6;--line:#34363b;--accent:#2dd4bf;--code:#2a2c30}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.8 system-ui,"Segoe UI","Yu Gothic UI","Hiragino Sans",sans-serif}
a{color:var(--accent)}
.wrap{max-width:760px;margin:0 auto;padding:24px 16px 80px}
header.site{border-bottom:1px solid var(--line)}header.site .wrap{padding:12px 16px}header.site a{color:var(--text);text-decoration:none;font-weight:700}
h1.t{font-size:28px;line-height:1.35;margin:12px 0 4px}.date{color:var(--muted);font-size:13px}
.list a{display:block;padding:14px 0;border-bottom:1px solid var(--line);text-decoration:none;color:inherit}.list b{display:block;font-size:17px}.list small{color:var(--muted)}
.md{word-break:break-word}.md h1{font-size:1.5em}.md h2{font-size:1.3em;margin-top:1.6em}.md h3{font-size:1.1em}
.md img{max-width:100%;height:auto;border-radius:4px}.md blockquote{margin:.8em 0;padding:4px 14px;border-left:3px solid var(--line);color:var(--muted)}
.md pre{background:var(--code);border-radius:6px;padding:10px 12px;overflow:auto;font-size:14px}.md code{background:var(--code);border-radius:4px;padding:0 4px;font-size:.9em}.md pre code{background:none;padding:0}
.md table{border-collapse:collapse;display:block;overflow:auto}.md th,.md td{border:1px solid var(--line);padding:4px 8px}.md hr{border:none;border-top:1px solid var(--line)}
.md li.task{list-style:none;margin-left:-1.3em}.md li.task input{margin-right:6px}
footer{color:var(--muted);font-size:12px;border-top:1px solid var(--line)}footer .wrap{padding:16px}`;

function page({ title, description, body, feed }){
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>${description ? `\n<meta name="description" content="${esc(description)}">` : ''}
<meta property="og:title" content="${esc(title)}">${description ? `\n<meta property="og:description" content="${esc(description)}">` : ''}
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https: data:; style-src 'unsafe-inline'; script-src 'none'; base-uri 'none'">
${feed ? `<link rel="alternate" type="application/atom+xml" href="feed.xml" title="${esc(SITE)}">\n` : ''}<style>${CSS}</style></head>
<body><header class="site"><div class="wrap"><a href="./">${esc(SITE)}</a></div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">${esc(SITE)}・<a href="feed.xml">フィード</a></div></footer></body></html>
`;
}

function build(){
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const dir = path.join(ROOT, 'posts');
  const posts = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => /^[0-9a-f]{32}\.md$/.test(f)).map(f => {
    const { meta, body } = parse(fs.readFileSync(path.join(dir, f), 'utf8')); return { id: f.slice(0, 32), meta, body };
  }).sort((a, b) => String(b.meta.created || b.meta.updated).localeCompare(String(a.meta.created || a.meta.updated)));
  setPages(new Map(posts.map(p => [p.id, p])));
  for (const p of posts) {
    const html = md(p.body)
      .replace(/<a class="page missing" href="#[0-9a-f]{32}">([\s\S]*?)<\/a>/g, '$1')
      .replace(/<a class="page" href="#([0-9a-f]{32})">/g, '<a href="$1.html">')
      .replace(/<img data-file="\.\.\/files\/([^"]+)"/g, '<img src="files/$1" loading="lazy"')
      .replace(/<img data-file="[^"]*"/g, '<img')
      .replace(/<input type="checkbox"([^>]*)>/g, '<input type="checkbox" disabled$1>');
    const title = (p.meta.icon ? p.meta.icon + ' ' : '') + p.meta.title;
    const upd = p.meta.updated && day(p.meta.updated) !== day(p.meta.created) ? `（${esc(day(p.meta.updated))} 更新）` : '';
    fs.writeFileSync(path.join(OUT, p.id + '.html'), page({ title: `${p.meta.title} | ${SITE}`, description: desc(p.body),
      body: `<h1 class="t">${esc(title)}</h1><div class="date">${esc(day(p.meta.created || p.meta.updated))}${upd}</div><article class="md">${html}</article><p><a href="./">← 記事の一覧</a></p>` }));
  }
  fs.writeFileSync(path.join(OUT, 'index.html'), page({ title: SITE, feed: true,
    body: `<h1 class="t">${esc(SITE)}</h1><div class="list">${posts.map(p => `<a href="${p.id}.html"><b>${esc((p.meta.icon ? p.meta.icon + ' ' : '') + p.meta.title)}</b><small>${esc(day(p.meta.created || p.meta.updated))}・${esc(desc(p.body).slice(0, 60))}</small></a>`).join('') || '<p>まだ記事はありません。</p>'}</div>` }));
  const latest = posts.map(p => p.meta.updated || p.meta.created || '').sort().at(-1) || new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'feed.xml'), `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>${esc(SITE)}</title><link href="${BASE}"/><id>${BASE}</id><updated>${esc(latest)}</updated><author><name>satou</name></author>
${posts.map(p => `<entry><title>${esc(p.meta.title)}</title><link href="${BASE}${p.id}.html"/><id>${BASE}${p.id}.html</id><updated>${esc(p.meta.updated || p.meta.created)}</updated><summary>${esc(desc(p.body))}</summary></entry>`).join('\n')}
</feed>
`);
  if (fs.existsSync(path.join(ROOT, 'files'))) fs.cpSync(path.join(ROOT, 'files'), path.join(OUT, 'files'), { recursive: true });
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  console.log(`記事 ${posts.length} 本を _site/ に書きました`);
}
build();

// notes/index.html（satou-aaaaa/local-kanban）の ==md-begin== から ==md-end== までの写し。直すときは向こうを直してから写す。
// 本文の HTML はすべてエスケープする。
'use strict';
let pages = new Map(); const readOnly = true;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ================= Markdown を HTML に（すべてエスケープしてから組み立てる）=================
function safeHref(u){
  u = u.trim();
  const m = u.match(/^([0-9a-f]{32})\.md(#.*)?$/i);
  if (m) return { page: m[1].toLowerCase() };
  if (/^(https?:|mailto:)/i.test(u)) return { href: u };
  return null;
}
function inline(s){
  // コードを先に外す
  const codes = [];
  s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  let out = '', i = 0;
  const re = /(!?)\[([^\]\n]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(https?:\/\/[^\s<>()　]+[^\s<>().,;:!?、。）　])/g;
  let m;
  while ((m = re.exec(s))) {
    out += fmt(s.slice(i, m.index)); i = re.lastIndex;
    if (m[4]) { out += `<a href="${esc(m[4])}" target="_blank" rel="noopener noreferrer">${esc(m[4])}</a>`; continue; }
    const [, bang, label, url] = m;
    if (bang) {
      if (/^https?:/i.test(url)) out += `<img src="${esc(url)}" alt="${esc(label)}" loading="lazy" referrerpolicy="no-referrer">`;
      else out += `<img data-file="${esc(url)}" alt="${esc(label)}">`;
      continue;
    }
    const h = safeHref(url);
    if (!h) { out += fmt(label); continue; }
    if (h.page) { const p = pages.get(h.page); out += `<a class="page${p ? '' : ' missing'}" href="#${h.page}">${fmt(label || p?.meta.title || 'ページ')}</a>`; }
    else out += `<a href="${esc(h.href)}" target="_blank" rel="noopener noreferrer">${fmt(label)}</a>`;
  }
  out += fmt(s.slice(i));
  return out.replace(/\u0000(\d+)\u0000/g, (_, n) => `<code>${esc(codes[n])}</code>`);
}
function fmt(t){
  return esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/__([^_]+)__/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\u0000/g, '\u0000');
}
function md(src){
  const L = src.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  const indentOf = s => { const m = s.match(/^[ \t]*/)[0]; return m.replace(/\t/g, '    ').length; };
  const listRe = /^([ \t]*)([-*+]|\d+[.)])\s+(.*)$/;
  function block(lines, base){
    let html = '', k = 0, para = [];
    const flush = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
    while (k < lines.length) {
      const { t, n } = lines[k];
      let m;
      if (!t.trim()) { flush(); k++; continue; }
      if ((m = t.match(/^\s*(```|~~~)/))) {
        flush(); const fence = m[1]; const code = []; k++;
        while (k < lines.length && !lines[k].t.trim().startsWith(fence)) { code.push(lines[k].t); k++; }
        k++; html += `<pre><code>${esc(code.join('\n'))}</code></pre>`; continue;
      }
      if ((m = t.match(/^\s*(#{1,6})\s+(.*)$/))) { flush(); const lv = m[1].length; html += `<h${lv}>${inline(m[2])}</h${lv}>`; k++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(t)) { flush(); html += '<hr>'; k++; continue; }
      if (/^\s*>/.test(t)) {
        flush(); const q = [];
        while (k < lines.length && /^\s*>/.test(lines[k].t)) { q.push({ t: lines[k].t.replace(/^\s*>\s?/, ''), n: lines[k].n }); k++; }
        html += '<blockquote>' + block(q) + '</blockquote>'; continue;
      }
      if (/^\s*\|.*\|\s*$/.test(t) && k + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[k + 1].t)) {
        flush(); const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const head = cells(t); k += 2; let rows = '';
        while (k < lines.length && /^\s*\|.*\|\s*$/.test(lines[k].t)) { rows += '<tr>' + cells(lines[k].t).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; k++; }
        html += `<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`; continue;
      }
      if ((m = t.match(listRe))) {
        flush();
        const ind = indentOf(t), ordered = /\d/.test(m[2]);
        let items = '';
        while (k < lines.length) {
          const mm = lines[k].t.match(listRe);
          if (!mm || indentOf(lines[k].t) !== ind) break;
          const lineNo = lines[k].n; let text = mm[3]; k++;
          const sub = [];
          while (k < lines.length && (!lines[k].t.trim() ? (k + 1 < lines.length && indentOf(lines[k + 1].t) > ind) : indentOf(lines[k].t) > ind)) { sub.push(lines[k]); k++; }
          const minInd = Math.min(...sub.filter(x => x.t.trim()).map(x => indentOf(x.t)));
          const subLines = sub.map(x => ({ t: x.t.replace(/\t/g, '    ').slice(Math.min(minInd, indentOf(x.t))), n: x.n }));
          const task = text.match(/^\[([ xX])\]\s*(.*)$/);
          if (task) {
            const done = task[1] !== ' ';
            items += `<li class="task${done ? ' done' : ''}"><input type="checkbox" data-line="${lineNo}"${done ? ' checked' : ''}${readOnly ? ' disabled' : ''}><span>${inline(task[2])}</span>${sub.length ? block(subLines) : ''}</li>`;
          } else items += `<li>${inline(text)}${sub.length ? block(subLines) : ''}</li>`;
        }
        html += ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`; continue;
      }
      para.push(t.trim()); k++;
    }
    flush(); return html;
  }
  return block(L.map((t, n) => ({ t, n })));
}


module.exports = { md, setPages: m => { pages = m; } };

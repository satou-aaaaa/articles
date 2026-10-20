# articles（公開記事）

satou の記事。公開ページ：https://satou-aaaaa.github.io/articles/

メモアプリ（https://satou-aaaaa.github.io/local-kanban/notes/）で「公開する」の印を付けたページだけが、ここに書き出される。
**このリポジトリは公開。印を付けていないメモは入らない**（メモの本体は持ち主の非公開リポジトリにある）。

## 中身

| 場所 | 中身 |
| --- | --- |
| `posts/<ID>.md` | 公開記事（メモアプリが書く・消す。手で直さない。直すならメモアプリで直す） |
| `files/<ID>/` | 記事の画像（メモアプリが写す） |
| `tools/build.js`・`tools/md.js` | `posts/` から公開するサイトを作る。`md.js` はメモアプリ（local-kanban の notes/index.html）の Markdown 表示の写し |
| `tools/check.js` | サイトを作り直して、記事ページ・リンク・画像・フィードを調べる（CI の QA） |
| `.github/workflows/pages.yml` | main に入るたびにサイトを作って Pages に出す |
| `.github/workflows/` のほか | CI の共通部品（satou-aaaaa/shared-workflows）の呼び出し：QA・自動マージ・CI失敗Issue・死活監視・Lighthouse・CodeQL・秘密の検査など |

## 公開をやめるとき

メモアプリでそのページの「設定 → 公開する」の印を外す（`posts/` から消え、サイトからも消える）。
GitHub の履歴には残るので、出してはいけないものを出したときは、その記事を消したうえで satou に知らせる。

## 確かめ方

```bash
bash scripts/setup.sh   # 最初に一度
node tools/check.js && python3 -m http.server -d _site
```

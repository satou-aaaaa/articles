# AGENTS.md

satou の公開記事。メモアプリ（satou-aaaaa/local-kanban の notes/）が `posts/` と `files/` を書く。説明は README.md。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめる。入れる依存は無い。何度実行してもよい（Windows は Git Bash で）
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node tools/check.js   # サイトを作り直し、記事ページ・記事どうしのリンク・画像・フィードを見る（CI の QA と同じ）。_site/index.html が開けること
```

## 決まり

- `posts/`・`files/` は手で直さない（メモアプリの元のページと食い違う）。メモアプリは GitHub の API で main に直接書く。
  だから main の守りは「削除と force push の禁止」だけにする（PR 必須にすると書き出しが止まる）。
- 公開リポジトリ。メモのデータ・鍵（トークン）・非公開リポジトリの名前を入れない。
- `tools/md.js` は local-kanban の `notes/index.html` の `==md-begin==` から `==md-end==` の写し。向こうを直したら写す。
- 公開後の自動差し戻し（Post-deploy check）とリンク切れの検査（Link check）は入れない。差し戻すとメモアプリが書いた記事まで消え、記事の中のリンクはここでは直せないため。

## 公開

- GitHub Pages は `pages.yml`（Actions）で公開する。main に入るたび（メモアプリの書き出しも）に `tools/build.js` で作り直す。
- PR の QA が ✅ になると `automerge.yml` が自動でマージし、`pages.yml` を起こす。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品（CI失敗Issue・死活監視・Lighthouse・ブランチ片付け・自動マージ）は shared-workflows の共通部品を呼ぶ。
  リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md`（道具の置き換え）と `routines/without-claude.md` を読む。

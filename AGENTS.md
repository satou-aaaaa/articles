# AGENTS.md

satou の公開記事。メモアプリ（satou-aaaaa/local-kanban の notes/）が `posts/` と `files/` を書く。説明は README.md。

- `posts/`・`files/` は手で直さない（メモアプリの元のページと食い違う）。
- 公開リポジトリ。メモのデータ・鍵（トークン）・非公開リポジトリの名前を入れない。
- `tools/md.js` は local-kanban の `notes/index.html` の `==md-begin==` から `==md-end==` の写し。向こうを直したら写す。
- 確かめ方：`node tools/build.js` が通り、`_site/index.html` が開けること。

// index.js
const express = require('express');
const path = require('path');
const serveIndex = require('serve-index');

const app = express();
const PORT = process.env.PORT || 3000;

// 配信したいルートディレクトリ（このファイルが置いてあるディレクトリ）
const PUBLIC_DIR = path.resolve(__dirname);

// 静的ファイル配信（HTML, 画像, CSS, JS など）
app.use(express.static(PUBLIC_DIR, {
  index: 'index.html',      // ルートアクセスで index.html を優先
  extensions: ['html']      // 拡張子を省略しても .html を探す
}));

// ディレクトリリスティングを有効化（アイコン付き・詳細表示）
app.use('/', serveIndex(PUBLIC_DIR, {
  icons: true,
  view: 'details' // 'tiles' も可
}));

// 404ハンドラ（任意）
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}/`);
  console.log(`Serving directory: ${PUBLIC_DIR}`);
});
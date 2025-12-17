# Company Wiki (GAS + HTML)

Google Apps Script (GAS) と Google スプレッドシートを利用した、シンプルかつ高機能な社内Wikiシステムです。
リッチテキスト（Quill.js）と Markdown の両方に対応し、画像や動画の埋め込みも可能です。

## 特徴
*   **サーバーレス**: GASとスプレッドシートのみで動作（完全無料）。
*   **デュアルモード**: 誰でも書ける「リッチテキスト」と、エンジニア向けの「Markdown」を選択可能。
*   **メディア対応**: 画像や動画をドラッグ＆ドロップで挿入（Googleドライブに自動保存）。
*   **セキュア**: Google Workspace アカウント認証を利用。

## セットアップ
詳細な手順は [SETUP.md](./SETUP.md) を参照してください。

1.  **スプレッドシート作成**: データベースとなるシートを用意します。
2.  **ドライブフォルダ作成**: 画像保存用のフォルダを用意します。
3.  **Config設定**: `src/Config.gs` にIDを設定します。
4.  **初期化**: `setup()` 関数を実行してテーブルを作成します。
5.  **デプロイ**: ウェブアプリとしてデプロイします。

## ファイル構成
*   `src/Code.gs`: バックエンドロジック (API)
*   `src/index.html`: Webアプリのエントリーポイント
*   `src/css.html`: スタイル定義 (Premium Design System)
*   `src/js.html`: フロントエンドロジック (SPA, Quill, API Client)

## 開発
```bash
# ローカルで編集する場合（clasp利用）
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "Company Wiki" --rootDir ./src
clasp push
```

## ライセンス
MIT

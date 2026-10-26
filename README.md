# Harmonica Flow

TOMBO 3121 C調の21穴複音ハーモニカを、落下バーに合わせて練習するNext.jsアプリです。

## 公開サイト

[https://harmonica-trainer.vercel.app/](https://harmonica-trainer.vercel.app/)

## スマホで使う

上の公開サイトをスマホのブラウザで開きます。結婚行進曲はそのまま再生できます。

「100万回の『I love you』」を使うには、購入したメロディMIDIをスマホの「ファイル」アプリに保存しておき、曲を選択して「MIDIファイルを選ぶ」を押してください。初回読み込み後は、そのブラウザの端末内ストレージに保存されます。MIDIはサーバーへ送信されません。小さな画面では横向き表示がおすすめです。

## ローカル開発

```bash
npm ci
make dev
```

表示された `http://localhost:3000` などのURLを開きます。同じWi-Fiのスマホでは、開発サーバーが表示する Network URL を開けます。終了は `make stop` です。

## Vercelへの更新

Vercel CLIでリンク済みです。変更を反映するには、ビルドと検査の後、以下を実行します。

```bash
npm run lint
npm run build
vercel deploy --dry --json --scope jp-transcendence --project harmonica-trainer
vercel deploy --prod --yes --scope jp-transcendence --project harmonica-trainer
```

購入MIDIと、それから抽出した譜面JSONは `.gitignore` と `.vercelignore` の対象です。これらをGitやVercelの公開ファイルに追加しないでください。

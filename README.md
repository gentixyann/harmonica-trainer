# Harmonica Flow

TOMBO 3121 C調の21穴複音ハーモニカを、落下バーに合わせて練習するNext.jsアプリです。

## 公開サイト

[https://harmonica-trainer.vercel.app/](https://harmonica-trainer.vercel.app/)

## スマホで使う

上の公開サイトをスマホのブラウザで開きます。結婚行進曲と「100万回の『I love you』」の両方を、MIDIファイルの選択なしで練習できます。小さな画面では横向き表示がおすすめです。

「100万回の『I love you』」のMIDIは、公開配信と改変の許可を得たものを `public/songs/million-i-love-you.mid` に配置しています。各ブラウザは公開サイトから同じMIDIを読み込み、C調21穴向けの譜面と再生音を生成します。データベースは使いません。

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

公開許可を得た `public/songs/million-i-love-you.mid` のみ、GitとVercelへ含めます。ほかのMIDIと、以前の端末内変換から生成した譜面JSONは `.gitignore` と `.vercelignore` の対象です。Gitで公開するMIDIは誰でも取得できるため、追加する曲も公開配信の許可を確認してください。

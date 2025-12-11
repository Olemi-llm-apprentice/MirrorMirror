# MirrorMirror 🪞✨

音声AIがあなたにぴったりのコーディネートを提案するファッションコンシェルジュアプリ

![MirrorMirror](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)

## ✨ 特徴

- **音声操作対応**: ElevenLabs AIと自然な音声対話
- **パーソナライズ**: ユーザーの写真からコーディネート提案
- **5つのスタイル**: カジュアル / ビジネス / ストリート / モード / キレイめ
- **店舗案内**: 近くの取扱店舗をマップ表示

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 16 + React 19 + TypeScript
- **音声AI**: ElevenLabs Conversational AI
- **画像生成**: Google Gemini 2.0 Flash
- **スタイリング**: Tailwind CSS

## 📦 セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/MirrorMirror.git
cd MirrorMirror
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルを作成:

```env
# ElevenLabs Agent ID (必須)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# ElevenLabs API Key (推奨 - セキュリティ強化)
# 設定しない場合は Public Agent モードで動作
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google Gemini API Key (必須)
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **セキュリティ**: 本番環境では `ELEVENLABS_API_KEY` を設定して署名付きURL方式を使用することを強く推奨します。

### 4. 開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 でアプリにアクセス

## 🎤 ElevenLabs Agent の設定

1. [ElevenLabs](https://elevenlabs.io/) でアカウント作成
2. Conversational AI → Create Agent
3. System Prompt を設定（`docs/ELEVENLABS_AGENT_IMPLEMENTATION.md` 参照）
4. Client Tools を追加:
   - `setGender`
   - `showImageInputUI`
   - `generateCoordinates`
   - `selectGenre`
   - `selectCoordinate`
   - `showShopMap`
   - `goBack`
5. Agent ID をコピーして環境変数に設定

## 📱 ハッカソンデモ（Cloudflare Tunnel）

### 簡単起動（推奨）

```powershell
# Windows
.\scripts\start-demo.bat

# または PowerShell
.\scripts\start-demo.ps1
```

### 手動起動

```powershell
# 1. cloudflared インストール（初回のみ）
winget install cloudflare.cloudflared

# 2. ターミナル1: Next.js起動
npm run dev

# 3. ターミナル2: Tunnel起動
npm run tunnel
```

表示された `https://xxx-xxx-xxx.trycloudflare.com` をスマホで開く

> 💡 **ヒント**: Cloudflare Tunnel はログイン不要で即座に公開URLが発行されます

## 🖥️ 画面構成

| 画面 | 説明 |
|------|------|
| 会話画面 | 初期画面、性別選択、音声対話 |
| 画像入力 | カメラ撮影/ファイル選択 |
| ローディング | コーデ生成待機 |
| ジャンル選択 | 5ジャンルのカルーセル |
| コーデ選択 | 選択ジャンルの5コーデ |
| アイテム詳細 | コーデの使用アイテム一覧 |
| 店舗マップ | 取扱店舗の一覧 |

## 🔧 プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   ├── generate-coordinates/  # コーデ生成API
│   │   ├── generate-remaining/    # 追加コーデ生成API
│   │   ├── items/[itemId]/shops/  # 店舗検索API
│   │   └── placeholder/           # プレースホルダー画像
│   ├── globals.css                # グローバルスタイル
│   ├── layout.tsx                 # レイアウト
│   └── page.tsx                   # メインアプリ
├── components/
│   ├── ConversationPanel.tsx      # 会話画面
│   ├── ImageInputView.tsx         # 画像入力
│   ├── LoadingView.tsx            # ローディング
│   ├── GenreListView.tsx          # ジャンル選択
│   ├── CoordinateListView.tsx     # コーデ選択
│   ├── ItemDetailsView.tsx        # アイテム詳細
│   ├── ShopMapView.tsx            # 店舗マップ
│   └── VoicePanel.tsx             # 音声パネル
└── types/
    └── index.ts                   # 型定義
```

## 📝 音声コマンド例

- 「メンズで」→ 性別設定
- 「写真を撮って」→ 画像入力画面へ
- 「カジュアルを見せて」→ ジャンル選択
- 「1番目を見せて」→ コーデ選択
- 「店舗を探して」→ 店舗マップ表示
- 「戻って」→ 前の画面へ

## 📄 ライセンス

MIT License

---

Made with ❤️ by MirrorMirror Team


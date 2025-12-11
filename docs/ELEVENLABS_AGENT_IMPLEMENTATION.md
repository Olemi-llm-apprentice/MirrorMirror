# ElevenLabs Agent 実装ガイド

このドキュメントは、おしゃれAIの音声エージェント実装を **他のLLMが一発で理解・実装できる** ように詳細に記述したものです。

---

## 目次

1. [システム概要](#1-システム概要)
2. [アーキテクチャ](#2-アーキテクチャ)
3. [画面遷移フロー](#3-画面遷移フロー)
4. [ElevenLabs Agent 設定](#4-elevenlabs-agent-設定)
5. [Client Tools 完全リファレンス](#5-client-tools-完全リファレンス)
6. [実装コード例](#6-実装コード例)
7. [セットアップ手順](#7-セットアップ手順)

---

## 1. システム概要

### 1.1 アプリの目的

**おしゃれAI** は、音声AIコンシェルジュがユーザーと対話しながら：
1. ユーザーの好み（性別、スタイル）をヒアリング
2. ユーザーの写真をアップロードしてもらう
3. AIがコーディネート画像を生成
4. ジャンル別にコーデを提案
5. アイテム詳細・店舗案内まで導く

### 1.2 技術スタック

```
フロントエンド: Next.js 15 + React 19 + TypeScript
音声AI: ElevenLabs Conversational AI (Agent)
画像生成: Google Gemini 2.5 Flash
スタイリング: Tailwind CSS
```

### 1.3 核心コンセプト

**音声だけで全操作が完結する**
- ユーザーは音声で指示（「メンズで」「カジュアルを見せて」「戻って」）
- AIが Client Tools を呼び出して画面を自動遷移
- 手動ボタン操作もフォールバックとして併用可能

---

## 2. アーキテクチャ

### 2.1 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                            │
│                    （音声 + タッチ）                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   React フロントエンド                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              useConversation() Hook                   │ │
│  │  - 音声認識（ASR）                                    │ │
│  │  - 音声合成（TTS）                                    │ │
│  │  - Client Tools 実行                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              画面状態管理 (useState)                  │ │
│  │  currentView: "conversation" | "image-input" | ...    │ │
│  └───────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              UI コンポーネント                        │ │
│  │  ConversationPanel | ImageInputView | GenreListView   │ │
│  │  CoordinateListView | ItemDetailsView | ShopMapView   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
          WebSocket 接続  │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               ElevenLabs Agent Platform                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │  ASR    │→│   LLM   │→│   TTS   │→│ Tool Router │   │
│  │(Scribe) │  │(GPT-4o) │  │ (Voice) │  │             │   │
│  └─────────┘  └─────────┘  └─────────┘  └──────┬──────┘   │
│                                                 │           │
│                    System Prompt + Tools 定義   │           │
└─────────────────────────────────────────────────┼───────────┘
                                                  │
                          Client Tool 呼び出し    │
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│              フロントエンドの clientTools                   │
│  setGender() | showImageInputUI() | selectGenre() | ...    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

```
1. ユーザー発話 → ElevenLabs ASR → テキスト化
2. テキスト → ElevenLabs LLM → 意図解析 + Tool 決定
3. Tool 呼び出し → フロントエンドの clientTools 実行
4. clientTools → React State 更新 → 画面遷移
5. Tool 結果 → ElevenLabs LLM → 応答生成
6. 応答 → ElevenLabs TTS → 音声再生
```

---

## 3. 画面遷移フロー

### 3.1 画面一覧

| View ID | 画面名 | 説明 |
|---------|--------|------|
| `conversation` | 会話画面 | 初期画面。性別選択、音声対話 |
| `image-input` | 画像入力 | カメラ撮影/ファイル選択 |
| `loading` | 生成中 | コーデ生成待機画面 |
| `genre-list` | ジャンル選択 | 5ジャンルのカルーセル |
| `coordinate-list` | コーデ選択 | 選択ジャンルの5コーデ |
| `item-details` | アイテム詳細 | コーデの使用アイテム一覧 |
| `shop-map` | 店舗マップ | 取扱店舗の一覧 |

### 3.2 遷移図（ASCII）

```
                    ┌─────────────────┐
                    │  conversation   │ ← 初期画面
                    │   (会話画面)    │
                    └────────┬────────┘
                             │
        性別選択完了 + showImageInputUI()
                             │
                             ▼
                    ┌─────────────────┐
                    │   image-input   │
                    │  (画像入力)     │
                    └────────┬────────┘
                             │
              画像アップロード完了
                             │
                             ▼
                    ┌─────────────────┐
                    │     loading     │
                    │   (生成中)      │
                    └────────┬────────┘
                             │
              generateCoordinates() 完了
                             │
                             ▼
                    ┌─────────────────┐
                    │   genre-list    │ ◄──────────────┐
                    │ (ジャンル選択)  │                │
                    └────────┬────────┘                │
                             │                         │
               selectGenre(genre_id)                   │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │ coordinate-list │ ◄─────────┐   │
                    │  (コーデ選択)   │           │   │
                    └────────┬────────┘           │   │
                             │                    │   │
          selectCoordinate(index)                 │   │
                             │                    │   │
                             ▼                    │   │
                    ┌─────────────────┐           │   │
                    │  item-details   │───────────┘   │
                    │ (アイテム詳細)  │  goBack()     │
                    └────────┬────────┘               │
                             │                        │
               showShopMap(item_id)                   │
                             │                        │
                             ▼                        │
                    ┌─────────────────┐               │
                    │    shop-map     │───────────────┘
                    │  (店舗マップ)   │  goBack()
                    └─────────────────┘
```

### 3.3 遷移トリガー

| 現在の画面 | トリガー | 次の画面 | 呼び出すTool |
|------------|----------|----------|--------------|
| conversation | 性別選択完了 + 「写真撮って」 | image-input | `showImageInputUI()` |
| image-input | 画像アップロード完了 | loading | 自動遷移 |
| loading | 生成完了 | genre-list | `generateCoordinates()` の結果 |
| genre-list | 「カジュアルを見せて」 | coordinate-list | `selectGenre("casual")` |
| coordinate-list | 「1番目を見せて」 | item-details | `selectCoordinate(0)` |
| item-details | 「店舗を探して」 | shop-map | `showShopMap(item_id)` |
| 任意 | 「戻って」 | 前の画面 | `goBack()` |

---

## 4. ElevenLabs Agent 設定

### 4.1 Agent 基本設定

```json
{
  "name": "おしゃれAI",
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "（下記のSystem Prompt）"
      },
      "first_message": "こんにちは、おしゃれAIです！今日はどんなファッションを探していますか？",
      "language": "ja"
    },
    "tts": {
      "model_id": "eleven_multilingual_v2"
    }
  },
  "platform_settings": {
    "auth": {
      "enable_auth": false
    }
  }
}
```

### 4.2 System Prompt（完全版）

```
あなたは「おしゃれAI」というファッションコンシェルジュです。
ユーザーの好みをヒアリングし、最適なコーディネートを提案します。

## 役割
- 親しみやすく、フレンドリーな口調で話す
- ファッションへの情熱が伝わるように
- 褒め上手で、押し売りはしない
- 簡潔に話す（1回の発話は3文以内）

## 会話フロー（この順序で進める）

### Phase 1: ヒアリング
1. 挨拶（first_message で済み）
2. 性別を確認
   - 「メンズ」「男性」「彼氏用」→ setGender("mens") を呼ぶ
   - 「レディース」「女性」「私用」→ setGender("ladies") を呼ぶ
   - 不明な場合は「メンズとレディース、どちらをお探しですか？」と聞く

### Phase 2: 写真取得
性別が確定したら：
「では、あなたの写真を撮影またはアップロードしてください」
→ showImageInputUI() を呼ぶ
→ 結果を待つ（success: true, image_id: "xxx"）

### Phase 3: コーデ生成
写真がアップロードされたら：
「素敵ですね！コーディネートを生成しています...」
→ generateCoordinates() を呼ぶ（gender と image_id を渡す）
→ 生成中は「少々お待ちください」などと話す

### Phase 4: ジャンル選択
生成完了後：
「5つのスタイルができました！カジュアル、ビジネス、ストリート、モード、キレイめ、どれが気になりますか？」
→ ユーザーの選択を聞いて selectGenre() を呼ぶ
   - 「カジュアル」→ selectGenre("casual")
   - 「ビジネス」→ selectGenre("business")
   - 「ストリート」→ selectGenre("street")
   - 「モード」→ selectGenre("mode")
   - 「キレイめ」「エレガント」→ selectGenre("elegant")

### Phase 5: コーデ選択
「このジャンルには5つのコーデがあります。1番から5番、どれが気になりますか？」
→ ユーザーの選択を聞いて selectCoordinate() を呼ぶ
   - 「1番」「最初」→ selectCoordinate(0)
   - 「2番」→ selectCoordinate(1)
   - 数字を0始まりのインデックスに変換

### Phase 6: アイテム詳細
Tool の結果から items と total_price を取得
「このコーデは〇点のアイテムで、合計約〇〇円です」
→ 各アイテムについて簡単に説明

### Phase 7: 店舗案内（ユーザーが希望した場合）
「近くの取扱店舗を探しましょうか？」
→ ユーザーが希望したら showShopMap() を呼ぶ

## ナビゲーション
- 「戻って」「前の画面」「やり直し」→ goBack() を呼ぶ
- 「最初から」→ goBack() を複数回呼んで conversation に戻る

## Dynamic Variables（現在の状態を参照可能）
- {{gender}}: 設定済みの性別（"mens" | "ladies" | ""）
- {{user_image_id}}: アップロード済み画像ID

## 重要なルール
1. Tool を呼んだら、その結果を待ってから次の発話をする
2. ユーザーの発言を復唱しない（「メンズですね」ではなく「了解です！」）
3. 画面遷移後は新しい画面の説明を簡潔にする
4. エラーが発生したら「もう一度お試しください」と案内
```

### 4.3 Dynamic Variables

| 変数名 | 型 | 説明 | 初期値 |
|--------|-----|------|--------|
| `gender` | string | 性別 "mens" \| "ladies" | "" |
| `user_image_id` | string | アップロード画像ID | "" |

フロントエンドで `conversation.startSession()` 時に渡す：

```typescript
await conversation.startSession({
  agentId: "YOUR_AGENT_ID",
  clientTools,
  dynamicVariables: {
    gender: gender || "",
    user_image_id: userImageId || "",
  },
});
```

---

## 5. Client Tools 完全リファレンス

### 5.1 Tool 一覧

| Tool名 | 説明 | パラメータ | 戻り値 |
|--------|------|------------|--------|
| `setGender` | 性別を設定 | `gender: "mens" \| "ladies"` | `{ success, gender, message }` |
| `showImageInputUI` | 画像入力画面を表示 | なし | `{ success, image_id }` |
| `generateCoordinates` | コーデを生成 | `gender, image_id` | `{ success, generated_count, genre_previews }` |
| `selectGenre` | ジャンルを選択 | `genre_id` | `{ success, count }` |
| `selectCoordinate` | コーデを選択 | `coordinate_index` | `{ success, coordinate_name, items_count, total_price }` |
| `showShopMap` | 店舗マップを表示 | `item_id` | `{ displayed, shop_count, nearest_shop, distance }` |
| `goBack` | 前の画面に戻る | なし | `{ success, current_view }` |

### 5.2 各Tool の詳細仕様

#### 5.2.1 setGender

**目的**: ユーザーの性別を設定し、React State を更新

**ElevenLabs 側の定義**:
```json
{
  "name": "setGender",
  "description": "ユーザーの性別を設定します。メンズまたはレディースを指定してください。",
  "parameters": {
    "type": "object",
    "properties": {
      "gender": {
        "type": "string",
        "enum": ["mens", "ladies"],
        "description": "性別（mens=メンズ, ladies=レディース）"
      }
    },
    "required": ["gender"]
  }
}
```

**フロントエンド実装**:
```typescript
setGender: async ({ gender: g }: { gender: "mens" | "ladies" }) => {
  setGender(g);  // React State 更新
  const label = g === "mens" ? "メンズ" : "レディース";
  return { 
    success: true, 
    gender: g, 
    message: `${label}スタイルに設定しました` 
  };
}
```

**呼び出し例**:
- ユーザー: 「メンズで探して」
- Agent: setGender({ gender: "mens" }) を呼び出し
- 結果: `{ success: true, gender: "mens", message: "メンズスタイルに設定しました" }`

---

#### 5.2.2 showImageInputUI

**目的**: 画像入力画面に遷移し、ユーザーが画像をアップロードするまで待機

**ElevenLabs 側の定義**:
```json
{
  "name": "showImageInputUI",
  "description": "カメラ撮影またはファイル選択のUIを表示します。ユーザーに写真を撮影またはアップロードしてもらいます。",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

**フロントエンド実装**:
```typescript
// Promise resolver を保持する ref
const imageUploadResolverRef = useRef<((result: { success: boolean; image_id: string }) => void) | null>(null);

// Client Tool
showImageInputUI: async () => {
  setCurrentView("image-input");  // 画面遷移
  
  // Promise で画像アップロード完了を待つ
  return new Promise<{ success: boolean; image_id: string }>((resolve) => {
    imageUploadResolverRef.current = resolve;
  });
}

// 画像アップロード完了時に呼ばれるコールバック
const handleImageUploaded = (imageId: string, base64?: string, mimeType?: string) => {
  setUserImageId(imageId);
  
  // Promise を resolve
  if (imageUploadResolverRef.current) {
    imageUploadResolverRef.current({ success: true, image_id: imageId });
    imageUploadResolverRef.current = null;
  }
};
```

**重要**: この Tool は **非同期で完了を待つ** 設計。ユーザーが画像をアップロードするまで結果を返さない。

---

#### 5.2.3 generateCoordinates

**目的**: APIを呼び出してコーデ画像を生成し、genre-list 画面に遷移

**ElevenLabs 側の定義**:
```json
{
  "name": "generateCoordinates",
  "description": "ユーザーの写真を元に5ジャンルの代表コーディネート画像を生成します。",
  "parameters": {
    "type": "object",
    "properties": {
      "gender": { 
        "type": "string", 
        "description": "性別（mens/ladies）" 
      },
      "image_id": { 
        "type": "string", 
        "description": "アップロードされた画像ID" 
      }
    },
    "required": ["gender", "image_id"]
  }
}
```

**フロントエンド実装**:
```typescript
generateCoordinates: async ({ gender: g, image_id }: { gender: string; image_id: string }) => {
  setCurrentView("loading");  // ローディング画面に遷移
  
  try {
    const res = await fetch("/api/generate-coordinates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender: g,
        image_id,
        image_base64: userImageBase64,  // 実際の画像データ
        mime_type: userImageMimeType,
      }),
    });
    
    const data = await res.json();
    
    if (data.genre_previews) {
      setGenrePreviews(data.genre_previews);  // データを保存
      setCurrentView("genre-list");  // ジャンル選択画面に遷移
      
      return {
        success: true,
        generated_count: data.genre_previews.length,
        genre_previews: data.genre_previews,
      };
    }
    
    return { success: false, error: "生成に失敗しました" };
  } catch (error) {
    setCurrentView("conversation");
    return { success: false, error: "生成中にエラーが発生しました" };
  }
}
```

**戻り値の genre_previews 構造**:
```typescript
interface GenrePreview {
  genre_id: "casual" | "business" | "street" | "mode" | "elegant";
  genre_name: string;       // "カジュアル"
  coordinate_id: string;    // "coord-xxx"
  cover_image: string;      // 画像URL
  preview_image_url: string; // 生成された画像URL
  tagline: string;          // 説明文
}
```

---

#### 5.2.4 selectGenre

**目的**: 選択されたジャンルのコーデ一覧を取得し、coordinate-list 画面に遷移

**ElevenLabs 側の定義**:
```json
{
  "name": "selectGenre",
  "description": "ユーザーが選択したジャンルのコーディネート一覧を表示します。",
  "parameters": {
    "type": "object",
    "properties": {
      "genre_id": {
        "type": "string",
        "enum": ["casual", "business", "street", "mode", "elegant"],
        "description": "ジャンルID"
      }
    },
    "required": ["genre_id"]
  }
}
```

**フロントエンド実装**:
```typescript
selectGenre: async ({ genre_id }: { genre_id: string }) => {
  setCurrentView("loading");
  
  try {
    const res = await fetch("/api/generate-remaining", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre_id,
        image_id: userImageId,
        gender,
      }),
    });
    
    const data = await res.json();
    setCoordinates(data.coordinates || []);
    setSelectedGenreId(genre_id);
    setCurrentView("coordinate-list");
    
    return { success: true, count: data.coordinates?.length || 0 };
  } catch {
    setCurrentView("genre-list");
    return { success: false, error: "コーデ取得に失敗しました" };
  }
}
```

---

#### 5.2.5 selectCoordinate

**目的**: 選択されたコーデの詳細を表示し、item-details 画面に遷移

**ElevenLabs 側の定義**:
```json
{
  "name": "selectCoordinate",
  "description": "ユーザーが選択したコーディネートの詳細を表示します。",
  "parameters": {
    "type": "object",
    "properties": {
      "coordinate_index": {
        "type": "integer",
        "description": "コーディネートのインデックス（0-4）。1番目=0, 2番目=1..."
      }
    },
    "required": ["coordinate_index"]
  }
}
```

**フロントエンド実装**:
```typescript
selectCoordinate: async ({ coordinate_index }: { coordinate_index: number }) => {
  const coord = coordinates[coordinate_index];
  
  if (!coord) {
    return { success: false, error: "コーデが見つかりません" };
  }
  
  setSelectedCoordinate(coord);
  setItems(coord.items || []);
  setCurrentView("item-details");
  
  const total = (coord.items || []).reduce((sum, item) => sum + item.price, 0);
  
  return {
    success: true,
    coordinate_name: coord.name,
    items_count: coord.items?.length || 0,
    total_price: total,
  };
}
```

**注意**: ユーザーは「1番目」と言うが、インデックスは0から始まる。Agent の System Prompt で変換ルールを定義している。

---

#### 5.2.6 showShopMap

**目的**: アイテムの取扱店舗を取得し、shop-map 画面に遷移

**ElevenLabs 側の定義**:
```json
{
  "name": "showShopMap",
  "description": "アイテムの取扱店舗をマップ上に表示します。",
  "parameters": {
    "type": "object",
    "properties": {
      "item_id": { 
        "type": "string", 
        "description": "アイテムID" 
      }
    },
    "required": ["item_id"]
  }
}
```

**フロントエンド実装**:
```typescript
showShopMap: async ({ item_id }: { item_id: string }) => {
  // 位置情報を取得
  let location = userLocation;
  if (!location) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(location);
    } catch {
      location = { lat: 35.658034, lng: 139.701636 }; // デフォルト: 渋谷駅
    }
  }

  try {
    const res = await fetch(`/api/items/${item_id}/shops?lat=${location.lat}&lng=${location.lng}`);
    const data = await res.json();
    
    setShops(data.shops || []);
    setCurrentView("shop-map");
    
    const nearest = data.shops?.[0];
    return {
      displayed: true,
      shop_count: data.shops?.length || 0,
      nearest_shop: nearest?.name,
      distance: nearest?.walkingMinutes ? `徒歩${nearest.walkingMinutes}分` : null,
    };
  } catch {
    return { displayed: false, error: "店舗情報取得に失敗しました" };
  }
}
```

---

#### 5.2.7 goBack

**目的**: 前の画面に戻る

**ElevenLabs 側の定義**:
```json
{
  "name": "goBack",
  "description": "前の画面に戻ります。",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

**フロントエンド実装**:
```typescript
goBack: async () => {
  // 画面ごとの戻り先を定義
  const viewHistory: Record<AppView, AppView> = {
    "conversation": "conversation",    // 会話画面は戻れない
    "image-input": "conversation",
    "loading": "conversation",
    "genre-list": "conversation",
    "coordinate-list": "genre-list",
    "item-details": "coordinate-list",
    "shop-map": "item-details",
  };
  
  const prevView = viewHistory[currentView];
  setCurrentView(prevView);
  
  return { success: true, current_view: prevView };
}
```

---

## 6. 実装コード例

### 6.1 完全な useConversation 初期化

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";

export default function VoiceApp() {
  // ===== 状態管理 =====
  const [currentView, setCurrentView] = useState<AppView>("conversation");
  const [gender, setGender] = useState<Gender | null>(null);
  const [userImageId, setUserImageId] = useState<string | null>(null);
  const [genrePreviews, setGenrePreviews] = useState<GenrePreview[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  
  // Promise resolver
  const imageUploadResolverRef = useRef<((result: { success: boolean; image_id: string }) => void) | null>(null);

  // ===== Client Tools 定義 =====
  const clientTools = {
    setGender: async ({ gender: g }) => { /* 上記参照 */ },
    showImageInputUI: async () => { /* 上記参照 */ },
    generateCoordinates: async ({ gender: g, image_id }) => { /* 上記参照 */ },
    selectGenre: async ({ genre_id }) => { /* 上記参照 */ },
    selectCoordinate: async ({ coordinate_index }) => { /* 上記参照 */ },
    showShopMap: async ({ item_id }) => { /* 上記参照 */ },
    goBack: async () => { /* 上記参照 */ },
  };

  // ===== ElevenLabs Hook =====
  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message) => {
      if (message.message) {
        console.log(`${message.source}: ${message.message}`);
      }
    },
    onError: (error) => console.error("Error:", error),
  });

  // ===== 会話開始 =====
  const startConversation = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
        clientTools,
        dynamicVariables: {
          gender: gender || "",
          user_image_id: userImageId || "",
        },
      });
    } catch (error) {
      console.error("Failed to start:", error);
    }
  };

  // ===== UI =====
  return (
    <div>
      {/* 画面に応じたコンポーネント */}
      {currentView === "conversation" && <ConversationPanel />}
      {currentView === "image-input" && <ImageInputView />}
      {/* ... */}
      
      {/* 音声ボタン（常に表示） */}
      <button onClick={startConversation}>
        🎤 音声で話す
      </button>
    </div>
  );
}
```

### 6.2 常時表示の音声パネル

```tsx
function VoicePanel({
  isConnected,
  isSpeaking,
  onStart,
  onEnd,
}: {
  isConnected: boolean;
  isSpeaking: boolean;
  onStart: () => void;
  onEnd: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 p-4">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* ステータス表示 */}
        <div>
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
          <p>{isConnected ? (isSpeaking ? "AI が話しています" : "聞いています...") : "タップで開始"}</p>
        </div>
        
        {/* マイクボタン */}
        <button
          onClick={isConnected ? onEnd : onStart}
          className={`w-16 h-16 rounded-full ${isConnected ? "bg-red-500" : "bg-green-500"}`}
        >
          🎤
        </button>
      </div>
    </div>
  );
}
```

---

## 7. セットアップ手順

### 7.1 ElevenLabs Agent 作成

1. [ElevenLabs](https://elevenlabs.io/) にアカウント作成
2. Conversational AI → Create Agent
3. 上記の System Prompt を設定
4. Client Tools をダッシュボードで追加（または SDK で定義）
5. Agent ID をコピー

### 7.2 環境変数設定

```env
# .env.local
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=your_api_key  # サーバーサイド用（オプション）
```

### 7.3 Cloudflare Tunnel でスマホからアクセス

```bash
# 1. cloudflared インストール（Windows）
winget install cloudflare.cloudflared

# 2. ログイン
cloudflared login

# 3. トンネル作成
cloudflared tunnel create osyareai

# 4. Next.js 起動
npm run dev

# 5. トンネル開始（別ターミナル）
cloudflared tunnel --url http://localhost:3000

# 6. 表示されたURLをスマホで開く
# 例: https://xxx-xxx-xxx.trycloudflare.com
```

### 7.4 動作確認チェックリスト

- [ ] マイクボタンをタップ → 音声接続
- [ ] 「メンズで」と言う → 性別が設定される
- [ ] 「写真を撮って」と言う → 画像入力画面に遷移
- [ ] 画像をアップロード → 生成開始
- [ ] 生成完了 → ジャンル選択画面
- [ ] 「カジュアル」と言う → コーデ一覧表示
- [ ] 「1番目」と言う → アイテム詳細表示
- [ ] 「店舗を探して」と言う → マップ表示
- [ ] 「戻って」と言う → 前の画面に戻る

---

## 付録: トラブルシューティング

### A. 音声が認識されない
- マイクの許可を確認
- HTTPS 環境が必要（Cloudflare Tunnel で解決）

### B. Tool が呼ばれない
- System Prompt でツール名を正確に記述しているか確認
- ElevenLabs ダッシュボードでツールが有効か確認

### C. 画面が遷移しない
- `setCurrentView` が正しく呼ばれているかコンソールで確認
- Tool の戻り値が正しいか確認

---

*このドキュメントに従って実装すれば、音声操作対応のファッションAIアプリが構築できます。*

# Study Site Project / 学習サイトプロジェクト

> **Note:** This is v0.2.0. Work in progress.
> **注意:** これはv0.2.0です。開発中。

---

## English

### Overview

A web application designed to fully digitize social studies worksheets and assignments. Teachers can create and publish assignments; students can view and submit answers online — eliminating the need for paper printouts.

### Features (Planned / In Progress)

- Role-based access: Teacher and Student views
- Assignment editor with rich element types (text, headings, answer boxes, images, maps, katakana markers, etc.)
- Assignment scheduling and publishing
- Student submission tracking with answer history
- Template system for reusable assignments

### Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** Radix UI + Tailwind CSS v4 + shadcn/ui
- **State:** Zustand
- **Animations:** Framer Motion

### Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Changelog

#### v0.2.0
- Color scheme update: removed gradients, switched to simple blue and gray base
- Student info input screen: class (1st/2nd) and name form with animation for special names
- Deadline time setting: added time input alongside the date picker
- Katakana marker improvement: removed from add button, now selectable from full ア–ン list in properties panel
- Delete confirmation dialog: confirmation prompt before deleting assignments
- StatsCard click navigation: clicking stats cards now navigates to the corresponding tab
- Answer reveal confirmation dialog: confirmation prompt before showing answers

#### v0.1.0
- Initial template version (WIP, known bugs)

### Project Status

Work in progress. The repository is used to track progress over time.

---

## 日本語

### 概要

社会のプリント・課題を完全に電子化するためのWebアプリケーションです。教師が課題を作成・配信し、生徒がオンラインで回答・提出できるようにすることで、紙のプリントを不要にします。

### 機能（予定・開発中）

- ロールベースのアクセス：教師ビューと生徒ビュー
- リッチな要素タイプを持つ課題エディター（テキスト、見出し、回答欄、画像、地図、カタカナマーカーなど）
- 課題のスケジュール設定と配信
- 生徒の提出状況と回答履歴の追跡
- 再利用可能な課題テンプレートシステム

### 技術スタック

- **フレームワーク:** Next.js 16 (App Router)
- **言語:** TypeScript
- **UI:** Radix UI + Tailwind CSS v4 + shadcn/ui
- **状態管理:** Zustand
- **アニメーション:** Framer Motion

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 変更履歴

#### v0.2.0
- カラースキーム更新: グラデーション廃止、シンプルな青とグレーベースに変更
- 生徒情報入力画面: クラス（1組/2組）と名前の入力フォーム、特殊名に対応するアニメーション付き
- 期限の時間設定: 日付ピッカーに加えて時刻入力欄を追加
- カタカナ記号の改善: 追加ボタンから削除、プロパティパネルで全カタカナ（ア～ン）から選択可能に
- 削除確認ダイアログ: 課題削除時に確認ダイアログを表示
- StatsCardのクリック機能: 統計情報をクリックで対応タブへ移動
- 答え表示確認ダイアログ: 答えを見る前に確認を促す

#### v0.1.0
- 初期テンプレートバージョン（開発中、既知のバグあり）

### プロジェクトの状態

開発中です。このリポジトリは進捗を時系列で管理するために使用します。

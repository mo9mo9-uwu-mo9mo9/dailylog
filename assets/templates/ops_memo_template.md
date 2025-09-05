# 運用メモ（テンプレート）

> 注意: このメモは通常 `tmp/docs/` に置き、Git 管理外とします。

## 1. 概要
- 目的/背景:
- 対象環境: 本番 / 検証

## 2. 環境情報
- ホスト/接続: `ssh <user>@<host>` / Tailscale IP / Funnel URL
- パス/ユーザ: `/srv/dailylog*`, `User=dailylog`
- ポート: 本番 3002 / 検証 3003
- BASE_PATH: `/dailylog` / `/dailylog-dev`

## 3. デプロイ/再起動
### 自動デプロイ
- main: GitHub Actions "Deploy (production)"
- develop: GitHub Actions "Deploy (develop)"

### 手動デプロイ（フォールバック）
```bash
ssh <host>
cd /srv/dailylog[-develop]
git fetch --prune && git reset --hard origin/<branch>
npm ci --omit=dev || npm ci --only=production
sudo systemctl restart dailylog[-develop]
```

## 4. ヘルスチェック
```bash
curl -i http://127.0.0.1:<port>/api/health  # 200/401 をOK
```

## 5. ロールバック
1) Git の安定タグ/直前コミットへ `git reset --hard` で戻す
2) `npm ci --omit=dev` → `systemctl restart`
3) ヘルスチェックで復旧確認

## 6. よくある質問（FAQ）
- 401 が返る: Basic認証が有効。`-u $AUTH_USER:$AUTH_PASS` を付与
- 印刷結果にDEBUGが混入: `public/month_print.html` の `.debug-badge` は印刷非表示仕様
- Runner停止: self-hosted ランナーの状態を確認し再起動

## 7. コマンド集
```bash
systemctl status dailylog[-develop]
journalctl -u dailylog[-develop] -b --no-pager | tail -n 50
```

## 8. 連絡/権限
- 管理者: <担当者>
- 権限管理: `.env` 0640 / `data/` 0750 / `*.db` 0640（所有: dailylog）


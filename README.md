# Zipperoo 電商平台後端系統

Zipperoo 是一個專注於服飾垂直市場的電商平台後端系統，採用 NestJS + PostgreSQL + Prisma 技術棧，支援買家、賣家、管理員三種角色的完整電商功能。

## 🚀 功能特色

### 👥 用戶角色
- **Buyer（買家）**: 瀏覽商品、購物車管理、下單結帳、評論商品、即時聊天
- **Seller（賣家）**: 商品管理、訂單處理、店鋪資訊、客服聊天
- **Admin（管理員）**: 用戶管理、商品審核、系統日誌、封鎖管理

### 🛍️ 核心功能
- **商品系統**: 商品上架、分類管理、圖片上傳、庫存管理
- **購物車**: 加入商品、數量調整、選擇結帳
- **訂單系統**: 結帳流程、庫存鎖定、訂單狀態管理
- **評論系統**: 商品評分、評論管理、軟刪除
- **即時聊天**: WebSocket 聊天室、買賣家溝通
- **權限控制**: JWT 認證、角色權限、API 保護

## 🏗️ 技術架構

### 後端技術棧
- **框架**: NestJS (Node.js)
- **資料庫**: PostgreSQL
- **ORM**: Prisma
- **認證**: JWT + Passport
- **即時通訊**: Socket.IO
- **驗證**: class-validator
- **測試**: Jest + SuperTest
- **容器化**: Docker + Docker Compose

### 架構設計
- **三層式架構**: Presentation / Business / Data
- **模組化設計**: Feature Modules
- **物件導向**: 實體類別與業務邏輯封裝
- **事務管理**: Prisma Transaction
- **日誌系統**: 操作記錄與審計

## 📁 項目結構

```
src/
├── auth/                 # 認證模組
│   ├── dto/             # 資料傳輸物件
│   ├── strategies/      # JWT 策略
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── buyer/               # 買家模組
│   ├── controllers/     # 購物車、訂單控制器
│   ├── services/        # 業務邏輯服務
│   ├── dto/            # 資料驗證
│   └── buyer.module.ts
├── seller/              # 賣家模組
│   ├── controllers/     # 商品、訂單控制器
│   ├── services/        # 商品管理服務
│   ├── dto/            # 資料驗證
│   └── seller.module.ts
├── admin/               # 管理員模組
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── admin.module.ts
├── chat/                # 聊天模組
│   ├── chat.gateway.ts  # WebSocket 閘道
│   ├── chat.service.ts
│   └── chat.module.ts
├── review/              # 評論模組
├── common/              # 共用模組
│   ├── decorators/      # 自定義裝飾器
│   ├── guards/          # 守衛
│   ├── dto/            # 共用 DTO
│   └── services/        # 日誌服務
├── prisma/              # 資料庫模組
└── main.ts              # 應用程式入口
```

## 🚀 快速開始

### 環境要求
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (可選)
- Docker & Docker Compose

### 🎯 一鍵啟動 (Windows)
```bash
# 執行自動化腳本，完成環境設置
start-dev.bat
```

### 手動設置步驟

### 1. 克隆專案
```bash
git clone <repository-url>
cd zipperoo-backend
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境配置
複製 `.env.example` 到 `.env` 並配置：
```env
DATABASE_URL="postgresql://zipperoo:zipperoo123@localhost:5432/zipperoo_db?schema=public"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"
REFRESH_JWT_SECRET="your-refresh-jwt-secret"
REFRESH_JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="*"
```

### 4. 資料庫設置
```bash
# 啟動資料庫服務
docker-compose up -d postgres redis

# 生成 Prisma Client
npm run prisma:generate

# 執行資料庫遷移
npm run prisma:migrate

# 填充測試資料
npm run seed

# (可選) 查看資料庫
npm run prisma:studio
```

### 5. 啟動應用
```bash
# 開發模式
npm run start:dev

# 生產模式
npm run build
npm run start:prod
```

## 📋 API 測試工具

本專案內建了一個完整的 Web API 測試介面，讓您可以輕鬆測試所有 API 端點：

**🌐 訪問地址：** `http://localhost:3000/api-tester.html`

### ✨ 功能特色
- 🔐 **完整認證系統**：支援註冊、登入、JWT 令牌管理
- 🛍️ **全端點覆蓋**：涵蓋所有買家、賣家、管理員功能
- 📱 **響應式設計**：現代化美觀界面
- 🔄 **即時響應**：實時顯示 API 調用結果
- 📊 **詳細日誌**：完整的請求/響應信息

### 👥 預設測試賬號
使用 `npm run seed` 創建的測試賬號：
```
管理員: admin / 123456
賣家:   seller / 123456  
買家:   buyer / 123456
```

### 🎯 建議測試流程
1. **買家功能測試**：登入 `buyer` → 瀏覽商品 → 加入購物車 → 結帳
2. **賣家功能測試**：登入 `seller` → 創建商品 → 管理訂單
3. **管理功能測試**：登入 `admin` → 管理用戶 → 查看系統日誌

### 🔧 快速重置資料庫
```bash
# 重置資料庫並重新填充測試資料
npm run db:reset
```

## 🐳 Docker 部署

### 使用 Docker Compose 一鍵啟動
```bash
# 啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f backend

# 停止服務
docker-compose down
```

### 服務說明
- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Nginx**: http://localhost (反向代理)

## 🧪 測試

### 單元測試
```bash
# 執行所有測試
npm run test

# 監聽模式
npm run test:watch

# 測試覆蓋率
npm run test:cov
```

### E2E 測試
```bash
# 執行 E2E 測試
npm run test:e2e
```

### 測試流程
E2E 測試涵蓋完整的業務流程：
1. 用戶註冊與登入
2. 商品創建與瀏覽
3. 購物車操作
4. 結帳流程
5. 訂單管理
6. 評論系統

## 📚 API 文檔

### 認證 API
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/logout` - 用戶登出
- `GET /api/v1/auth/profile` - 獲取個人資料

### 商品 API
- `GET /api/v1/products` - 商品列表（支援搜尋、分類、價格篩選）
- `GET /api/v1/products/{id}` - 商品詳情
- `GET /api/v1/categories` - 商品分類

### 買家 API
- `GET /api/v1/buyers/me/cart` - 獲取購物車
- `POST /api/v1/buyers/me/cart/items` - 加入購物車
- `PATCH /api/v1/buyers/me/cart/items/{itemId}` - 更新購物車項目
- `DELETE /api/v1/buyers/me/cart/items/{itemId}` - 移除購物車項目
- `POST /api/v1/buyers/me/checkout` - 結帳
- `GET /api/v1/buyers/me/orders` - 訂單列表
- `PATCH /api/v1/buyers/me/orders/{orderId}/cancel` - 取消訂單

### 賣家 API
- `GET /api/v1/seller/products` - 我的商品
- `POST /api/v1/seller/products` - 創建商品
- `PUT /api/v1/seller/products/{id}` - 更新商品
- `DELETE /api/v1/seller/products/{id}` - 刪除商品
- `GET /api/v1/seller/orders` - 接收的訂單
- `PATCH /api/v1/seller/orders/{orderId}/ship` - 出貨
- `PATCH /api/v1/seller/orders/{orderId}/complete` - 完成訂單

### 評論 API
- `POST /api/v1/products/{productId}/reviews` - 撰寫評論
- `GET /api/v1/products/{productId}/reviews` - 商品評論
- `PATCH /api/v1/reviews/{reviewId}` - 編輯評論
- `DELETE /api/v1/reviews/{reviewId}` - 刪除評論

### 聊天 API
- `POST /api/v1/chat/rooms` - 創建/獲取聊天室
- `GET /api/v1/chat/rooms` - 聊天室列表
- `GET /api/v1/chat/rooms/{roomId}/messages` - 聊天記錄
- `POST /api/v1/chat/rooms/{roomId}/messages` - 發送訊息

### 管理員 API
- `DELETE /api/v1/admin/users/{userId}` - 刪除用戶
- `PATCH /api/v1/admin/users/{userId}/block` - 封鎖用戶
- `PATCH /api/v1/admin/users/{userId}/unblock` - 解除封鎖
- `DELETE /api/v1/admin/products/{productId}` - 刪除商品
- `GET /api/v1/admin/logs` - 系統日誌

## 🔌 WebSocket 事件

### 聊天事件
- `joinRoom` - 加入聊天室
- `leaveRoom` - 離開聊天室
- `chatMessage` - 發送訊息
- `newMessage` - 接收新訊息
- `getMessages` - 獲取歷史訊息

## 🗄️ 資料庫設計

### 主要實體
- **User**: 用戶基本資訊
- **Product**: 商品資訊
- **Cart/CartItem**: 購物車
- **Order/OrderItem**: 訂單
- **Review**: 商品評論
- **ChatRoom/ChatMessage**: 聊天系統
- **LogEntry**: 系統日誌

### 關聯設計
- 用戶與角色：一對一
- 商品與賣家：多對一
- 購物車與用戶：一對一
- 訂單與買賣家：多對一
- 聊天室與用戶：多對多

## 🔒 安全性

### 認證與授權
- JWT Token 認證
- 角色權限控制
- API 路由保護
- 密碼雜湊（bcrypt）

### 資料驗證
- DTO 輸入驗證
- 類型安全檢查
- SQL 注入防護
- XSS 防護

## 📊 監控與日誌

### 日誌系統
- 用戶操作記錄
- 系統事件追蹤
- 錯誤日誌收集
- 性能監控

### 健康檢查
- 資料庫連線狀態
- 服務可用性檢查
- 記憶體使用監控

## 🚀 部署指南

### 生產環境部署
1. 設置環境變數
2. 建立 Docker 映像
3. 配置 Nginx 反向代理
4. 設置 SSL 憑證
5. 配置監控告警

### CI/CD 流程
1. 代碼提交觸發
2. 自動化測試
3. 建立 Docker 映像
4. 部署到測試環境
5. 生產環境發布

## 🤝 開發規範

### 代碼風格
- TypeScript Strict 模式
- ESLint + Prettier
- 命名規範：PascalCase (類別)、camelCase (方法)
- Git 提交規範：`feat:`, `fix:`, `test:`, `refactor:`

### 測試要求
- 單元測試覆蓋率 > 80%
- E2E 測試涵蓋主要流程
- 所有 PR 必須通過測試

## 📝 更新日誌

### v1.0.0 (2024-01-01)
- ✅ 完整的用戶認證系統
- ✅ 商品管理功能
- ✅ 購物車與結帳流程
- ✅ 訂單管理系統
- ✅ 評論系統
- ✅ 即時聊天功能
- ✅ 管理員後台
- ✅ Docker 容器化
- ✅ 完整的測試覆蓋

## 🆘 故障排除

### 常見問題
1. **資料庫連線失敗**: 檢查 DATABASE_URL 配置
2. **JWT 驗證失敗**: 確認 JWT_SECRET 設置
3. **WebSocket 連線問題**: 檢查 CORS 配置
4. **Docker 啟動失敗**: 確認端口未被占用

### 日誌查看
```bash
# 查看應用日誌
docker-compose logs backend

# 查看資料庫日誌
docker-compose logs postgres

# 實時日誌
docker-compose logs -f
```

## 📞 技術支援

如有技術問題或建議，請：
1. 查看文檔和 FAQ
2. 搜尋已知問題
3. 提交 Issue
4. 聯繫開發團隊

---

**Zipperoo Backend Team** - 打造穩定、高效的電商後端系統 🚀 
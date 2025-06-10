# Zipperoo E-commerce API v1 完整文檔

## 目錄

1. [系統概覽](#1-系統概覽)
2. [通用響應格式](#2-通用響應格式)
3. [認證系統](#3-認證系統)
4. [系統健康檢查](#4-系統健康檢查)
5. [公共 API](#5-公共-api)
6. [分類管理 API](#6-分類管理-api)
7. [賣家 API](#7-賣家-api)
8. [商品款式管理 API](#8-商品款式管理-api)
9. [買家 API](#9-買家-api)
10. [評價系統 API](#10-評價系統-api)
11. [聊天系統 API](#11-聊天系統-api)
12. [圖片管理 API](#12-圖片管理-api)
13. [管理員 API](#13-管理員-api)

---

## 1. 系統概覽

Zipperoo 是一個功能完整的電商平台，支援：
- 多角色權限系統（買家、賣家、管理員）
- 商品變體管理（顏色、尺寸等）
- 購物車與結帳系統
- 評價與評論系統
- 即時聊天系統
- 圖片上傳與管理
- 完整的管理後台

## 2. 通用響應格式

所有端點回應皆包裝於 `ResponseDto`：

### 成功響應
```json
{
  "statusCode": 200|201,
  "message": "操作成功的描述信息",
  "data": { ... }
}
```

### 錯誤響應
```json
{
  "statusCode": 4xx|5xx,
  "message": "錯誤信息",
  "data": null
}
```

---

## 3. 認證系統

### 3.1 用戶註冊
- **端點**: `POST /auth/register`
- **權限**: Public
- **請求體**:
```json
{
  "account": "string (3字符以上)",
  "password": "string (6字符以上)",
  "username": "string (2字符以上)",
  "email": "string (可選)",
  "phone": "string (可選)",
  "role": "BUYER | SELLER",
  "shopName": "string (賣家必填)",
  "description": "string (可選)"
}
```

### 3.2 用戶登入
- **端點**: `POST /auth/login`
- **權限**: Public
- **請求體**:
```json
{
  "account": "string",
  "password": "string"
}
```

### 3.3 用戶登出
- **端點**: `POST /auth/logout`
- **權限**: Buyer | Seller | Admin

### 3.4 獲取個人資料
- **端點**: `GET /auth/profile`
- **權限**: Buyer | Seller | Admin

### 3.5 忘記密碼
- **端點**: `POST /auth/forgot-password`
- **權限**: Public
- **請求體**:
```json
{
  "email": "string"
}
```

### 3.6 重設密碼
- **端點**: `POST /auth/reset-password`
- **權限**: Public
- **請求體**:
```json
{
  "token": "string",
  "newPassword": "string (8字符以上)"
}
```

---

## 4. 系統健康檢查

### 4.1 健康檢查
- **端點**: `GET /health`
- **權限**: Public
- **回應**:
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "Zipperoo Backend"
  }
}
```

---

## 5. 公共 API

### 5.1 獲取商品列表（帶搜尋篩選）
- **端點**: `GET /products`
- **權限**: Public
- **查詢參數**:
  - `page`: 頁碼
  - `pageSize`: 每頁項目數
  - `search`: 搜尋關鍵字
  - `categoryId`: 分類ID
  - `minPrice`: 最低價格
  - `maxPrice`: 最高價格
  - `sortBy`: 排序欄位 (createdAt|name|price)
  - `sortOrder`: 排序方向 (asc|desc)

### 5.2 獲取單一商品詳情
- **端點**: `GET /products/{id}`
- **權限**: Public
- **回應**: 包含商品詳情、圖片、評價和平均評分

### 5.3 獲取所有分類
- **端點**: `GET /categories`
- **權限**: Public

### 5.4 獲取分類下的商品
- **端點**: `GET /categories/{id}/products`
- **權限**: Public

---

## 6. 分類管理 API

### 6.1 創建分類
- **端點**: `POST /categories`
- **權限**: Seller | Admin
- **請求體**:
```json
{
  "name": "string"
}
```

### 6.2 獲取單一分類
- **端點**: `GET /categories/{id}`
- **權限**: Public

### 6.3 更新分類
- **端點**: `PATCH /categories/{id}`
- **權限**: Seller | Admin
- **請求體**:
```json
{
  "name": "string"
}
```

### 6.4 刪除分類
- **端點**: `DELETE /categories/{id}`
- **權限**: Seller | Admin

---

## 7. 賣家 API

### 7.1 商品管理

#### 獲取賣家商品列表
- **端點**: `GET /seller/products`
- **權限**: Seller

#### 創建商品
- **端點**: `POST /seller/products`
- **權限**: Seller
- **請求體**:
```json
{
  "name": "string",
  "description": "string",
  "categoryId": "number (可選)",
  "variants": [
    {
      "name": "string",
      "price": "number",
      "stock": "number"
    }
  ],
  "imageUrls": ["string"]
}
```

#### 獲取賣家單一商品
- **端點**: `GET /seller/products/{id}`
- **權限**: Seller

#### 更新商品
- **端點**: `PUT /seller/products/{id}`
- **權限**: Seller

#### 刪除商品
- **端點**: `DELETE /seller/products/{id}`
- **權限**: Seller

### 7.2 訂單管理

#### 獲取賣家訂單列表
- **端點**: `GET /seller/orders`
- **權限**: Seller

#### 訂單出貨
- **端點**: `PATCH /seller/orders/{orderId}/ship`
- **權限**: Seller

#### 完成訂單
- **端點**: `PATCH /seller/orders/{orderId}/complete`
- **權限**: Seller

---

## 8. 商品款式管理 API

### 8.1 為商品新增款式
- **端點**: `POST /seller/products/{productId}/variants`
- **權限**: Seller | Admin
- **請求體**:
```json
{
  "variants": [
    {
      "name": "string",
      "price": "number",
      "stock": "number"
    }
  ]
}
```

### 8.2 更新商品款式
- **端點**: `PUT /seller/variants/{variantId}`
- **權限**: Seller | Admin
- **請求體**:
```json
{
  "name": "string (可選)",
  "price": "number (可選)",
  "stock": "number (可選)"
}
```

### 8.3 刪除商品款式
- **端點**: `DELETE /seller/variants/{variantId}`
- **權限**: Seller | Admin

---

## 9. 買家 API

### 9.1 購物車管理

#### 獲取購物車
- **端點**: `GET /buyers/me/cart`
- **權限**: Buyer

#### 添加商品到購物車
- **端點**: `POST /buyers/me/cart/items`
- **權限**: Buyer
- **請求體**:
```json
{
  "productVariantId": "number",
  "quantity": "number"
}
```

#### 更新購物車項目
- **端點**: `PATCH /buyers/me/cart/items/{itemId}`
- **權限**: Buyer
- **請求體**:
```json
{
  "quantity": "number (可選)",
  "isSelected": "boolean (可選)"
}
```

#### 從購物車刪除商品
- **端點**: `DELETE /buyers/me/cart/items/{itemId}`
- **權限**: Buyer

### 9.2 結帳系統

#### 結帳（支援指定項目ID）
- **端點**: `POST /buyers/me/checkout`
- **權限**: Buyer
- **請求體**:
```json
{
  "cartItemIds": ["number"] // 可選，指定要結帳的項目ID
}
```

### 9.3 訂單管理

#### 獲取買家訂單列表
- **端點**: `GET /buyers/me/orders`
- **權限**: Buyer

#### 獲取買家單一訂單
- **端點**: `GET /buyers/me/orders/{orderId}`
- **權限**: Buyer

#### 取消訂單
- **端點**: `PATCH /buyers/me/orders/{orderId}/cancel`
- **權限**: Buyer

---

## 10. 評價系統 API

### 10.1 創建商品評價
- **端點**: `POST /products/{productId}/reviews`
- **權限**: Buyer | Admin
- **請求體**:
```json
{
  "score": "number (1-5)",
  "comment": "string (可選)"
}
```

### 10.2 獲取商品評價列表
- **端點**: `GET /products/{productId}/reviews`
- **權限**: Public

### 10.3 更新評價
- **端點**: `PATCH /reviews/{reviewId}`
- **權限**: Buyer | Admin
- **請求體**:
```json
{
  "score": "number (1-5, 可選)",
  "comment": "string (可選)"
}
```

### 10.4 刪除評價
- **端點**: `DELETE /reviews/{reviewId}`
- **權限**: Buyer | Admin

---

## 11. 聊天系統 API

### 11.1 創建或獲取聊天室
- **端點**: `POST /chat/rooms`
- **權限**: Buyer | Seller | Admin
- **請求體**:
```json
{
  "buyerId": "number (可選)",
  "sellerId": "number (可選)"
}
```

### 11.2 獲取用戶聊天室列表
- **端點**: `GET /chat/rooms`
- **權限**: Buyer | Seller | Admin

### 11.3 獲取聊天室訊息
- **端點**: `GET /chat/rooms/{roomId}/messages`
- **權限**: Buyer | Seller | Admin

### 11.4 發送訊息
- **端點**: `POST /chat/rooms/{roomId}/messages`
- **權限**: Buyer | Seller | Admin
- **請求體**:
```json
{
  "content": "string"
}
```

---

## 12. 圖片管理 API

### 12.1 上傳商品圖片
- **端點**: `POST /products/{productId}/images`
- **權限**: Seller | Admin | Buyer
- **請求**: multipart/form-data，欄位名稱為 `images`
- **限制**: 最多8張圖片，每張最大10MB

### 12.2 刪除商品圖片
- **端點**: `DELETE /images/{imageId}`
- **權限**: Seller | Admin

### 12.3 通過檔名獲取圖片
- **端點**: `GET /imagesFromName/{imgName}`
- **權限**: Public

### 12.4 通過ID獲取圖片
- **端點**: `GET /imagesFromID/{imageId}`
- **權限**: Public

---

## 13. 管理員 API

### 13.1 用戶管理

#### 獲取所有用戶
- **端點**: `GET /admin/users`
- **權限**: Admin

#### 刪除用戶
- **端點**: `DELETE /admin/users/{userId}`
- **權限**: Admin

#### 封鎖用戶
- **端點**: `PATCH /admin/users/{userId}/block`
- **權限**: Admin

#### 解除封鎖用戶
- **端點**: `PATCH /admin/users/{userId}/unblock`
- **權限**: Admin

### 13.2 商品管理

#### 獲取所有商品（管理員）
- **端點**: `GET /admin/products`
- **權限**: Admin

#### 刪除商品（管理員）
- **端點**: `DELETE /admin/products/{productId}`
- **權限**: Admin

### 13.3 訂單管理

#### 獲取所有訂單
- **端點**: `GET /admin/orders`
- **權限**: Admin

#### 獲取單一訂單詳情
- **端點**: `GET /admin/orders/{id}`
- **權限**: Admin

#### 更新訂單狀態
- **端點**: `PATCH /admin/orders/{id}/status`
- **權限**: Admin
- **請求體**:
```json
{
  "status": "UNCOMPLETED | COMPLETED | CANCELED"
}
```

### 13.4 系統管理

#### 獲取系統日誌
- **端點**: `GET /admin/logs`
- **權限**: Admin

---

## 總結

本 API 文檔涵蓋了 Zipperoo 電商平台的所有功能：

- **51 個 API 端點**
- **完整的用戶權限管理**
- **支援商品變體系統**
- **靈活的購物車與結帳機制**
- **即時聊天功能**
- **圖片上傳與管理**
- **全面的管理後台**

所有端點都經過充分測試，並提供完整的錯誤處理和輸入驗證。

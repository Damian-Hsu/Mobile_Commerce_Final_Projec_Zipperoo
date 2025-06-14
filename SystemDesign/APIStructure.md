# API 結構文件 (v1)

本文檔詳細描述了 Zipperoo 電商平台的 API 端點、請求/回應格式及認證機制。

## 基礎 URL

所有 API 端點都基於以下基礎 URL：

-   **後端 API:** `http://localhost:3000` (或其他部署後的主機名稱)
-   **WebSocket:** `ws://localhost:3000/chat`

所有 RESTful API 路徑都以 `/api/v1` 作為前綴。

## 認證

本系統採用 JSON Web Tokens (JWT) 進行認證。需要認證的端點必須在 HTTP 請求的 `Authorization` 標頭中包含 `Bearer` 權杖。

-   **格式:** `Authorization: Bearer <your_jwt_token>`

權杖可透過 `/api/v1/auth/login` 端點取得。部分端點還需要特定的使用者角色 (`BUYER`, `SELLER`, `ADMIN`)。

## 通用回應格式

所有 API 回應都遵循以下標準格式：

```json
{
  "success": true, // 或 false
  "message": "描述訊息",
  "data": {
    // 回應資料
  },
  "error": { // (可選) 僅在 success 為 false 時出現
    "code": "ERROR_CODE",
    "details": "錯誤詳情"
  }
}
```

---

## 1. 認證系統 (Auth)

管理使用者註冊、登入、登出及個人資料。

### `POST /api/v1/auth/register`
註冊新使用者。

- **需要認證:** 否
- **角色限制:** 無

**請求 Body (`application/json`):**
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "role": "BUYER" // 或 "SELLER"
}
```

**回應 (201 Created):**
```json
{
  "success": true,
  "message": "註冊成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "BUYER"
    },
    "accessToken": "ey...",
    "refreshToken": "ey..."
  }
}
```

---

### `POST /api/v1/auth/login`
使用者登入。

- **需要認證:** 否
- **角色限制:** 無

**請求 Body (`application/json`):**
```json
{
  "account": "testuser", // 可以是 username 或 email
  "password": "password123"
}
```

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "BUYER"
    },
    "accessToken": "ey...",
    "refreshToken": "ey..."
  }
}
```

---

### `POST /api/v1/auth/logout`
使用者登出。

- **需要認證:** 是
- **角色限制:** 無

**請求 Body:** 無

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "登出成功",
  "data": null
}
```

---

### `GET /api/v1/auth/profile`
獲取當前使用者資料。

- **需要認證:** 是
- **角色限制:** 無

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取個人資料成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "BUYER",
    "shopName": null, // 如果是賣家
    "description": null // 如果是賣家
  }
}
```

---

### `POST /api/v1/auth/forgot-password`
請求密碼重設信件。

- **需要認證:** 否
- **角色限制:** 無

**請求 Body (`application/json`):**
```json
{
  "email": "test@example.com"
}
```

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "密碼重置郵件已發送",
  "data": {
    "message": "密碼重置郵件已發送"
  }
}
```

---

### `POST /api/v1/auth/reset-password`
使用權杖重設密碼。

- **需要認證:** 否
- **角色限制:** 無

**請求 Body (`application/json`):**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newPassword123"
}
```

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "密碼重置成功",
  "data": {
    "message": "密碼重置成功"
  }
}
```

---

## 2. 公開瀏覽 (Public Access)

無需登入即可存取的端點。

### `GET /api/v1/products`
獲取商品列表，支援搜尋、分類篩選、價格篩選和排序。

- **需要認證:** 否
- **查詢參數:**
  - `page` (number, optional): 頁碼，預設為 1。
  - `pageSize` (number, optional): 每頁數量，預設為 10。
  - `search` (string, optional): 搜尋關鍵字（商品名稱或描述）。
  - `categoryId` (number, optional): 分類 ID。
  - `minPrice` (number, optional): 最低價格。
  - `maxPrice` (number, optional): 最高價格。
  - `sortBy` (string, optional): 排序欄位，可選值: `createdAt`, `name`。
  - `sortOrder` (string, optional): 排序方向，可選值: `asc`, `desc`。

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取商品列表成功",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "範例商品",
        "description": "這是一個很棒的商品",
        "avgRating": 4.5,
        "minPrice": 100,
        "maxPrice": 250,
        "images": [
          { "id": 1, "url": "/uploads/img-1-xxxx.png" }
        ],
        "variants": [
            { "id": 1, "name": "紅色, M", "price": 100, "stock": 50 },
            { "id": 2, "name": "藍色, L", "price": 120, "stock": 30 }
        ],
        "category": { "id": 1, "name": "電子產品" },
        "seller": { "id": 2, "shopName": "優質賣家" },
        "_count": { "reviews": 15 }
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

### `GET /api/v1/products/:productId`
獲取單一商品詳情。

- **需要認證:** 否

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取商品詳情成功",
  "data": {
    "id": 1,
    "name": "範例商品",
    "description": "這是一個很棒的商品",
    "avgRating": 4.5,
    "minPrice": 100,
    "maxPrice": 250,
    "images": [
      { "id": 1, "url": "/uploads/img-1-xxxx.png" }
    ],
    "variants": [
        { "id": 1, "name": "紅色, M", "price": 100, "stock": 50, "attributes": [{"key":"顏色","value":"紅色"},{"key":"尺寸","value":"M"}] },
        { "id": 2, "name": "藍色, L", "price": 120, "stock": 30, "attributes": [{"key":"顏色","value":"藍色"},{"key":"尺寸","value":"L"}] }
    ],
    "category": { "id": 1, "name": "電子產品" },
    "seller": { "id": 2, "username": "seller1", "shopName": "優質賣家" },
    "reviews": [
      {
        "id": 1,
        "score": 5,
        "comment": "非常好！",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "buyer": { "id": 3, "username": "buyer1" }
      }
    ],
    "_count": { "reviews": 15 }
  }
}
```

---

### `GET /api/v1/products/:productId/reviews`
獲取商品的評論列表。

- **需要認證:** 否
- **查詢參數:**
  - `page` (number, optional): 頁碼，預設為 1。
  - `pageSize` (number, optional): 每頁數量，預設為 10。

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取商品評論成功",
  "data": {
    "data": [
        {
          "id": 1,
          "score": 5,
          "comment": "非常好！",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "buyer": { "id": 3, "username": "buyer1" }
        }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### `GET /api/v1/categories`
獲取所有分類列表。

- **需要認證:** 否

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取分類列表成功",
  "data": [
    {
      "id": 1,
      "name": "電子產品",
      "description": "最新的電子產品",
      "_count": { "products": 50 }
    }
  ]
}
```

---

### `GET /api/v1/categories/:id`
獲取單一分類詳情。

- **需要認證:** 否

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取分類成功",
  "data": {
    "id": 1,
    "name": "電子產品",
    "description": "最新的電子產品"
  }
}
```

---

### `GET /api/v1/categories/:id/products`
獲取特定分類下的商品。

- **需要認證:** 否
- **查詢參數:**
  - `page` (number, optional): 頁碼，預設為 1。
  - `pageSize` (number, optional): 每頁數量，預設為 10。

**回應 (200 OK):** (格式同 `GET /api/v1/products`)

---

## 3. 買家 (Buyer)

買家專用功能，需要 `BUYER` 角色權限。所有端點都需要認證。

### `GET /api/v1/buyers/me/cart`
獲取當前使用者的購物車。

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取購物車成功",
  "data": {
    "id": 1,
    "buyerId": 3,
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "variant": {
          "id": 1,
          "name": "紅色, M",
          "price": 100,
          "stock": 50,
          "product": {
            "id": 1,
            "name": "範例商品",
            "images": [{ "url": "/uploads/img-1-xxxx.png" }]
          }
        }
      }
    ],
    "totalPrice": 200
  }
}
```

---

### `POST /api/v1/buyers/me/cart/items`
新增商品至購物車。

**請求 Body (`application/json`):**
```json
{
  "productVariantId": 1,
  "quantity": 1
}
```

**回應 (201 Created):** (回應格式同 `GET /api/v1/buyers/me/cart`)

---

### `PATCH /api/v1/buyers/me/cart/items/:itemId`
更新購物車中的商品數量。

**請求 Body (`application/json`):**
```json
{
  "quantity": 3
}
```

**回應 (200 OK):** (回應格式同 `GET /api/v1/buyers/me/cart`)

---

### `DELETE /api/v1/buyers/me/cart/items/:itemId`
從購物車移除商品。

**回應 (200 OK):** (回應格式同 `GET /api/v1/buyers/me/cart`)

---

### `POST /api/v1/buyers/me/checkout`
從購物車結帳，創建訂單。

**請求 Body (`application/json`):**
```json
{
  "shippingAddress": "123 範例路",
  "paymentMethod": "CREDIT_CARD" // 或其他付款方式
}
```

**回應 (201 Created):**
```json
{
  "success": true,
  "message": "結帳成功",
  "data": {
    "id": 1,
    "buyerId": 3,
    "totalPrice": 200,
    "status": "PENDING",
    "shippingAddress": "123 範例路",
    "paymentMethod": "CREDIT_CARD",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "items": [
        {
            "id": 1,
            "quantity": 2,
            "price": 100,
            "variant": { "id": 1, "name": "紅色, M" }
        }
    ]
  }
}
```

---

### `GET /api/v1/buyers/me/orders`
獲取我的訂單列表。

- **查詢參數:**
  - `page` (number, optional): 頁碼。
  - `pageSize` (number, optional): 每頁數量。

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取訂單列表成功",
  "data": {
    "data": [
      {
        "id": 1,
        "totalPrice": 200,
        "status": "PENDING",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "items": [
          {
            "id": 1,
            "quantity": 2,
            "price": 100,
            "variant": {
              "id": 1,
              "name": "紅色, M",
              "product": { "id": 1, "name": "範例商品" }
            }
          }
        ]
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### `GET /api/v1/buyers/me/orders/:orderId`
獲取單一訂單詳情。

**回應 (200 OK):** (格式同 `POST /api/v1/buyers/me/checkout` 回應中的 data)

---

### `PATCH /api/v1/buyers/me/orders/:orderId/cancel`
取消訂單。

**回應 (200 OK):**
```json
{
    "success": true,
    "message": "訂單已取消",
    "data": {
        "id": 1,
        "status": "CANCELLED"
    }
}
```

---

### `POST /api/v1/products/:productId/reviews`
建立商品評論。

- **需要認證:** 是
- **角色限制:** `BUYER`, `ADMIN`

**請求 Body (`application/json`):**
```json
{
  "score": 5, // 1-5
  "comment": "這真是太棒了！"
}
```

**回應 (201 Created):**
```json
{
  "success": true,
  "message": "評論創建成功",
  "data": {
    "id": 1,
    "score": 5,
    "comment": "這真是太棒了！",
    "buyerId": 3,
    "productId": 1
  }
}
```

---

### `PATCH /api/v1/reviews/:reviewId`
更新自己的評論。

- **需要認證:** 是
- **角色限制:** `BUYER`, `ADMIN`

**請求 Body (`application/json`):**
```json
{
  "score": 4,
  "comment": "更新一下，還是不錯的。"
}
```

**回應 (200 OK):** (格式同上)

---

### `DELETE /api/v1/reviews/:reviewId`
刪除自己的評論。

- **需要認證:** 是
- **角色限制:** `BUYER`, `ADMIN`

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "評論刪除成功",
  "data": null
}
```

---

## 4. 賣家 (Seller)

賣家專用功能，需要 `SELLER` 或 `ADMIN` 角色權限。所有端點都需要認證。

### `POST /api/v1/seller/products`
建立新商品。

**請求 Body (`application/json`):**
```json
{
  "name": "全新的商品",
  "description": "這是一個詳細的描述",
  "categoryId": 1,
  "variants": [
    {
      "name": "款式一",
      "price": 199.99,
      "stock": 100,
      "attributes": [{ "key": "顏色", "value": "黑色" }]
    }
  ]
}
```

**回應 (201 Created):**
```json
{
  "success": true,
  "message": "商品創建成功",
  "data": {
    "id": 101,
    "name": "全新的商品",
    "description": "這是一個詳細的描述",
    "categoryId": 1,
    "sellerId": 2,
    "status": "ON_SHELF",
    "variants": [
        { "id": 201, "name": "款式一", "price": 199.99, "stock": 100 }
    ]
  }
}
```

---

### `PATCH /api/v1/seller/products/:id`
更新商品資訊。

**請求 Body (`application/json`):**
```json
{
  "name": "更新後的商品名稱",
  "description": "更新後的描述",
  "status": "OFF_SHELF" // "ON_SHELF" 或 "OFF_SHELF"
}
```

**回應 (200 OK):** (格式同上)

---

### `POST /api/v1/seller/products/:productId/variants`
新增商品款式。

**請求 Body (`application/json`):**
```json
{
  "variants": [
    {
      "name": "款式二",
      "price": 249.99,
      "stock": 50,
      "attributes": [{ "key": "顏色", "value": "白色" }]
    }
  ]
}
```

**回應 (201 Created):**
```json
{
    "success": true,
    "message": "商品款式新增成功",
    "data": {
        "count": 1
    }
}
```

---

### `PUT /api/v1/seller/variants/:variantId`
更新商品款式。

**請求 Body (`application/json`):**
```json
{
  "name": "更新後的款式名稱",
  "price": 259.99,
  "stock": 45
}
```

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "商品款式更新成功",
  "data": {
    "id": 201,
    "name": "更新後的款式名稱",
    "price": 259.99,
    "stock": 45
  }
}
```

---

### `GET /api/v1/seller/orders`
獲取賣家所有訂單。

- **查詢參數:**
  - `page` (number, optional): 頁碼。
  - `pageSize` (number, optional): 每頁數量。

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "獲取訂單列表成功",
  "data": {
    "data": [
      {
        "id": 1,
        "totalPrice": 200,
        "status": "PENDING",
        "shippingAddress": "123 範例路",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "buyer": { "id": 3, "username": "buyer1" },
        "items": [
          {
            "id": 1,
            "quantity": 2,
            "price": 100,
            "variant": { "id": 1, "name": "紅色, M" }
          }
        ]
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### `PATCH /api/v1/seller/orders/:orderId/ship`
將訂單標示為已出貨。

**回應 (200 OK):**
```json
{
    "success": true,
    "message": "訂單已出貨",
    "data": {
        "id": 1,
        "status": "SHIPPED"
    }
}
```

---

### `PATCH /api/v1/seller/orders/:orderId/complete`
將訂單標示為已完成。

**回應 (200 OK):**
```json
{
    "success": true,
    "message": "訂單已完成",
    "data": {
        "id": 1,
        "status": "COMPLETED"
    }
}
```

---

### `POST /api/v1/categories`
建立新分類。

- **角色限制:** `SELLER`, `ADMIN`

**請求 Body (`application/json`):**
```json
{
  "name": "新的分類",
  "description": "分類描述"
}
```

**回應 (201 Created):**
```json
{
  "success": true,
  "message": "Category created successfully.",
  "data": {
    "id": 5,
    "name": "新的分類",
    "description": "分類描述"
  }
}
```

---

### `PATCH /api/v1/categories/:id`
更新分類。

- **角色限制:** `SELLER`, `ADMIN`

**請求 Body (`application/json`):**
```json
{
  "name": "更新後的分類名稱",
  "description": "更新後的分類描述"
}
```

**回應 (200 OK):** (格式同上)

---

### `DELETE /api/v1/categories/:id`
刪除分類。

- **角色限制:** `SELLER`, `ADMIN`

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully.",
  "data": null
}
```

---

## 5. 圖片管理 (Image Management)

### `POST /api/v1/products/:productId/images`
上傳商品圖片。

- **需要認證:** 是
- **角色限制:** `SELLER`, `ADMIN`, `BUYER`
- **請求 Body:** `multipart/form-data`
  - `images`: 圖片檔案 (可多選，最多8張)

**回應 (201 Created):**
```json
{
  "success": true,
  "message": "Images uploaded successfully.",
  "data": [
    {
      "id": 10,
      "filename": "img-1-xxxx.png",
      "url": "/uploads/img-1-xxxx.png"
    }
  ]
}
```

---

### `DELETE /api/v1/images/:imageId`
刪除商品圖片。

- **需要認證:** 是
- **角色限制:** `SELLER`, `ADMIN`

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "圖片刪除成功",
  "data": {
      "message": "圖片刪除成功"
  }
}
```

---

## 6. 管理員 (Admin)

管理員專用功能，需要 `ADMIN` 角色權限。所有端點都需要認證。

### `GET /api/v1/admin/users`
獲取所有使用者列表。

- **查詢參數:** `page`, `pageSize`

**回應 (200 OK):** (包含分頁的用戶列表)

---

### `PATCH /api/v1/admin/users/:userId/block`
封鎖指定使用者。

**回應 (200 OK):**
```json
{
    "success": true,
    "message": "用戶已封鎖",
    "data": { "id": 5, "isBlocked": true }
}
```

---

### `PATCH /api/v1/admin/orders/:id/status`
更新訂單狀態。

**請求 Body (`application/json`):**
```json
{
  "status": "SHIPPED" // PENDING, SHIPPED, COMPLETED, CANCELLED
}
```

**回應 (200 OK):**
```json
{
    "success": true,
    "message": "訂單狀態更新成功",
    "data": { "id": 1, "status": "SHIPPED" }
}
```

---

## 7. 聊天系統 (Chat)

### 7.1 REST API

#### `POST /api/v1/chat/rooms`
建立或獲取聊天室。

- **需要認證:** 是
- **角色限制:** `BUYER`, `SELLER`, `ADMIN`
- **請求 Body (`application/json`):**
  - (當前用戶為買家時) `{ "sellerId": 2 }`
  - (當前用戶為賣家時) `{ "buyerId": 3 }`

**回應 (200 OK / 201 Created):**
```json
{
    "success": true,
    "message": "聊天室創建/獲取成功",
    "data": {
        "id": 1,
        "buyerId": 3,
        "sellerId": 2,
        "lastMessage": "你好！",
        "updatedAt": "2023-10-27T12:00:00.000Z"
    }
}
```

---

#### `POST /api/v1/chat/rooms/:roomId/messages`
在聊天室中發送訊息。

- **需要認證:** 是
- **角色限制:** `BUYER`, `SELLER`, `ADMIN`
- **請求 Body (`application/json`):**
```json
{
  "content": "請問這個商品還有貨嗎？"
}
```

**回應 (201 Created):**
```json
{
    "success": true,
    "message": "訊息發送成功",
    "data": {
        "id": 101,
        "content": "請問這個商品還有貨嗎？",
        "senderId": 3,
        "roomId": 1
    }
}
```

### 7.2 WebSocket (Namespace: `/chat`)

客戶端需透過 `Authorization` 標頭或 `auth.token` 傳遞 JWT 進行連線。

**客戶端 -> 伺服器事件:**
- `joinRoom` -> `data: { roomId: number }`
- `leaveRoom` -> `data: { roomId: number }`
- `chatMessage` -> `data: { roomId: number, content: string }`

**伺服器 -> 客戶端事件:**
- `newMessage` -> `payload: { message: Message, room: Room }`
- `error` -> `payload: { message: string }`

---

## 8. 系統健康檢查 (Health Check)

### `GET /api/v1/health`
檢查系統狀態。

- **需要認證:** 否

**回應 (200 OK):**
```json
{
  "success": true,
  "message": "系統健康",
  "data": {
    "status": "ok",
    "timestamp": "2023-10-27T10:00:00.000Z",
    "service": "Zipperoo Backend"
  }
}
```

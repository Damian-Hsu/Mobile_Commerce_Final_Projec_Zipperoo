### 頁面需求

根據 **Zipperoo API v1** (共57個端點) 的功能覆蓋與三種主要角色（Buyer／Seller／Admin），**24 個實體頁面 + 6 個共用子模板（Partial）+ 3 個狀態頁** 即可完成整個行動商務 Web App。
— 採用 **EJS + Bootstrap 5 + jQuery**，並以 **行動優先 (mobile-first)** 的 RWD 格網為基礎。
— 大量重複區塊（導覽列、商品卡片、彈窗 modal、分頁器、錯誤提示）抽成 Partial；每個實體頁只放「該情境獨有」的區塊與 JS 邏輯。
— 更新後的頁面分佈：公共頁面 3、認證頁面 4、買家專用 5、賣家專用 4、管理員專用 5、跨角色共用 3 (個人資料、聊天室、分類管理)。

---

## 1 頁面矩陣一覽

| 編號       | 類別           | 檔名 (views/pages)           | 對應 API                                                                                                                                                              | 功能摘要                                                                 |
| -------- | ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **P-01** | 公共           | **index.ejs**              | `GET /products` (熱門商品), `GET /categories` (分類導覽)                                                                                                              | 首頁：Banner、分類導覽、熱門商品瀑布流                                          |
| **P-02** | 公共           | **products.ejs**           | `GET /products` (含搜尋篩選參數), `GET /categories` (篩選選項)                                                                                                           | 商品搜尋／篩選結果（支援 infinite scroll）                                     |
| **P-03** | 公共           | **product-detail.ejs**     | `GET /products/{id}`, `GET /products/{id}/reviews`                                                                                                                  | 單品詳情 + 圖片輪播 + 評價列表 + 平均評分                                       |
| **P-04** | Auth         | **login.ejs**              | `POST /auth/login`                                                                                                                                                  | 帳密登入；成功後依角色路由                                                      |
| **P-05** | Auth         | **register.ejs**           | `POST /auth/register`                                                                                                                                               | 買家／賣家兩種註冊流程（賣家多店鋪欄位）                                          |
| **P-05a**| Auth         | **forgot-password.ejs**    | `POST /auth/forgot-password`                                                                                                                                        | 請求密碼重設郵件                                                             |
| **P-05b**| Auth         | **reset-password.ejs**     | `POST /auth/reset-password`                                                                                                                                         | 使用收到的token重設密碼                                                      |
| **P-C.1**| 共用 (登入後)  | **profile.ejs**            | `GET /auth/profile`                                                                                                                                                 | 查看個人資料 (買家/賣家/管理員)                                                |
| **P-06** | Buyer        | **cart.ejs**               | `GET /buyers/me/cart`, `POST /buyers/me/cart/items`, `PATCH /buyers/me/cart/items/{itemId}`, `DELETE /buyers/me/cart/items/{itemId}`                                 | 購物車清單、即時小計、批次勾選刪除                                                |
| **P-07** | Buyer        | **checkout.ejs**           | `POST /buyers/me/checkout`                                                                                                                                          | 填寫收件地址、確認商品、下單                                                    |
| **P-08** | Buyer        | **buyer-orders.ejs**       | `GET /buyers/me/orders`                                                                                                                                             | 「我的訂單」(分頁列表), 提供取消訂單按鈕 (觸發 `PATCH /buyers/me/orders/{orderId}/cancel`) |
| **P-09** | Buyer        | **buyer-order-detail.ejs** | `GET /buyers/me/orders/{orderId}`                                                                                                                                   | 單筆訂單詳情＋物流狀態＋前往撰寫/查看評價按鈕 (連結至 P-10 或 P-03)                     |
| **P-10** | Buyer        | **review-form.ejs**        | `POST /products/{productId}/reviews` (創建), `PATCH /reviews/{reviewId}` (更新), `DELETE /reviews/{reviewId}` (刪除)                                                    | 撰寫／編輯／刪除評價表單 (可從商品或訂單跳轉)                                       |
| **P-11** | 共用 (登入後)  | **chat.ejs**               | `POST /chat/rooms`, `GET /chat/rooms`, `GET /chat/rooms/{roomId}/messages`, `POST /chat/rooms/{roomId}/messages` (WebSocket for real-time)                         | 雙欄：聊天室列表/創建 + 即時對話訊息 (買家/賣家/管理員)                               |
| **P-12** | Seller       | **seller-dashboard.ejs**   | `GET /seller/orders`, `GET /seller/products`                                                                                                                        | 儀表卡片（訂單統計：待出貨、完成、銷售額；商品統計：總數、低庫存提醒）                         |
| **P-13** | Seller       | **seller-products.ejs**    | `GET /seller/products`                                                                                                                                              | 商品列表（卡片＋狀態 badge）, 提供編輯連結(至P-14)與刪除按鈕 (觸發 `DELETE /seller/products/{id}`) |
| **P-14** | Seller       | **seller-product-form.ejs**| `POST /seller/products` (創建), `PUT /seller/products/{id}` (更新), `GET /seller/products/{id}` (編輯預填), `GET /categories` (分類選擇), `POST /seller/products/{productId}/variants`, `PUT /seller/variants/{variantId}`, `DELETE /seller/variants/{variantId}` (款式管理), `POST /products/{productId}/images`, `DELETE /images/{imageId}` (圖片管理) | 新增／編輯商品表單（含基本資料、多款式、圖片上傳管理）                                  |
| **P-15** | Seller       | **seller-orders.ejs**      | `GET /seller/orders`, `PATCH /seller/orders/{orderId}/ship`, `PATCH /seller/orders/{orderId}/complete`                                                                | 訂單列表、訂單出貨／完成訂單操作                                                  |
| **P-CM.1**| 共用 (S/A)   | **categories-management.ejs**| `GET /categories`, `POST /categories`, `GET /categories/{id}` (編輯預填), `PATCH /categories/{id}`, `DELETE /categories/{id}`                                         | 分類列表、新增、編輯、刪除分類 (賣家/管理員)                                       |
| **P-16** | Admin        | **admin-dashboard.ejs**    | `GET /admin/logs`, `GET /admin/users`, `GET /admin/products`, `GET /admin/orders`                                                                                     | 系統 KPI 圖表 (用戶數、商品數、訂單數)、最新系統日誌警示                               |
| **P-17** | Admin        | **admin-users.ejs**        | `GET /admin/users`, `DELETE /admin/users/{userId}`, `PATCH /admin/users/{userId}/block`, `PATCH /admin/users/{userId}/unblock`                                        | 會員列表、檢視用戶資料、封鎖／解封用戶                                            |
| **P-18** | Admin        | **admin-products.ejs**     | `GET /admin/products`, `DELETE /admin/products/{productId}`                                                                                                         | 平台所有商品列表、檢視商品詳情、下架/刪除商品                                       |
| **P-A.1**| Admin        | **admin-orders.ejs**       | `GET /admin/orders`                                                                                                                                                 | 平台所有訂單列表                                                               |
| **P-A.2**| Admin        | **admin-order-detail.ejs** | `GET /admin/orders/{id}`, `PATCH /admin/orders/{id}/status`                                                                                                         | 檢視特定訂單詳情、更新訂單狀態                                                    |

> **共 24 頁**：公共頁面 3、認證頁面 4、買家專用 5、賣家專用 4、管理員專用 5、跨角色共用 3 (個人資料、聊天室、分類管理)。

### 子模板 & 元件 Partial（6 個）

| 檔案 (views/partials)   | 作用                                |
| --------------------- | --------------------------------- |
| **navbar.ejs**        | RWD 導覽列：左 Logo、右登入或帳號下拉；折疊為漢堡     |
| **footer.ejs**        | 版權、社群連結、快速導覽                      |
| **product-card.ejs**  | 商品卡片 Partial：圖片、標題、價格、加入購物車       |
| **order-row.ejs**     | 表列訂單 row；Buyer & Seller & Admin 共用  |
| **pagination.ejs**    | 分頁器元件 (Bootstrap pagination + JS) |
| **modal-confirm.ejs** | 通用確認彈窗 (刪除 / 下架 / 出貨 / 取消訂單等)   |

### 狀態頁（3 個）

* `404.ejs` – 找不到頁面
* `500.ejs` – 伺服器錯誤
* `maintenance.ejs` – 系統維護公告

---

## 2 模板與技術棧決策

| 項目                | 選擇                                      | 理由                                               |
| ----------------- | --------------------------------------- | ------------------------------------------------ |
| **模板引擎**          | **EJS**                                 | 與 Express/Nest SSR 無縫；語法單純、可嵌入迴圈與條件；快取友善         |
| **CSS Framework** | **Bootstrap 5 (Sass)**                  | RWD 格線、Components 齊全；自定義主題易；支援 Off-canvas Drawer |
| **JS**            | ES6 + jQuery                            | 快速操作 DOM、套用 AJAX；老舊裝置相容性較佳                       |
| **Chart**         | Chart.js → Admin Dashboard              | 製作銷售額折線、甜甜圈圖                                     |
| **打包**            | Vite or Webpack                         | 前端 JS 模組化 + PostCSS + Babel                      |
| **圖片 Lazy-Load**  | `loading="lazy"` + IntersectionObserver | 減輕行動流量                                           |
| **i18n**          | `i18next`（延後）                           | 若需多語，抽取字串 JSON                                   |

---

## 3 UX / RWD 板型關鍵

1. **Mobile-First**：先設計寬 360 px，步進 `sm 576px / md 768px / lg 992px / xl 1200px`。
2. **商品列表**：

   * Mobile 單欄 → Tablet 2 欄 → Desktop 4 欄
   * 卡片高度一致，使用 CSS aspect-ratio 1:1 圖片避免跳動
3. **導航列**：

   * 0–768 px 用 Off-canvas 漢堡；> 768 px 採水平展開
   * 右側懸浮購物車 icon + badge
4. **表格頁（訂單、用戶）**：

   * Mobile 以 Accordion 展開明細；Desktop 顯示完整欄位
5. **聊天**：

   * Mobile 使用全螢幕 Modal；Desktop 側邊抽屜或分割欄
6. **表單**：Inline 驗證 (`class-validator` 回傳 400) → 前端顯示紅框並捲動到錯誤欄位
7. **顏色**：主色 `#1E88E5`（Zipperoo 藍）、輔助服飾柔色；通用 success / danger / warning 仍沿用 Bootstrap 標準色階
8. **字體**：系統字 + Noto Sans TC；行高 1.5 倍提高觸控命中率

---

## 4 前端程式 (systemClient / chatClient) 關鍵 API

```js
// systemClient.js 片段
class SystemClient {
  constructor() {
    this.base = import.meta.env.VITE_API_BASE || '/api/v1'; // 假設 API base path
    this.token = localStorage.getItem('accessToken');
  }
  async request(method, path, body) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // For GET requests with body (if ever needed, though unusual) or other methods
    const config = {
      method,
      headers,
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      config.body = JSON.stringify(body);
    } else if (body && method === 'GET') {
      // Handle query params for GET if body is used for that (better to use URLSearchParams)
      // This example assumes body is for POST/PUT/PATCH/DELETE
    }

    const res = await fetch(`${this.base}${path}`, config);
    
    // Handle cases where response might not be JSON (e.g., 204 No Content)
    if (res.status === 204) {
      return null; // Or some other indicator of success with no content
    }

    const json = await res.json();
    if (!res.ok || (json.statusCode && json.statusCode >= 400)) { // Check res.ok for network errors, then statusCode for app errors
        // Attempt to refresh token on 401, then retry original request (simplified here)
        if (res.status === 401 && json.message === 'Unauthorized' /* or specific error indicating expired token */) {
            console.warn('Access token expired or invalid. Attempting refresh...');
            // Implement token refresh logic here using POST /auth/refresh-token
            // For simplicity, this example will just throw.
            // await this.refreshToken(); // Assuming this method exists and updates this.token
            // return this.request(method, path, body); // Retry original request
        }
        const errorMessage = json.message || `HTTP error ${res.status}`;
        throw new Error(errorMessage);
    }
    return json.data; // Assuming all successful responses wrap data in 'data' field
  }

  // Auth
  login(payload) {
    return this.request('POST', '/auth/login', payload)
      .then(d => { 
        if (d && d.accessToken) {
          this.token = d.accessToken; 
          localStorage.setItem('accessToken', this.token);
          localStorage.setItem('refreshToken', d.refreshToken); // Store refresh token
          // Optionally store user details from d.user
        }
        return d; 
      });
  }
  register(payload) { return this.request('POST', '/auth/register', payload); }
  logout() { 
    // Server should invalidate the token. Client just removes it.
    const result = this.request('POST', '/auth/logout', {}); // Empty body if not required
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.token = null;
    return result;
  }
  getProfile() { return this.request('GET', '/auth/profile'); }
  forgotPassword(payload) { return this.request('POST', '/auth/forgot-password', payload); }
  resetPassword(payload) { return this.request('POST', '/auth/reset-password', payload); }
  // refreshToken() { /* Implement POST /auth/refresh-token logic */ }


  // Products
  getProducts(params) { // params as object e.g. { page: 1, categoryId: 5 }
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/products${query ? '?' + query : ''}`);
  }
  getProductById(id) { return this.request('GET', `/products/${id}`); }
  getProductReviews(productId, params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/products/${productId}/reviews${query ? '?' + query : ''}`);
  }
  createReview(productId, payload) { return this.request('POST', `/products/${productId}/reviews`, payload); }
  updateReview(reviewId, payload) { return this.request('PATCH', `/reviews/${reviewId}`, payload); }
  deleteReview(reviewId) { return this.request('DELETE', `/reviews/${reviewId}`); }

  // Categories
  getCategories() { return this.request('GET', '/categories'); }
  getCategoryById(id) { return this.request('GET', `/categories/${id}`); }
  getCategoryProducts(id, params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/categories/${id}/products${query ? '?' + query : ''}`);
  }

  // Buyer - Cart
  getCart() { return this.request('GET', '/buyers/me/cart'); }
  addToCart(payload) { return this.request('POST', '/buyers/me/cart/items', payload); }
  updateCartItem(itemId, payload) { return this.request('PATCH', `/buyers/me/cart/items/${itemId}`, payload); }
  removeCartItem(itemId) { return this.request('DELETE', `/buyers/me/cart/items/${itemId}`); }
  
  // Buyer - Checkout & Orders
  checkout(payload) { return this.request('POST', '/buyers/me/checkout', payload); }
  getMyOrders(params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/buyers/me/orders${query ? '?' + query : ''}`);
  }
  getMyOrderById(orderId) { return this.request('GET', `/buyers/me/orders/${orderId}`); }
  cancelMyOrder(orderId) { return this.request('PATCH', `/buyers/me/orders/${orderId}/cancel`, {}); }

  // Seller - Products, Variants, Images
  getSellerProducts(params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/seller/products${query ? '?' + query : ''}`);
  }
  getSellerProductById(id) { return this.request('GET', `/seller/products/${id}`); }
  createSellerProduct(payload) { return this.request('POST', '/seller/products', payload); }
  updateSellerProduct(id, payload) { return this.request('PUT', `/seller/products/${id}`, payload); }
  deleteSellerProduct(id) { return this.request('DELETE', `/seller/products/${id}`); }
  
  addProductVariants(productId, payload) { return this.request('POST', `/seller/products/${productId}/variants`, payload); }
  updateProductVariant(variantId, payload) { return this.request('PUT', `/seller/variants/${variantId}`, payload); }
  deleteProductVariant(variantId) { return this.request('DELETE', `/seller/variants/${variantId}`); }
  
  // Image uploads are typically multipart/form-data, which needs a different request setup
  // async uploadProductImage(productId, formData) { /* Special handling for FormData */ }
  // deleteProductImage(imageId) { return this.request('DELETE', `/images/${imageId}`); }


  // Seller - Orders
  getSellerOrders(params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/seller/orders${query ? '?' + query : ''}`);
  }
  shipSellerOrder(orderId) { return this.request('PATCH', `/seller/orders/${orderId}/ship`, {}); }
  completeSellerOrder(orderId) { return this.request('PATCH', `/seller/orders/${orderId}/complete`, {}); }

  // Seller/Admin - Categories
  createCategory(payload) { return this.request('POST', '/categories', payload); }
  updateCategory(id, payload) { return this.request('PATCH', `/categories/${id}`, payload); }
  deleteCategory(id) { return this.request('DELETE', `/categories/${id}`); }
  
  // Admin - Users
  getAllUsers(params) { 
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/admin/users${query ? '?' + query : ''}`);
  }
  deleteUser(userId) { return this.request('DELETE', `/admin/users/${userId}`); }
  blockUser(userId) { return this.request('PATCH', `/admin/users/${userId}/block`, {}); }
  unblockUser(userId) { return this.request('PATCH', `/admin/users/${userId}/unblock`, {}); }

  // Admin - Products
  getAllProductsAdmin(params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/admin/products${query ? '?' + query : ''}`);
  }
  deleteProductAdmin(productId) { return this.request('DELETE', `/admin/products/${productId}`); }

  // Admin - Orders
  getAllOrdersAdmin(params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/admin/orders${query ? '?' + query : ''}`);
  }
  getOrderByIdAdmin(id) { return this.request('GET', `/admin/orders/${id}`); }
  updateOrderStatusAdmin(id, payload) { return this.request('PATCH', `/admin/orders/${id}/status`, payload); }
  
  // Admin - Logs
  getSystemLogs(params) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/admin/logs${query ? '?' + query : ''}`);
  }

  // ... other API method wrappers
}
export const api = new SystemClient();
```

`chatClient.js` 需處理：

1. `io('/chat', { auth: { token: localStorage.getItem('accessToken') } })` (ensure correct namespace and auth mechanism)
2. `socket.emit('joinRoom', { roomId })` or `socket.emit('createOrJoinRoom', { buyerId, sellerId })` based on API.
3. `socket.on('message', (messagePayload) => { /* update DOM */ })`
4. `socket.on('connect_error', (err) => { /* handle auth errors, e.g., redirect to login or refresh token */ })`
5. `socket.emit('sendMessage', { roomId, content })`

---

## 5 開發流程建議

1. **後端 API 測試通過** → 產出 OpenAPI (Swagger) JSON/YAML。
2. (可選) 前端以 OpenAPI Generator (e.g., swagger-typescript-api, openapi-typescript-codegen) 產生型別與基礎 API Client，確保與後端定義同步。
3. MPA 每頁使用 `api.xxx()` 注入資料，處理 Promise 的 resolved (更新 UI) 與 rejected (顯示錯誤訊息，或導向 `500.ejs` / `404.ejs`) 狀態。
4. Lighthouse / PageSpeed 測試行動裝置分數 > 85 分。

---


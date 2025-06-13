import { Config } from './Config.js';

/**
 * Zipperoo API 客戶端
 * 處理所有前端與後端 API 的通信
 */
class APIClient {
  constructor() {
    const config = new Config();
    this.baseURL = config.apiUrl;
    this.token = localStorage.getItem('accessToken');
    console.log('APIClient initialized with baseURL:', this.baseURL);
  }

  /**
   * 通用 API 請求方法
   */
  async request(method, endpoint, data = null, requireAuth = false) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`API 請求: ${method} ${url}`, data); // 調試用
      const response = await fetch(url, options);
      
      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true, data: null };
      }

      const result = await response.json();
      console.log(`API 回應:`, result); // 調試用

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired
        if (response.status === 401 && requireAuth) {
          this.clearAuth();
          window.location.href = '/login';
          throw new Error('登入已過期，請重新登入');
        }
        
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('API 請求錯誤:', error);
      throw error;
    }
  }

  /**
   * 認證相關方法
   */
  
  // 登入
  async login(account, password) {
    // login 方法現在只負責呼叫 API 並回傳結果
    // 不再儲存 token 或觸發事件
    return this.request('POST', '/auth/login', { account, password });
  }

  // 註冊
  async register(userData) {
    return await this.request('POST', '/auth/register', userData);
  }

  // 登出
  async logout() {
    // logout 方法只負責呼叫 API，不清除本地狀態
    // 本地狀態清除由 AuthManager 統一管理
    return await this.request('POST', '/auth/logout', {}, true);
  }

  // 獲取用戶資料
  async getProfile() {
    return await this.request('GET', '/auth/profile', null, true);
  }

  // 忘記密碼
  async forgotPassword(email) {
    return await this.request('POST', '/auth/forgot-password', { email });
  }

  // 重設密碼
  async resetPassword(token, newPassword) {
    return await this.request('POST', '/auth/reset-password', { token, newPassword });
  }

  // 清除認證資料
  clearAuth() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * 商品相關方法
   */
  
  // 獲取商品列表
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return await this.request('GET', endpoint);
  }

  // 獲取單個商品
  async getProduct(id) {
    return await this.request('GET', `/products/${id}`);
  }

  // 獲取商品評價
  async getProductReviews(productId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products/${productId}/reviews?${queryString}` : `/products/${productId}/reviews`;
    return await this.request('GET', endpoint);
  }

  // 創建商品評價
  async createReview(productId, reviewData) {
    return await this.request('POST', `/products/${productId}/reviews`, reviewData, true);
  }

  // 更新評價
  async updateReview(reviewId, reviewData) {
    return await this.request('PATCH', `/reviews/${reviewId}`, reviewData, true);
  }

  // 刪除評價
  async deleteReview(reviewId) {
    return await this.request('DELETE', `/reviews/${reviewId}`, null, true);
  }

  /**
   * 分類相關方法
   */
  
  // 獲取分類列表
  async getCategories() {
    return await this.request('GET', '/categories');
  }

  // 獲取分類詳情
  async getCategory(id) {
    return await this.request('GET', `/categories/${id}`);
  }

  // 獲取分類下的商品
  async getCategoryProducts(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/categories/${id}/products?${queryString}` : `/categories/${id}/products`;
    return await this.request('GET', endpoint);
  }

  /**
   * 買家購物車相關方法
   */
  
  // 獲取購物車
  async getCart() {
    return await this.request('GET', '/buyers/me/cart', null, true);
  }

  // 添加商品到購物車
  async addToCart(productVariantId, quantity = 1) {
    return await this.request('POST', '/buyers/me/cart/items', { productVariantId, quantity }, true);
  }

  // 更新購物車商品
  async updateCartItem(itemId, updateData) {
    return await this.request('PATCH', `/buyers/me/cart/items/${itemId}`, updateData, true);
  }

  // 刪除購物車商品
  async removeFromCart(itemId) {
    return await this.request('DELETE', `/buyers/me/cart/items/${itemId}`, null, true);
  }

  /**
   * 買家訂單相關方法
   */
  
  // 結帳
  async checkout(orderData) {
    return await this.request('POST', '/buyers/me/checkout', orderData, true);
  }

  // 獲取我的訂單
  async getMyOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/buyers/me/orders?${queryString}` : '/buyers/me/orders';
    return await this.request('GET', endpoint, null, true);
  }

  // 獲取單個訂單
  async getMyOrder(orderId) {
    return await this.request('GET', `/buyers/me/orders/${orderId}`, null, true);
  }

  // 取消訂單
  async cancelOrder(orderId) {
    return await this.request('PATCH', `/buyers/me/orders/${orderId}/cancel`, {}, true);
  }

  /**
   * 賣家相關方法
   */
  
  // 獲取賣家商品列表
  async getSellerProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/seller/products?${queryString}` : '/seller/products';
    return await this.request('GET', endpoint, null, true);
  }

  // 獲取賣家單個商品
  async getSellerProduct(productId) {
    return await this.request('GET', `/seller/products/${productId}`, null, true);
  }

  // 創建商品
  async createProduct(productData) {
    return await this.request('POST', '/seller/products', productData, true);
  }

  // 更新商品
  async updateProduct(productId, productData) {
    return await this.request('PATCH', `/seller/products/${productId}`, productData, true);
  }

  // 刪除商品
  async deleteProduct(productId) {
    return await this.request('DELETE', `/seller/products/${productId}`, null, true);
  }

  // 獲取賣家訂單列表
  async getSellerOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/seller/orders?${queryString}` : '/seller/orders';
    return await this.request('GET', endpoint, null, true);
  }

  // 出貨訂單
  async shipOrder(orderId) {
    return await this.request('PATCH', `/seller/orders/${orderId}/ship`, {}, true);
  }

  // 完成訂單
  async completeOrder(orderId) {
    return await this.request('PATCH', `/seller/orders/${orderId}/complete`, {}, true);
  }

  /**
   * 圖片相關方法
   */
  
  // 上傳商品圖片
  async uploadProductImages(productId, files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      console.log(`API 請求: POST ${this.baseURL}/products/${productId}/images`, `上傳 ${files.length} 個檔案`);
      
      const response = await fetch(`${this.baseURL}/products/${productId}/images`, {
        method: 'POST',
        headers,
        body: formData
      });

      const result = await response.json();
      console.log(`圖片上傳 API 回應:`, result); // 調試用
      
      if (!response.ok) {
        // 檢查是否是權限問題
        if (response.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
          throw new Error('登入已過期，請重新登入');
        }
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('圖片上傳 API 請求錯誤:', error);
      throw error;
    }
  }

  // 刪除圖片
  async deleteImage(imageId) {
    return await this.request('DELETE', `/images/${imageId}`, null, true);
  }

  // 根據檔名獲取圖片
  async getImageByFilename(filename) {
    return await this.request('GET', `/imagesFromName/${encodeURIComponent(filename)}`);
  }

  // 根據ID獲取圖片
  async getImageById(imageId) {
    return await this.request('GET', `/imagesFromID/${imageId}`);
  }

  /**
   * 工具方法
   */
  
  // 檢查是否已登入
  isAuthenticated() {
    return !!this.token;
  }

  // 獲取當前用戶
  getCurrentUser() {
    const userJson = localStorage.getItem('user');
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }

  // 檢查API回應是否成功
  isSuccess(response) {
    return response && (
      response.statusCode === 200 || 
      response.statusCode === 201 || 
      response.statusCode === 204 ||
      response.success === true
    );
  }

  /**
   * 聊天相關方法
   */
  
  // 創建或獲取聊天室
  async createOrGetChatRoom(otherUserId) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('用戶未登入');
    
    console.log('Creating chat room with user:', otherUserId, 'Current user:', user);
    
    const payload = user.role === 'BUYER' ? 
      { sellerId: otherUserId } : 
      { buyerId: otherUserId };
    
    console.log('Chat room payload:', payload);
    
    return await this.request('POST', '/chat/rooms', payload, true);
  }

  // 獲取聊天室列表
  async getChatRooms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/chat/rooms?${queryString}` : '/chat/rooms';
    return await this.request('GET', endpoint, null, true);
  }

  // 獲取聊天室訊息
  async getChatMessages(roomId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/chat/rooms/${roomId}/messages?${queryString}` : `/chat/rooms/${roomId}/messages`;
    return await this.request('GET', endpoint, null, true);
  }

  // 發送訊息
  async sendChatMessage(roomId, content) {
    return await this.request('POST', `/chat/rooms/${roomId}/messages`, { content }, true);
  }

  /**
   * 管理員相關方法
   */
  
  // 獲取用戶列表
  async getAdminUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    return await this.request('GET', endpoint, null, true);
  }

  // 獲取商品列表（管理員視角）
  async getAdminProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/products?${queryString}` : '/admin/products';
    return await this.request('GET', endpoint, null, true);
  }

  // 獲取訂單列表（管理員視角）
  async getAdminOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/orders?${queryString}` : '/admin/orders';
    return await this.request('GET', endpoint, null, true);
  }

  // 獲取系統日誌
  async getAdminLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/logs?${queryString}` : '/admin/logs';
    return await this.request('GET', endpoint, null, true);
  }

  // 刪除用戶
  async deleteUser(userId) {
    return await this.request('DELETE', `/admin/users/${userId}`, null, true);
  }

  // 封禁用戶
  async blockUser(userId) {
    return await this.request('PATCH', `/admin/users/${userId}/block`, {}, true);
  }

  // 解封用戶
  async unblockUser(userId) {
    return await this.request('PATCH', `/admin/users/${userId}/unblock`, {}, true);
  }

  // 刪除商品（管理員）
  async deleteAdminProduct(productId) {
    return await this.request('DELETE', `/admin/products/${productId}`, null, true);
  }

  // 獲取訂單詳情（管理員）
  async getAdminOrder(orderId) {
    return await this.request('GET', `/admin/orders/${orderId}`, null, true);
  }

  // 更新訂單狀態（管理員）
  async updateOrderStatus(orderId, status) {
    return await this.request('PATCH', `/admin/orders/${orderId}/status`, { status }, true);
  }

  // 獲取類別列表（管理員）
  async getAdminCategories(params = {}) {
    // 使用公開的 categories 端點，它包含商品計數
    const result = await this.request('GET', '/categories', null, false);
    
    // 手動處理分頁邏輯，因為後端的 /categories 端點不支援分頁參數
    if (result.data && Array.isArray(result.data)) {
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 10;
      const total = result.data.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = result.data.slice(startIndex, endIndex);
      
      return {
        ...result,
        data: {
          categories: paginatedData,
          pagination: {
            page,
            pageSize,
            total,
            totalPages
          }
        }
      };
    }
    
    return result;
  }

  // 創建類別（管理員）
  async createCategory(categoryData) {
    return await this.request('POST', '/categories', categoryData, true);
  }

  // 更新類別（管理員）
  async updateCategory(categoryId, categoryData) {
    return await this.request('PATCH', `/categories/${categoryId}`, categoryData, true);
  }

  // 刪除類別（管理員）
  async deleteCategory(categoryId) {
    return await this.request('DELETE', `/categories/${categoryId}`, null, true);
  }

  // 獲取類別詳情（管理員）
  async getAdminCategory(categoryId) {
    return await this.request('GET', `/categories/${categoryId}`, null, false);
  }
}

// 導出單例
export default new APIClient(); 
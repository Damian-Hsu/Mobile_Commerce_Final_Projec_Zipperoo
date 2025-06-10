let currentToken = localStorage.getItem('authToken');
let currentUser = null;

// 從localStorage恢復用戶信息
try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
} catch (e) {
    console.log('無法恢復用戶信息');
}

// 更新認證狀態
function updateAuthStatus() {
    const authStatus = document.getElementById('authStatus');
    if (currentToken) {
        const displayName = currentUser ? `${currentUser.username} (${currentUser.role})` : '用戶';
        authStatus.textContent = `已登入: ${displayName}`;
        authStatus.className = 'auth-status logged-in';
    } else {
        authStatus.textContent = '未登入';
        authStatus.className = 'auth-status logged-out';
    }
}

// 初始化
// document.addEventListener('DOMContentLoaded', () => {
//     updateAuthStatus();
//     if (currentToken) {
//         loadChatRooms(); // 如果已登入，則自動載入聊天室
//     } else {
//         // 如果未登入，顯示提示訊息
//         document.getElementById('chatMessages').innerHTML = '<div class="message-placeholder">請先登入以使用聊天功能</div>';
//         document.getElementById('chatInput').style.display = 'none';
//     }
// });

// 切換區塊
function toggleSection(header) {
    const content = header.nextElementSibling;
    const arrow = header.querySelector('span:last-child');
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        content.style.display = 'none';
        arrow.textContent = '▶';
    }
}

// 通用 API 調用函數 (JSON)
async function callAPI(endpoint, method = 'GET', data = null, requireAuth = false) {
    if (requireAuth && !currentToken) {
        showResponse('error', '請先登錄後再操作');
        return { ok: false, error: '未登錄' };
    }

    const serverUrl = document.getElementById('serverUrl').value || 'http://localhost';
    const apiEndpoint = endpoint.startsWith('/api/v1') ? endpoint : `/api/v1${endpoint}`;
    const url = `${serverUrl}${apiEndpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (requireAuth && currentToken) {
        options.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    if (data && (method !== 'GET')) {
        options.body = JSON.stringify(data);
    }

    try {
        showResponse('loading', `正在調用 ${method} ${apiEndpoint}...`);
        
        const response = await fetch(url, options);
        const responseData = await response.text();
        
        let parsedData;
        try {
            parsedData = JSON.parse(responseData);
        } catch {
            parsedData = responseData;
        }

        const status = response.ok ? 'success' : 'error';
        showResponse(status, `狀態: ${response.status}\n\n${JSON.stringify(parsedData, null, 2)}`);
        
        return { ok: response.ok, data: parsedData, status: response.status };
    } catch (error) {
        showResponse('error', `錯誤: ${error.message}`);
        return { ok: false, error: error.message };
    }
}

// FormData API 調用函數 (用於文件上傳)
async function callApiWithFormData(endpoint, method = 'POST', formData, requireAuth = true) {
    if (requireAuth && !currentToken) {
        showResponse('error', '請先登錄後再操作');
        return { ok: false, error: '未登錄' };
    }

    const serverUrl = document.getElementById('serverUrl').value || 'http://localhost';
    const apiEndpoint = endpoint.startsWith('/api/v1') ? endpoint : `/api/v1${endpoint}`;
    const url = `${serverUrl}${apiEndpoint}`;
    
    const options = {
        method,
        headers: {}, // 不要設置 Content-Type, 瀏覽器會自動處理
        body: formData,
    };

    if (requireAuth && currentToken) {
        options.headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
        showResponse('loading', `正在調用 ${method} ${apiEndpoint}...`);
        
        const response = await fetch(url, options);
        const responseData = await response.text();
        
        let parsedData;
        try {
            parsedData = JSON.parse(responseData);
        } catch {
            parsedData = responseData;
        }

        const status = response.ok ? 'success' : 'error';
        showResponse(status, `狀態: ${response.status}\n\n${JSON.stringify(parsedData, null, 2)}`);
        
        return { ok: response.ok, data: parsedData, status: response.status };
    } catch (error) {
        showResponse('error', `錯誤: ${error.message}`);
        return { ok: false, error: error.message };
    }
}

// 顯示響應
function showResponse(type, content) {
    const responseContent = document.getElementById('responseContent');
    responseContent.className = `response-content response-${type}`;
    
    if (typeof content === 'string') {
        responseContent.textContent = content;
        return;
    }
    
    // 如果是購物車數據，特別處理以突出顯示項目 ID
    if (typeof content === 'object' && content.data && content.data.items) {
        let formattedContent = JSON.stringify(content, null, 2);
        
        // 在購物車項目中突出顯示 ID
        formattedContent = formattedContent.replace(
            /"id": (\d+),/g,
            '"id": $1, ← 【購物車項目ID】'
        );
        
        responseContent.innerHTML = `<pre>${formattedContent}</pre>`;
    } else if (typeof content === 'object') {
        responseContent.innerHTML = `<pre>${JSON.stringify(content, null, 2)}</pre>`;
    } else {
        responseContent.textContent = content;
    }
}

// 認證相關函數
async function register() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('userRole').value;
    
    if (!username || !password) {
        showResponse('error', '請填寫用戶名和密碼');
        return;
    }

    const registerData = {
        account: username,
        password: password,
        username: username,
        role: role,
        email: `${username}@example.com` // Add a dummy email for password reset testing
    };

    if (role === 'SELLER') {
        registerData.shopName = `${username}的店鋪`;
        registerData.description = `${username}的店鋪描述`;
    }

    const result = await callAPI('/auth/register', 'POST', registerData);
    if (result.ok) {
        await login(username, password);
    }
}

async function login(acc, pwd) {
    const username = acc || document.getElementById('loginUsername').value;
    const password = pwd || document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showResponse('error', '請填寫用戶名和密碼');
        return;
    }

    const result = await callAPI('/auth/login', 'POST', { account: username, password });
    if (result.ok) {
        currentToken = result.data.data.accessToken;
        currentUser = { 
            username: result.data.data.user.username,
            role: result.data.data.user.role,
            id: result.data.data.user.id
        };
        localStorage.setItem('authToken', currentToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateAuthStatus();
        showResponse('success', `登錄成功！歡迎 ${currentUser.username} (${currentUser.role})`);
        // await loadChatRooms();
    }
}

async function logout() {
    const result = await callAPI('/auth/logout', 'POST', {}, true);
    // Even if the token is already expired (401), we should clear the frontend state
    if (result.ok || result.status === 401) {
        currentToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        updateAuthStatus();
        showResponse('success', '已成功登出');
        // 清理聊天室UI
        // document.getElementById('chatRoomList').innerHTML = '';
        // document.getElementById('chatMessages').innerHTML = '<div class="message-placeholder">請先登入以使用聊天功能</div>';
        // document.getElementById('chatInput').style.display = 'none';
        // document.getElementById('activeChatRoomName').textContent = '選擇一個聊天室';
        // activeChatRoomId = null;
        // chatMessages = [];
    }
}

async function quickLogin(userType) {
    document.getElementById('loginUsername').value = userType;
    document.getElementById('loginPassword').value = '123456';
    await login();
}

async function getProfile() {
    await callAPI('/auth/profile', 'GET', null, true);
}

// 密碼管理函數
async function forgotPassword() {
    const email = document.getElementById('forgotPasswordEmail').value;
    if (!email) {
        showResponse('error', '請填寫電子郵件地址');
        return;
    }
    await callAPI('/auth/forgot-password', 'POST', { email }, false);
}

async function resetPassword() {
    const token = document.getElementById('resetPasswordToken').value;
    const newPassword = document.getElementById('resetPasswordNew').value;
    if (!token || !newPassword) {
        showResponse('error', '請填寫權杖和新密碼');
        return;
    }
    if (newPassword.length < 8) {
        showResponse('error', '新密碼長度至少為8個字符');
        return;
    }
    await callAPI('/auth/reset-password', 'POST', { token, newPassword }, false);
}


// 公共 API
async function getProducts() {
    const page = document.getElementById('productsPage')?.value || 1;
    const pageSize = document.getElementById('productsLimit')?.value || 10;
    const search = document.getElementById('productsSearch')?.value.trim() || '';
    
    const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });
    
    if (search) {
        queryParams.append('search', search);
    }
    
    await callAPI(`/products?${queryParams}`, 'GET', null, false);
}

async function getSingleProduct() {
    const productId = document.getElementById('getSingleProductId').value;
    if (!productId) {
        showResponse('error', '請填寫商品 ID');
        return;
    }
    await callAPI(`/products/${productId}`);
}

async function getCategoryProducts() {
    const categoryId = document.getElementById('getCategoryProductsId').value;
    if (!categoryId) {
        showResponse('error', '請填寫分類 ID');
        return;
    }
    await callAPI(`/categories/${categoryId}/products`);
}

// 分類管理函數
async function getCategories() {
    await callAPI('/categories');
}

async function createCategory() {
    const name = document.getElementById('createCategoryName').value;
    if (!name) {
        showResponse('error', '請填寫分類名稱');
        return;
    }
    await callAPI('/categories', 'POST', { name }, true);
}

async function updateCategory() {
    const categoryId = document.getElementById('updateCategoryId').value;
    const name = document.getElementById('updateCategoryName').value;
    if (!categoryId || !name) {
        showResponse('error', '請填寫分類ID和新名稱');
        return;
    }
    await callAPI(`/categories/${categoryId}`, 'PATCH', { name }, true);
}

async function deleteCategory() {
    const categoryId = document.getElementById('deleteCategoryId').value;
    if (!categoryId) {
        showResponse('error', '請填寫分類 ID');
        return;
    }
    await callAPI(`/categories/${categoryId}`, 'DELETE', null, true);
}

// 買家 API
async function getCart() {
    await callAPI('/buyers/me/cart', 'GET', null, true);
}

async function addToCart() {
    const productVariantId = document.getElementById('addCartProductVariantId').value;
    const quantity = document.getElementById('addCartQuantity').value;
    
    if (!productVariantId) {
        showResponse('error', '請填寫商品款式ID（必須選擇特定的款式，不能只選擇商品）');
        return;
    }
    
    if (!quantity || quantity <= 0) {
        showResponse('error', '請填寫有效的數量（至少為1）');
        return;
    }
    
    await callAPI('/buyers/me/cart/items', 'POST', { 
        productVariantId: parseInt(productVariantId), 
        quantity: parseInt(quantity) 
    }, true);
}

async function updateCartItem() {
    const itemId = document.getElementById('updateCartItemId').value;
    const quantityInput = document.getElementById('updateCartItemQuantity').value;
    const selectedInput = document.getElementById('updateCartItemSelected').value;
    
    if (!itemId) {
        showResponse('error', '請填寫項目ID');
        return;
    }
    
    const updateData = {};
    
    // 如果有填寫數量，則加入數量更新
    if (quantityInput && quantityInput.trim() !== '') {
        const quantity = parseInt(quantityInput);
        if (quantity <= 0) {
            showResponse('error', '數量必須大於0');
            return;
        }
        updateData.quantity = quantity;
    }
    
    // 如果有選擇選中狀態，則加入狀態更新
    if (selectedInput && selectedInput !== '') {
        updateData.isSelected = selectedInput === 'true';
    }
    
    // 至少要有一個更新項目
    if (Object.keys(updateData).length === 0) {
        showResponse('error', '請至少選擇一個要更新的項目');
        return;
    }
    
    await callAPI(`/buyers/me/cart/items/${itemId}`, 'PATCH', updateData, true);
}

async function deleteCartItem() {
    const itemId = document.getElementById('deleteCartItemId').value;
    if (!itemId) {
        showResponse('error', '請填寫項目ID');
        return;
    }
    await callAPI(`/buyers/me/cart/items/${itemId}`, 'DELETE', null, true);
}

async function checkout() {
    const cartItemIdsInput = document.getElementById('checkoutCartItemIds').value.trim();
    
    let requestBody = {};
    
    if (cartItemIdsInput) {
        // 解析指定的購物車項目 ID
        const cartItemIds = cartItemIdsInput
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '')
            .map(id => parseInt(id));
        
        // 驗證所有 ID 都是有效數字
        if (cartItemIds.some(id => isNaN(id))) {
            showResponse('error', '購物車項目 ID 必須為數字，請檢查輸入格式');
            return;
        }
        
        if (cartItemIds.length === 0) {
            showResponse('error', '請輸入有效的購物車項目 ID');
            return;
        }
        
        requestBody.cartItemIds = cartItemIds;
        
        showResponse('info', `將結帳指定的購物車項目: ${cartItemIds.join(', ')}`);
    } else {
        // 沒有指定項目 ID，檢查購物車狀態（向後相容）
        const cartResponse = await callAPI('/buyers/me/cart', 'GET', null, true);
        
        if (cartResponse.ok && cartResponse.data && cartResponse.data.data) {
            const cart = cartResponse.data.data;
            const selectedItems = cart.items.filter(item => item.isSelected);
            
            if (selectedItems.length === 0) {
                showResponse('error', '請先在購物車中選擇要結帳的商品，或指定購物車項目 ID');
                return;
            }
            
            showResponse('info', `將結帳已選中的 ${selectedItems.length} 個商品`);
        }
    }
    
    await callAPI('/buyers/me/checkout', 'POST', requestBody, true);
}

async function getBuyerOrders() {
    await callAPI('/buyers/me/orders', 'GET', null, true);
}

async function getBuyerOrderDetail() {
    const orderId = document.getElementById('getBuyerOrderId').value;
    if (!orderId) {
        showResponse('error', '請填寫訂單 ID');
        return;
    }
    await callAPI(`/buyers/me/orders/${orderId}`, 'GET', null, true);
}

async function cancelOrder() {
    const orderId = document.getElementById('cancelOrderId').value;
    if (!orderId) {
        showResponse('error', '請填寫訂單 ID');
        return;
    }
    await callAPI(`/buyers/me/orders/${orderId}/cancel`, 'PATCH', {}, true);
}

// 賣家 API
async function createProduct() {
    const name = document.getElementById('createProductName').value;
    const description = document.getElementById('createProductDescription').value;
    const categoryId = document.getElementById('createProductCategoryId').value;
    const imageUrls = document.getElementById('createProductImageUrls').value.split(',').map(url => url.trim()).filter(url => url);

    const variantsContainer = document.getElementById('createProductVariantsContainer');
    const variantItems = variantsContainer.getElementsByClassName('variant-item');
    const variants = [];
    for (const item of variantItems) {
        const name = item.querySelector('.variant-name').value;
        const price = item.querySelector('.variant-price').value;
        const stock = item.querySelector('.variant-stock').value;
        if (name && price && stock) {
            variants.push({
                name,
                price: parseInt(price),
                stock: parseInt(stock)
            });
        }
    }

    if (!name || variants.length === 0) {
        showResponse('error', '請填寫商品名稱並至少提供一個完整的款式');
        return;
    }

    const productData = {
        name,
        description,
        variants,
        imageUrls,
    };
    if (categoryId) {
        productData.categoryId = parseInt(categoryId);
    }

    await callAPI('/seller/products', 'POST', productData, true);
}

async function updateProduct() {
    const productId = document.getElementById('updateProductId').value;
    if (!productId) {
        showResponse('error', '請填寫要更新的商品 ID');
        return;
    }

    const name = document.getElementById('updateProductName').value;
    const description = document.getElementById('updateProductDescription').value;
    const price = parseFloat(document.getElementById('updateProductPrice').value);
    const stock = parseInt(document.getElementById('updateProductStock').value);
    
    const productData = {};
    if (name) productData.name = name;
    if (description) productData.description = description;
    if (!isNaN(price)) productData.price = price;
    if (!isNaN(stock)) productData.stock = stock;

    if (Object.keys(productData).length === 0) {
        showResponse('error', '請至少填寫一個要更新的欄位');
        return;
    }

    await callAPI(`/seller/products/${productId}`, 'PUT', productData, true);
}

async function deleteProduct() {
    const productId = document.getElementById('deleteProductId').value;
    if (!productId) {
        showResponse('error', '請填寫要刪除的商品 ID');
        return;
    }
    await callAPI(`/seller/products/${productId}`, 'DELETE', null, true);
}

async function getMyProducts() {
    await callAPI('/seller/products', 'GET', null, true);
}

async function getSellerOrders() {
    await callAPI('/seller/orders', 'GET', null, true);
}

async function shipOrder() {
    const orderId = document.getElementById('shipOrderId').value;
    if (!orderId) {
        showResponse('error', '請填寫訂單 ID');
        return;
    }
    await callAPI(`/seller/orders/${orderId}/ship`, 'PATCH', {}, true);
}

async function completeOrder() {
    const orderId = document.getElementById('completeOrderId').value;
    if (!orderId) {
        showResponse('error', '請填寫訂單 ID');
        return;
    }
    await callAPI(`/seller/orders/${orderId}/complete`, 'PATCH', {}, true);
}


// 圖片管理函數
async function uploadImages() {
    const productId = document.getElementById('uploadImageProductId').value;
    const files = document.getElementById('uploadImageFiles').files;
    
    if (!productId) {
        showResponse('error', '請填寫商品 ID');
        return;
    }
    if (files.length === 0) {
        showResponse('error', '請選擇要上傳的圖片');
        return;
    }
    if (files.length > 8) {
        showResponse('error', '一次最多只能上傳8張圖片');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    await callApiWithFormData(`/products/${productId}/images`, 'POST', formData, true);
}

async function deleteImage() {
    const imageId = document.getElementById('deleteImageId').value;
    if (!imageId) {
        showResponse('error', '請填寫圖片 ID');
        return;
    }
    await callAPI(`/images/${imageId}`, 'DELETE', null, true);
}


// 管理員 API
async function getAllUsers() {
    const page = document.getElementById('adminUsersPage')?.value || 1;
    const pageSize = document.getElementById('adminUsersPageSize')?.value || 10;
    
    const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });
    
    await callAPI(`/admin/users?${queryParams}`, 'GET', null, true);
}

async function deleteUser() {
    const userId = document.getElementById('deleteUserId').value;
    if (!userId) {
        showResponse('error', '請填寫用戶 ID');
        return;
    }
    await callAPI(`/admin/users/${userId}`, 'DELETE', null, true);
}

async function blockUser() {
    const userId = document.getElementById('blockUserId').value;
    if (!userId) {
        showResponse('error', '請填寫用戶 ID');
        return;
    }
    await callAPI(`/admin/users/${userId}/block`, 'PATCH', {}, true);
}

async function unblockUser() {
    const userId = document.getElementById('blockUserId').value;
    if (!userId) {
        showResponse('error', '請填寫用戶 ID');
        return;
    }
    await callAPI(`/admin/users/${userId}/unblock`, 'PATCH', {}, true);
}

async function adminDeleteProduct() {
    const productId = document.getElementById('adminDeleteProductId').value;
    if (!productId) {
        showResponse('error', '請填寫商品 ID');
        return;
    }
    await callAPI(`/admin/products/${productId}`, 'DELETE', null, true);
}

async function getSystemLogs() {
    await callAPI('/admin/logs', 'GET', null, true);
}

// 管理員訂單管理函數
async function adminGetOrders() {
    const page = document.getElementById('adminOrdersPage').value || 1;
    const pageSize = document.getElementById('adminOrdersPageSize').value || 10;
    await callAPI(`/admin/orders?page=${page}&pageSize=${pageSize}`, 'GET', null, true);
}

async function adminGetOrderDetails() {
    const orderId = document.getElementById('adminGetOrderId').value;
    if (!orderId) {
        showResponse('error', '請填寫訂單 ID');
        return;
    }
    await callAPI(`/admin/orders/${orderId}`, 'GET', null, true);
}

async function adminUpdateOrderStatus() {
    const orderId = document.getElementById('adminUpdateOrderId').value;
    const status = document.getElementById('adminUpdateOrderStatusValue').value;
    if (!orderId || !status) {
        showResponse('error', '請填寫訂單ID和狀態');
        return;
    }
    await callAPI(`/admin/orders/${orderId}/status`, 'PATCH', { status }, true);
}


// 聊天 API
async function createOrGetChatRoom() {
    const otherUserId = parseInt(document.getElementById('chatOtherUserId').value);
    
    if (!otherUserId) {
        showResponse('error', '請填寫對方用戶 ID');
        return;
    }

    const data = {};
    if (currentUser && currentUser.role === 'BUYER') {
        data.sellerId = otherUserId;
    } else {
        data.buyerId = otherUserId;
    }

    await callAPI('/chat/rooms', 'POST', data, true);
}

async function getChatRooms() {
    const page = parseInt(document.getElementById('chatRoomsPage').value) || 1;
    const pageSize = parseInt(document.getElementById('chatRoomsPageSize').value) || 10;
    
    await callAPI(`/chat/rooms?page=${page}&pageSize=${pageSize}`, 'GET', null, true);
}

async function getChatMessages() {
    const roomId = parseInt(document.getElementById('chatRoomId').value);
    const page = parseInt(document.getElementById('chatMessagesPage').value) || 1;
    const pageSize = parseInt(document.getElementById('chatMessagesPageSize').value) || 20;
    
    if (!roomId) {
        showResponse('error', '請填寫聊天室 ID');
        return;
    }

    await callAPI(`/chat/rooms/${roomId}/messages?page=${page}&pageSize=${pageSize}`, 'GET', null, true);
}

async function sendMessage() {
    const roomId = parseInt(document.getElementById('sendMessageRoomId').value);
    const content = document.getElementById('sendMessageContent').value.trim();
    
    if (!roomId) {
        showResponse('error', '請填寫聊天室 ID');
        return;
    }

    if (!content) {
        showResponse('error', '請填寫訊息內容');
        return;
    }

    const result = await callAPI(`/chat/rooms/${roomId}/messages`, 'POST', { content }, true);
    
    if (result.ok) {
        document.getElementById('sendMessageContent').value = '';
    }
}

// 評價 API
async function createReview() {
    const productId = parseInt(document.getElementById('reviewProductId').value);
    const score = parseInt(document.getElementById('reviewScore').value);
    const comment = document.getElementById('reviewComment').value.trim();
    
    if (!productId || !score) {
        showResponse('error', '請填寫商品ID和評分');
        return;
    }

    if (score < 1 || score > 5) {
        showResponse('error', '評分必須在1-5之間');
        return;
    }

    const reviewData = { score };
    if (comment) {
        reviewData.comment = comment;
    }

    await callAPI(`/products/${productId}/reviews`, 'POST', reviewData, true);
}

async function getProductReviews() {
    const productId = document.getElementById('getReviewsProductId').value;
    if (!productId) {
        showResponse('error', '請填寫商品 ID');
        return;
    }
    await callAPI(`/products/${productId}/reviews`, 'GET', null, false);
}

async function editReview() {
    const reviewId = document.getElementById('editReviewId').value;
    const scoreInput = document.getElementById('editReviewScore').value;
    const comment = document.getElementById('editReviewComment').value.trim();
    const score = scoreInput ? parseInt(scoreInput) : null;

    if (!reviewId) {
        showResponse('error', '請填寫評價 ID');
        return;
    }
    
    const reviewData = {};
    if (score && score >=1 && score <= 5) {
        reviewData.score = score;
    }
    if (comment) {
        reviewData.comment = comment;
    }

    if (Object.keys(reviewData).length === 0) {
        showResponse('error', '請填寫要更新的評分或內容');
        return;
    }

    await callAPI(`/reviews/${reviewId}`, 'PATCH', reviewData, true);
}

async function deleteReview() {
    const reviewId = document.getElementById('deleteReviewId').value;
    if (!reviewId) {
        showResponse('error', '請填寫評價 ID');
        return;
    }
    await callAPI(`/reviews/${reviewId}`, 'DELETE', null, true);
}

// Variant Management
function addVariant(isForAdd = false) {
    const containerId = isForAdd ? 'addProductVariantsContainer' : 'createProductVariantsContainer';
    const container = document.getElementById(containerId);
    const variantItem = document.createElement('div');
    variantItem.className = 'variant-item';
    variantItem.innerHTML = `
        <input type="text" class="form-control variant-name" placeholder="款式名稱">
        <input type="number" class="form-control variant-price" placeholder="價格">
        <input type="number" class="form-control variant-stock" placeholder="庫存">
        <button class="btn btn-danger btn-sm" onclick="removeVariant(this)">移除</button>
    `;
    container.appendChild(variantItem);
}

function removeVariant(button) {
    button.parentElement.remove();
}

async function addProductVariants() {
    const productId = document.getElementById('addProductVariantsProductId').value;
    if (!productId) {
        showResponse('error', '請提供商品ID');
        return;
    }

    const variantsContainer = document.getElementById('addProductVariantsContainer');
    const variantItems = variantsContainer.getElementsByClassName('variant-item');
    const variants = [];
    for (const item of variantItems) {
        const name = item.querySelector('.variant-name').value;
        const price = item.querySelector('.variant-price').value;
        const stock = item.querySelector('.variant-stock').value;
        if (name && price && stock) {
            variants.push({
                name,
                price: parseInt(price),
                stock: parseInt(stock)
            });
        }
    }

    if (variants.length === 0) {
        showResponse('error', '請至少提供一個完整的款式');
        return;
    }

    await callAPI(`/seller/products/${productId}/variants`, 'POST', { variants }, true);
}

async function updateVariant() {
    const variantId = document.getElementById('updateVariantId').value;
    if (!variantId) {
        showResponse('error', '請提供款式ID');
        return;
    }
    const name = document.getElementById('updateVariantName').value;
    const price = document.getElementById('updateVariantPrice').value;
    const stock = document.getElementById('updateVariantStock').value;
    
    const data = {};
    if (name) data.name = name;
    if (price) data.price = parseInt(price);
    if (stock) data.stock = parseInt(stock);

    if (Object.keys(data).length === 0) {
        showResponse('error', '請至少提供一個要更新的欄位');
        return;
    }

    await callAPI(`/seller/variants/${variantId}`, 'PUT', data, true);
}

async function deleteVariant() {
    const variantId = document.getElementById('deleteVariantId').value;
    if (!variantId) {
        showResponse('error', '請提供款式ID');
        return;
    }
    await callAPI(`/seller/variants/${variantId}`, 'DELETE', null, true);
}

// --- Chat Demo Functions ---
let chatMessages = [];
let activeChatRoomId = null;

// 在頁面載入時自動載入聊天室列表
// async function loadChatRooms() {
//     if (!currentToken) return;
//     const result = await callAPI('/chat/rooms', 'GET', null, true);
//     const chatRoomList = document.getElementById('chatRoomList');
    
//     if (result.ok && result.data.data && result.data.data.data) {
//         const rooms = result.data.data.data;
//         chatRoomList.innerHTML = '';
//         if (rooms.length === 0) {
//             chatRoomList.innerHTML = '<li>沒有可用的聊天室。</li>';
//             return;
//         }
//         rooms.forEach(room => {
//             const otherUser = room.buyer.id === currentUser.id ? room.seller : room.buyer;
//             const roomName = otherUser.username;
//             const lastMessage = room.messages.length > 0 ? room.messages[0].content : '尚無訊息';
//             const li = document.createElement('li');
//             li.dataset.roomId = room.id;
//             if (room.id === activeChatRoomId) li.className = 'active';
//             li.onclick = () => {
//                 document.querySelectorAll('#chatRoomList li').forEach(item => item.classList.remove('active'));
//                 li.classList.add('active');
//                 selectChatRoom(room.id, roomName);
//             };
//             li.innerHTML = `<div class="chat-room-name">${roomName}</div><div class="chat-room-preview">${lastMessage}</div>`;
//             chatRoomList.appendChild(li);
//         });
//     } else {
//         chatRoomList.innerHTML = '<li>無法載入聊天室列表。</li>';
//     }
// }

async function selectChatRoom(roomId, otherUsername) {
    activeChatRoomId = roomId;
    document.getElementById('activeChatRoomName').textContent = otherUsername;
    document.getElementById('chatInput').style.display = 'flex';
    document.getElementById('chatMessages').innerHTML = '<div class="message-placeholder">正在載入訊息...</div>';
    await getChatMessages(roomId);
}

async function getChatMessages(roomId) {
    const result = await callAPI(`/chat/rooms/${roomId}/messages`, 'GET', null, true);
    if (result.ok && result.data.data && result.data.data.data) {
        chatMessages = result.data.data.data;
    } else {
        chatMessages = [];
    }
    renderChatMessages();
}

function renderChatMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) {
        messagesContainer.innerHTML = '<div class="message-placeholder">沒有訊息。</div>';
        return;
    }
    chatMessages.forEach(msg => {
        const msgElement = document.createElement('div');
        const isMe = msg.fromUser.id === currentUser.id;
        msgElement.className = `chat-message ${isMe ? 'me' : 'other'}`;
        msgElement.innerHTML = `
            <div class="message-sender">${msg.fromUser.username}</div>
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(msgElement);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !activeChatRoomId) return;

    input.value = '';
    const result = await callAPI(`/chat/rooms/${activeChatRoomId}/messages`, 'POST', { content }, true);

    if (result.ok && result.data.data) {
        chatMessages.push(result.data.data);
        renderChatMessages();
    } else {
        showResponse('error', '訊息發送失敗');
        input.value = content; // Restore message on failure
    }
}


function createContextMenu(x, y, messageId, currentContent) {
    const menu = document.createElement('div');
    menu.id = 'chatContextMenu';
    menu.className = 'context-menu';
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;

    const editButton = document.createElement('div');
    editButton.textContent = '修改';
    editButton.onclick = () => {
        editChatMessage(messageId, currentContent);
        menu.remove();
    };

    const deleteButton = document.createElement('div');
    deleteButton.textContent = '刪除';
    deleteButton.onclick = async () => {
        await deleteChatMessage(messageId);
        menu.remove();
    };

    menu.appendChild(editButton);
    menu.appendChild(deleteButton);
    return menu;
}

function editChatMessage(messageId, currentContent) {
    const messageBubble = document.querySelector(`.chat-message[data-message-id='${messageId}'] .message-bubble`);
    if (!messageBubble) return;

    messageBubble.innerHTML = ''; // Clear current content

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentContent;
    input.className = 'edit-message-input';
    
    input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const newContent = input.value.trim();
            if (newContent && newContent !== currentContent) {
                // Call API to update message
                const result = await callAPI(`/chat/messages/${messageId}`, 'PUT', { content: newContent }, true);
                if (result.ok) {
                    // Update local message and re-render
                    const msgIndex = chatMessages.findIndex(m => m.id === messageId);
                    if (msgIndex > -1) {
                        chatMessages[msgIndex].content = newContent;
                    }
                    renderChatMessages();
                }
            } else {
                 // Restore original content if no change
                 messageBubble.textContent = currentContent;
            }
        }
    });

    input.addEventListener('blur', () => { // If user clicks away
        messageBubble.textContent = currentContent;
    });

    messageBubble.appendChild(input);
    input.focus();
}

async function deleteChatMessage(messageId) {
    const result = await callAPI(`/chat/messages/${messageId}`, 'DELETE', null, true);
    if (result.ok) {
        chatMessages = chatMessages.filter(m => m.id !== messageId);
        renderChatMessages();
    }
}

// Override login/logout to load/clear chat rooms
// const originalLogin = login;
// login = async (acc, pwd) => {
//     await originalLogin(acc, pwd);
//     if (currentToken) {
//         await loadChatRooms();
//     }
// };

const originalLogout = logout;
logout = async () => {
    await originalLogout();
    document.getElementById('chatRoomList').innerHTML = '';
    document.getElementById('chatMessages').innerHTML = '<div class="message-placeholder">請先登入以使用聊天功能</div>';
    document.getElementById('chatInput').style.display = 'none';
    activeChatRoomId = null;
    chatMessages = [];
};

// --- END Chat Demo Functions --- 

async function getAdminProducts() {
    const page = document.getElementById('adminProductsPage')?.value || 1;
    const pageSize = document.getElementById('adminProductsPageSize')?.value || 10;
    
    const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });
    
    await callAPI(`/admin/products?${queryParams}`, 'GET', null, true);
}

// 健康檢查 API
async function checkHealth() {
    await callAPI('/health', 'GET', null, false);
}

// 圖片管理 API
async function getImageByFilename() {
    const filename = document.getElementById('getImageByName').value.trim();
    if (!filename) {
        showResponse('error', '請填寫圖片檔名');
        return;
    }
    await callAPI(`/imagesFromName/${encodeURIComponent(filename)}`, 'GET', null, false);
}

async function getImageById() {
    const imageId = document.getElementById('getImageById').value;
    if (!imageId) {
        showResponse('error', '請填寫圖片 ID');
        return;
    }
    await callAPI(`/imagesFromID/${imageId}`, 'GET', null, false);
} 
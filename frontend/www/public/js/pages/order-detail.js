// 訂單詳情頁面邏輯
class OrderDetailPage {
    constructor() {
        this.orderId = this.getOrderIdFromUrl();
        this.orderData = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrderDetail();
    }

    // 從URL獲取訂單ID
    getOrderIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    // 綁定事件處理器
    bindEvents() {
        // 取消訂單按鈕
        const cancelBtn = document.getElementById('cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.showCancelModal());
        }

        // 聯絡賣家按鈕
        const contactBtn = document.getElementById('contact-seller-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => this.contactSeller());
        }

        // Modal相關事件
        this.bindModalEvents();
    }

    // 綁定Modal事件
    bindModalEvents() {
        const cancelBtn = document.getElementById('cancel-order-btn');
        const modal = document.getElementById('cancel-modal');
        const closeBtn = modal?.querySelector('.close');
        const cancelModalBtn = document.getElementById('cancel-modal-close');
        const confirmBtn = document.getElementById('confirm-cancel-order');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.showCancelModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCancelModal());
            }

        if (cancelModalBtn) {
            cancelModalBtn.addEventListener('click', () => this.hideCancelModal());
            }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.cancelOrder());
        }

        // 點擊modal外部關閉
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCancelModal();
                }
            });
        }
    }

    // 載入訂單詳情
    async loadOrderDetail() {
        try {
            const response = await apiClient.getMyOrder(this.orderId);
            
            if (response.statusCode === 200) {
                this.orderData = response.data;
                this.renderOrderDetail();
            } else {
                this.showError('載入訂單詳情失敗：' + response.message);
            }
        } catch (error) {
            console.error('載入訂單詳情失敗:', error);
            this.showError('載入訂單詳情失敗，請稍後再試');
        }
    }

    // 渲染訂單詳情
    async renderOrderDetail() {
        if (!this.orderData) return;

        // 基本訂單資訊
        this.renderOrderBasicInfo();
        
        // 配送資訊
        this.renderShippingInfo();
        
        // 付款資訊
        this.renderPaymentInfo();
        
        // 賣家資訊
        this.renderSellerInfo();
        
        // 商品列表
        this.renderOrderItems();
        
        // 金額明細
        this.renderAmountBreakdown();
        
        // 訂單狀態相關UI
        this.renderOrderStatus();
        
        // 評價區域
        await this.renderReviewSection();
    }

    // 渲染基本訂單資訊
    renderOrderBasicInfo() {
        const order = this.orderData;
        
        document.getElementById('order-id').textContent = order.id;
        document.getElementById('order-date').textContent = this.formatDate(order.createdAt);
        document.getElementById('order-total').textContent = this.formatPrice(order.totalAmount);
    }

    // 渲染配送資訊
    renderShippingInfo() {
        const order = this.orderData;
        
        document.getElementById('recipient-name').textContent = order.recipientName || '-';
        document.getElementById('recipient-phone').textContent = order.recipientPhone || '-';
        
        const fullAddress = [order.city, order.district, order.address].filter(Boolean).join(' ');
        document.getElementById('shipping-address').textContent = fullAddress || '-';
        document.getElementById('shipping-notes').textContent = order.notes || '無';
    }

    // 渲染付款資訊
    renderPaymentInfo() {
        const order = this.orderData;
        const paymentMethods = {
            'CASH_ON_DELIVERY': '貨到付款',
            'CREDIT_CARD': '信用卡',
            'BANK_TRANSFER': '銀行轉帳',
            'DIGITAL_WALLET': '數位錢包'
        };
        
        document.getElementById('payment-method').textContent = 
            paymentMethods[order.paymentMethod] || order.paymentMethod;
    }

    // 渲染賣家資訊
    renderSellerInfo() {
        const seller = this.orderData.seller;
        
        document.getElementById('seller-shop-name').textContent = seller.shopName || seller.username;
        document.getElementById('seller-username').textContent = `@${seller.username}`;
    }

    // 渲染商品列表
    renderOrderItems() {
        const container = document.getElementById('order-items');
        const items = this.orderData.items;

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="text-center">沒有商品資訊</p>';
            return;
        }

        const itemsHtml = items.map(item => this.createOrderItemHtml(item)).join('');
        container.innerHTML = itemsHtml;
    }

    // 創建單個商品項目HTML
    createOrderItemHtml(item) {
        const product = item.productVariant.product;
        const variant = item.productVariant;
        const imageUrl = window.UIUtils.getProductImageUrl(product);

        return `
            <div class="order-item">
                <img src="${imageUrl}" alt="${product.name}" class="item-image" 
                     onerror="this.src='/images/placeholder.svg'">
                <div class="item-details">
                    <h6 class="item-name">${product.name}</h6>
                    <p class="item-variant">規格：${variant.name}</p>
                    <div class="item-price-qty">
                        <span class="item-price">${this.formatPrice(item.unitPrice)}</span>
                        <span class="item-quantity">數量：${item.quantity}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染金額明細
    renderAmountBreakdown() {
        const order = this.orderData;
        
        document.getElementById('subtotal').textContent = this.formatPrice(order.totalAmount);
        document.getElementById('final-total').textContent = this.formatPrice(order.totalAmount);
    }

    // 渲染訂單狀態
    renderOrderStatus() {
        const order = this.orderData;
        const statusBadge = document.getElementById('order-status');
        const cancelBtn = document.getElementById('cancel-order-btn');

        // 設置狀態樣式和文字
        const statusConfig = {
            'UNCOMPLETED': { text: '處理中', class: 'uncompleted' },
            'COMPLETED': { text: '已完成', class: 'completed' },
            'CANCELED': { text: '已取消', class: 'canceled' }
        };

        const config = statusConfig[order.status] || { text: order.status, class: 'uncompleted' };
        
        statusBadge.className = `status-badge ${config.class}`;
        statusBadge.querySelector('.status-text').textContent = config.text;

        // 顯示/隱藏取消按鈕
        if (order.status === 'UNCOMPLETED' && cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
        }
    }

    // 渲染評價區域
    async renderReviewSection() {
        const order = this.orderData;
        const reviewSection = document.getElementById('review-section');
        
        // 只有已完成的訂單才顯示評價區域
        if (order.status !== 'COMPLETED') {
            reviewSection.style.display = 'none';
            return;
        }

        reviewSection.style.display = 'block';
        await this.renderOrderProductsList();
    }

    // 渲染訂單商品列表（用於評價）
    renderOrderProductsList() {
        const container = document.getElementById('order-products-list');
        const items = this.orderData.items;

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="text-muted">此訂單沒有商品</div>';
            return;
        }

        const productsHtml = items.map(item => this.createProductReviewLinkHtml(item)).join('');
        container.innerHTML = productsHtml;
    }

    // 創建商品評價連結HTML
    createProductReviewLinkHtml(item) {
        const product = item.productVariant.product;
        const variant = item.productVariant;
        const imageUrl = window.UIUtils.getProductImageUrl(product);

        return `
            <div class="product-review-link">
                <div class="product-info">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                         onerror="this.src='/images/placeholder.svg'">
                    <div class="product-details">
                        <h6>${product.name}</h6>
                        <p class="text-muted">規格：${variant.name} | 數量：${item.quantity}</p>
                    </div>
                </div>
                <div class="review-action">
                    <a href="/products/${product.id}#reviews" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-star me-1"></i>前往評價
                    </a>
                </div>
            </div>
        `;
    }

    // 顯示Toast通知
    showToast(message, type = 'info') {
        // 創建toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d1f2eb' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#00b894' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 300px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 3秒後自動移除
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
        }
            }, 300);
        }, 3000);
    }

    // 顯示取消訂單Modal
    showCancelModal() {
        const modal = document.getElementById('cancel-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // 隱藏取消訂單Modal
    hideCancelModal() {
        const modal = document.getElementById('cancel-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 取消訂單
    async cancelOrder() {
        try {
            const response = await apiClient.patch(`/buyers/me/orders/${this.orderId}/cancel`);
            
            if (response.success) {
                alert('訂單已成功取消');
                this.hideCancelModal();
                this.loadOrderDetail(); // 重新載入訂單狀態
            } else {
                alert('取消訂單失敗：' + response.message);
            }
        } catch (error) {
            console.error('取消訂單失敗:', error);
            alert('取消訂單失敗，請稍後再試');
        }
    }

    // 聯絡賣家
    contactSeller() {
        if (this.orderData && this.orderData.seller) {
            const sellerId = this.orderData.seller.id;
            // 跳轉到聊天頁面或開啟聊天視窗
            window.location.href = `/chat?seller=${sellerId}`;
        }
    }

    // 格式化價格
    formatPrice(amount) {
        return `NT$ ${(amount).toLocaleString()}`;
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 顯示錯誤訊息
    showError(message) {
        const container = document.querySelector('.container');
        const errorHtml = `
            <div class="error-message" style="
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #f5c6cb;
            ">
                <h4>載入失敗</h4>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">重新載入</button>
            </div>
        `;
        container.innerHTML = errorHtml;
    }
}

// 等待依賴準備就緒
async function waitForDependencies() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.apiClient && window.UIUtils && window.Config) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    throw new Error('依賴組件載入超時');
}

// 初始化頁面
function initializePage() {
    if (window.UIUtils && window.apiClient && window.Config) {
        window.orderDetailPage = new OrderDetailPage();
    } else {
        waitForDependencies().then(() => {
            window.orderDetailPage = new OrderDetailPage();
        }).catch(error => {
            console.error('初始化訂單詳情頁面失敗:', error);
        });
    }
}

// 監聽App初始化事件
window.addEventListener('appInitialized', () => {
    initializePage();
});

// 頁面載入完成後檢查並初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.App && window.App.initialized) {
        initializePage();
    }
}); 
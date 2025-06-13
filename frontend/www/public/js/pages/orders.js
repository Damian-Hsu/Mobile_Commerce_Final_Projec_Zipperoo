// 訂單列表頁面邏輯
class OrdersPage {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentStatus = 'all';
        this.orders = [];
        this.totalPages = 0;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOrders();
    }

    // 綁定事件處理器
    bindEvents() {
        // 狀態篩選按鈕
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleStatusFilter(e.target);
            });
        });
    }

    // 處理狀態篩選
    handleStatusFilter(btn) {
        // 更新按鈕狀態
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 更新當前狀態和重置頁碼
        this.currentStatus = btn.dataset.status;
        this.currentPage = 1;

        // 重新載入訂單
        this.loadOrders();
    }

    // 載入訂單列表
    async loadOrders() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize
            });

            const response = await apiClient.getMyOrders({
                page: this.currentPage,
                pageSize: this.pageSize
            });
            
            console.log('API 回應完整結構:', response);
            if (response.statusCode === 200 && response.data) {
                this.orders = response.data.data || [];
                this.totalPages = response.data.meta?.totalPages || 1;
                
                console.log('解析後的訂單數據:', this.orders);
                console.log('總頁數:', this.totalPages);
                
                // 根據狀態篩選
                this.filterOrdersByStatus();
                this.renderOrders();
                this.renderPagination();
            } else {
                console.log('API 回應失敗:', response);
                this.showError('無法載入訂單列表：' + (response.message || '未知錯誤'));
            }
        } catch (error) {
            console.error('載入訂單失敗:', error);
            this.showError('載入訂單失敗，請稍後再試');
        }
    }

    // 根據狀態篩選訂單
    filterOrdersByStatus() {
        if (this.currentStatus === 'all') {
            this.filteredOrders = this.orders;
        } else {
            this.filteredOrders = this.orders.filter(order => order.status === this.currentStatus);
        }
    }

    // 渲染訂單列表
    renderOrders() {
        const container = document.getElementById('orders-list');
        const emptyState = document.getElementById('empty-state');
        const paginationContainer = document.getElementById('pagination-container');

        if (!this.filteredOrders || this.filteredOrders.length === 0) {
            // 顯示空狀態
            container.style.display = 'none';
            paginationContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        // 隱藏空狀態，顯示訂單列表
        emptyState.style.display = 'none';
        container.style.display = 'flex';
        paginationContainer.style.display = 'flex';

        // 生成訂單卡片HTML
        const ordersHtml = this.filteredOrders.map(order => this.createOrderCardHtml(order)).join('');
        container.innerHTML = ordersHtml;

        // 為每個訂單卡片綁定點擊事件
        const orderCards = container.querySelectorAll('.order-card');
        orderCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                this.navigateToOrderDetail(this.filteredOrders[index].id);
            });
        });
    }

    // 創建訂單卡片HTML
    createOrderCardHtml(order) {
        const statusConfig = {
            'UNCOMPLETED': { text: '處理中', class: 'uncompleted' },
            'COMPLETED': { text: '已完成', class: 'completed' },
            'CANCELED': { text: '已取消', class: 'canceled' }
        };

        const config = statusConfig[order.status] || { text: order.status, class: 'uncompleted' };
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>訂單編號：${order.id}</h3>
                        <p class="order-date">${this.formatDate(order.createdAt)}</p>
                    </div>
                    <div class="order-status ${config.class}">
                        ${config.text}
                    </div>
                </div>
                
                ${this.createSellerInfoHtml(order.seller)}
                
                <div class="order-items-preview">
                    ${this.createItemsPreviewHtml(order.items)}
                </div>
                
                <div class="order-total">
                    <span class="total-label">訂單總額</span>
                    <span class="total-amount">${this.formatPrice(order.totalAmount)}</span>
                </div>
            </div>
        `;
    }

    // 創建賣家資訊HTML
    createSellerInfoHtml(seller) {
        return `
            <div class="seller-info">
                <div>
                    <p class="shop-name">${seller.shopName || seller.username}</p>
                    <p class="username">@${seller.username}</p>
                </div>
            </div>
        `;
    }

    // 創建商品預覽HTML
    createItemsPreviewHtml(items) {
        if (!items || items.length === 0) {
            return '<div class="items-count">沒有商品資訊</div>';
        }

        // 顯示前3個商品，如果超過則顯示 "...等N個商品"
        const visibleItems = items.slice(0, 3);
        const remainingCount = items.length - 3;

        let html = visibleItems.map(item => {
            const product = item.productVariant.product;
            const variant = item.productVariant;
            const imageUrl = window.UIUtils.getProductImageUrl(product);

            return `
                <div class="item-preview">
                    <img src="${imageUrl}" alt="${product.name}" class="item-image" 
                         onerror="this.src='/images/placeholder.svg'">
                    <div class="item-details">
                        <p class="item-name">${product.name}</p>
                        <p class="item-variant">${variant.name} × ${item.quantity}</p>
                    </div>
                </div>
            `;
        }).join('');

        if (remainingCount > 0) {
            html += `<div class="items-count">...等${remainingCount}個商品</div>`;
        }

        return html;
    }

    // 渲染分頁
    renderPagination() {
        const container = document.getElementById('pagination-container');
        
        if (this.totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        
        let paginationHtml = '<div class="pagination">';
        
        // 上一頁按鈕
        const prevDisabled = this.currentPage <= 1;
        paginationHtml += `
            <button class="pagination-btn" ${prevDisabled ? 'disabled' : ''} 
                    onclick="ordersPage.changePage(${this.currentPage - 1})">
                ‹ 上一頁
            </button>
        `;

        // 頁碼按鈕
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" onclick="ordersPage.changePage(1)">1</button>`;
            if (startPage > 2) {
                paginationHtml += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            paginationHtml += `
                <button class="pagination-btn ${isActive ? 'active' : ''}" 
                        onclick="ordersPage.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHtml += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHtml += `<button class="pagination-btn" onclick="ordersPage.changePage(${this.totalPages})">${this.totalPages}</button>`;
        }

        // 下一頁按鈕
        const nextDisabled = this.currentPage >= this.totalPages;
        paginationHtml += `
            <button class="pagination-btn" ${nextDisabled ? 'disabled' : ''} 
                    onclick="ordersPage.changePage(${this.currentPage + 1})">
                下一頁 ›
            </button>
        `;

        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;
    }

    // 切換頁面
    changePage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }

        this.currentPage = page;
        this.loadOrders();
    }

    // 導航到訂單詳情頁面
    navigateToOrderDetail(orderId) {
        window.location.href = `/orders/${orderId}`;
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
        const container = document.getElementById('orders-list');
        const errorHtml = `
            <div class="error-message" style="
                background: #f8d7da;
                color: #721c24;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                border: 1px solid #f5c6cb;
            ">
                <h4>載入失敗</h4>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">重新載入</button>
            </div>
        `;
        container.innerHTML = errorHtml;

        // 隱藏分頁和空狀態
        document.getElementById('pagination-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
    }
}

// 全域變數，用於分頁按鈕的回調
let ordersPage;

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
        ordersPage = new OrdersPage();
    } else {
        waitForDependencies().then(() => {
            ordersPage = new OrdersPage();
        }).catch(error => {
            console.error('初始化訂單頁面失敗:', error);
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
class SellerOrders {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.searchQuery = '';
        this.statusFilter = '';
        this.dateFilter = '';
        this.orders = [];
        this.allOrders = []; // 保存所有訂單的原始數據
        this.totalOrders = 0;
    }

    waitForApiClient() {
        return new Promise((resolve) => {
            if (window.apiClient) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (window.apiClient) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    async init() {
        await this.waitForApiClient();
        
        // 檢查用戶認證
        if (!window.apiClient.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        this.setupEventListeners();
        await this.loadOrders();
    }

    setupEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput && searchBtn) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
            
            searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }

        // 狀態篩選
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadOrders();
            });
        }

        // 日期篩選
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.dateFilter = e.target.value;
                this.currentPage = 1;
                this.loadOrders();
            });
        }
    }

    // 統計項目篩選功能
    filterByStatus(status) {
        // 更新狀態篩選器
        this.statusFilter = status;
        this.currentPage = 1;
        
        // 更新統計項目的 active 狀態
        document.querySelectorAll('.stat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 設置當前選中的統計項目為 active
        const activeItem = document.querySelector(`[data-filter="${status}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // 同步狀態篩選下拉選單
        const statusFilterSelect = document.getElementById('status-filter');
        if (statusFilterSelect) {
            statusFilterSelect.value = status;
        }
        
        // 重新載入訂單
        this.loadOrders();
    }

    handleSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            this.searchQuery = searchInput.value.trim();
            this.currentPage = 1;
            this.loadOrders();
        }
    }

    async loadOrders() {
        try {
            this.showLoading();

            const response = await window.apiClient.getSellerOrders({
                page: this.currentPage,
                pageSize: this.pageSize
            });

            if (response.statusCode === 200 && response.data) {
                // 保存所有訂單的原始數據
                this.allOrders = response.data.data || [];
                
                // 前端過濾
                let filteredOrders = this.allOrders;
                
                // 搜索過濾
                if (this.searchQuery) {
                    filteredOrders = filteredOrders.filter(order => 
                        order.id.toString().includes(this.searchQuery) ||
                        order.buyer?.username?.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                }
                
                // 狀態過濾
                if (this.statusFilter) {
                    filteredOrders = filteredOrders.filter(order => 
                        order.status === this.statusFilter
                    );
                }
                
                // 日期過濾
                if (this.dateFilter) {
                    const now = new Date();
                    filteredOrders = filteredOrders.filter(order => {
                        const orderDate = new Date(order.createdAt);
                        switch (this.dateFilter) {
                            case 'today':
                                return orderDate.toDateString() === now.toDateString();
                            case 'week':
                                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                                return orderDate >= weekAgo;
                            case 'month':
                                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                                return orderDate >= monthAgo;
                            case 'quarter':
                                const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                                return orderDate >= quarterAgo;
                            default:
                                return true;
                        }
                    });
                }
                
                this.orders = filteredOrders;
                this.totalOrders = filteredOrders.length;
                
                this.updateStats(); // 使用原始數據計算統計
                this.renderOrders();
                this.updatePagination({
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    total: this.totalOrders,
                    totalPages: Math.ceil(this.totalOrders / this.pageSize)
                });
            } else {
                throw new Error(response.message || '載入訂單失敗');
            }
        } catch (error) {
            console.error('載入訂單失敗:', error);
            this.showError();
        }
    }

    updateStats() {
        // 使用原始數據計算各狀態訂單數量和總收入，不受篩選影響
        const stats = {
            total: this.allOrders.length,
            uncompleted: 0,
            shipped: 0,
            completed: 0,
            totalRevenue: 0
        };

        this.allOrders.forEach(order => {
            switch (order.status) {
                case 'UNCOMPLETED':
                    stats.uncompleted++;
                    break;
                case 'SHIPPED':
                    stats.shipped++;
                    break;
                case 'COMPLETED':
                    stats.completed++;
                    stats.totalRevenue += order.totalAmount || 0;
                    break;
            }
        });

        // 更新統計顯示
        document.getElementById('seller-total-orders').textContent = stats.total.toLocaleString();
        document.getElementById('uncompleted-orders').textContent = stats.uncompleted.toLocaleString();
        document.getElementById('shipped-orders').textContent = stats.shipped.toLocaleString();
        document.getElementById('completed-orders').textContent = stats.completed.toLocaleString();
        document.getElementById('total-revenue').textContent = this.formatPrice(stats.totalRevenue);
    }

    renderOrders() {
        const loading = document.getElementById('orders-loading');
        const table = document.getElementById('orders-table');
        const tbody = document.getElementById('orders-tbody');
        const empty = document.getElementById('orders-empty');
        const error = document.getElementById('orders-error');

        // 隱藏載入和錯誤狀態
        loading.style.display = 'none';
        error.style.display = 'none';

        if (!this.orders || this.orders.length === 0) {
            table.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        // 清空表格內容
        tbody.innerHTML = '';

        // 填充訂單數據
        this.orders.forEach(order => {
            const row = document.createElement('tr');
            
            // 取得第一個商品作為顯示
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
            const productName = firstItem ? firstItem.productVariant?.product?.name || '未知商品' : '無商品';
            const itemCount = order.items ? order.items.length : 0;
            const displayName = itemCount > 1 ? `${productName} 等${itemCount}件` : productName;
            
            row.innerHTML = `
                <td>
                    <span class="order-id" onclick="sellerOrders.viewOrderDetail(${order.id})">#${order.id}</span>
                </td>
                <td>
                    <div class="customer-info">${order.buyer?.username || '未知客戶'}</div>
                </td>
                <td>
                    <div class="product-summary" title="${displayName}">${displayName}</div>
                </td>
                <td>
                    <div class="order-amount">${this.formatPrice(order.totalAmount)}</div>
                </td>
                <td>
                    ${this.getStatusBadge(order.status)}
                </td>
                <td>
                    <div class="order-date">${this.formatDate(order.createdAt)}</div>
                </td>
                <td>
                    ${this.getActionButtons(order)}
                </td>
            `;

            tbody.appendChild(row);
        });

        table.style.display = 'table';
        empty.style.display = 'none';
    }

    getStatusBadge(status) {
        const statusMap = {
            'UNCOMPLETED': { text: '待處理', class: 'uncompleted' },
            'SHIPPED': { text: '已出貨', class: 'shipped' },
            'COMPLETED': { text: '已完成', class: 'completed' },
            'CANCELED': { text: '已取消', class: 'canceled' }
        };

        const statusInfo = statusMap[status] || { text: status, class: 'uncompleted' };
        return `<span class="order-status ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    getActionButtons(order) {
        let buttons = `
            <div class="action-buttons">
                <button class="btn-icon btn-outline-secondary" onclick="sellerOrders.viewOrderDetail(${order.id})" title="查看詳情">
                    <i class="bi bi-eye"></i>
                </button>
        `;

        if (order.status === 'UNCOMPLETED') {
            buttons += `
                <button class="btn-icon btn-primary" onclick="sellerOrders.shipOrder(${order.id})" title="標記出貨">
                    <i class="bi bi-truck"></i>
                </button>
            `;
        } else if (order.status === 'SHIPPED') {
            buttons += `
                <button class="btn-icon btn-success" onclick="sellerOrders.completeOrder(${order.id})" title="標記完成">
                    <i class="bi bi-check-circle"></i>
                </button>
            `;
        }

        buttons += '</div>';
        return buttons;
    }

    async shipOrder(orderId) {
        if (!confirm('確定要將此訂單標記為已出貨嗎？')) {
            return;
        }

        try {
            const response = await window.apiClient.shipOrder(orderId);
            
            if (response.statusCode === 200) {
                alert('訂單已標記為已出貨');
                await this.loadOrders();
            } else {
                throw new Error(response.message || '出貨操作失敗');
            }
        } catch (error) {
            console.error('出貨操作失敗:', error);
            alert('出貨操作失敗：' + error.message);
        }
    }

    async completeOrder(orderId) {
        if (!confirm('確定要將此訂單標記為已完成嗎？')) {
            return;
        }

        try {
            const response = await window.apiClient.completeOrder(orderId);
            
            if (response.statusCode === 200) {
                alert('訂單已標記為已完成');
                await this.loadOrders();
            } else {
                throw new Error(response.message || '完成操作失敗');
            }
        } catch (error) {
            console.error('完成操作失敗:', error);
            alert('完成操作失敗：' + error.message);
        }
    }

    async viewOrderDetail(orderId) {
        try {
            // 暫時使用現有的訂單數據顯示詳情
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                this.showOrderDetailModal(order);
            } else {
                alert('找不到訂單詳情');
            }
        } catch (error) {
            console.error('載入訂單詳情失敗:', error);
            alert('載入訂單詳情失敗：' + error.message);
        }
    }

    showOrderDetailModal(order) {
        const modalContent = document.getElementById('orderDetailContent');
        
        // 計算總金額（前端計算）
        let calculatedTotal = 0;
        
        // 構建訂單項目列表
        const orderItems = order.items?.map(item => {
            const product = item.productVariant?.product;
            const imageUrl = product?.images?.[0]?.url || '/images/placeholder.svg';
            
            // 從 OrderItem 獲取正確的價格字段 (unitPrice)
            const itemPrice = parseFloat(item.unitPrice) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            const subtotal = itemPrice * itemQuantity;
            
            // 累加到總金額
            calculatedTotal += subtotal;
            
            return `
                <div class="order-item">
                    <img src="${imageUrl}" alt="${product?.name || '商品'}" class="item-image" 
                         onerror="this.src='/images/placeholder.svg'">
                    <div class="item-details">
                        <div class="item-name">${product?.name || '未知商品'}</div>
                        <div class="item-variant">${item.productVariant?.name || '預設規格'}</div>
                        <div class="item-price">單價: ${this.formatPrice(itemPrice)}</div>
                        <div class="item-quantity">數量: ${itemQuantity}</div>
                    </div>
                    <div class="item-subtotal">
                        <div class="subtotal-label">小計</div>
                        <div class="subtotal-amount">${this.formatPrice(subtotal)}</div>
                    </div>
                </div>
            `;
        }).join('') || '<p>無商品資訊</p>';
        
        // 使用計算出的總金額，如果沒有商品則使用原始總金額
        const displayTotal = order.items && order.items.length > 0 ? calculatedTotal : (order.totalAmount || 0);

        modalContent.innerHTML = `
            <div class="order-detail-section">
                <h6>訂單資訊</h6>
                <div class="detail-row">
                    <span class="detail-label">訂單編號:</span>
                    <span class="detail-value">#${order.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">訂單狀態:</span>
                    <span class="detail-value">${this.getStatusBadge(order.status)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">下單時間:</span>
                    <span class="detail-value">${this.formatDateTime(order.createdAt)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">總金額:</span>
                    <span class="detail-value">${this.formatPrice(displayTotal)}</span>
                </div>
            </div>

            <div class="order-detail-section">
                <h6>客戶資訊</h6>
                <div class="detail-row">
                    <span class="detail-label">客戶姓名:</span>
                    <span class="detail-value">${order.buyer?.username || '未知客戶'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">聯絡方式:</span>
                    <span class="detail-value">${order.buyer?.account || '無資料'}</span>
                </div>
            </div>

            <div class="order-detail-section">
                <h6>商品清單</h6>
                <div class="order-items">
                    ${orderItems}
                </div>
            </div>
        `;

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    }

    async exportOrders() {
        try {
            // 這裡可以實現匯出功能
            alert('匯出功能開發中...');
        } catch (error) {
            console.error('匯出失敗:', error);
            alert('匯出失敗：' + error.message);
        }
    }

    updatePagination(meta) {
        const pagination = document.getElementById('pagination');
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');
        const currentPageSpan = document.getElementById('current-page');

        if (!meta || meta.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';
        currentPageSpan.textContent = meta.page;

        // 更新上一頁按鈕
        if (meta.page <= 1) {
            prevPage.classList.add('disabled');
        } else {
            prevPage.classList.remove('disabled');
        }

        // 更新下一頁按鈕
        if (meta.page >= meta.totalPages) {
            nextPage.classList.add('disabled');
        } else {
            nextPage.classList.remove('disabled');
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadOrders();
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadOrders();
    }

    showLoading() {
        document.getElementById('orders-loading').style.display = 'block';
        document.getElementById('orders-table').style.display = 'none';
        document.getElementById('orders-empty').style.display = 'none';
        document.getElementById('orders-error').style.display = 'none';
    }

    showError() {
        document.getElementById('orders-loading').style.display = 'none';
        document.getElementById('orders-table').style.display = 'none';
        document.getElementById('orders-empty').style.display = 'none';
        document.getElementById('orders-error').style.display = 'block';
    }

    formatPrice(amount) {
        if (!amount) return 'NT$ 0';
        return `NT$ ${amount.toLocaleString()}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// 等待 API 客戶端準備就緒
async function waitForApiClient() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.apiClient && typeof window.apiClient.getSellerOrders === 'function') {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    throw new Error('API 客戶端載入超時');
}

// 初始化
waitForApiClient().then(() => {
    window.sellerOrders = new SellerOrders();
    window.sellerOrders.init();
}).catch(error => {
    console.error('初始化訂單頁面失敗:', error);
}); 
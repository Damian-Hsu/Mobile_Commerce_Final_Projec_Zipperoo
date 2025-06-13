/**
 * 賣家中心頁面 JavaScript
 */

class SellerDashboard {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 5; // Dashboard 只顯示最近5筆訂單
        this.initTimeout = null;
        this.waitForApiClient();
    }

    waitForApiClient() {
        // 等待 apiClient 和 UIUtils 初始化
        if (window.apiClient && 
            typeof window.apiClient.isAuthenticated === 'function' &&
            window.UIUtils && 
            typeof window.UIUtils.getProductImageUrl === 'function') {
            this.init();
        } else {
            // 如果依賴還沒準備好，等待一段時間後重試
            this.initTimeout = setTimeout(() => this.waitForApiClient(), 100);
        }
    }

    async init() {
        try {
            // 清除計時器
            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.initTimeout = null;
            }

            // 檢查登入狀態
            if (!window.apiClient.isAuthenticated()) {
                window.location.href = '/login';
                return;
            }

            // 檢查是否為賣家
            const user = window.apiClient.getCurrentUser();
            if (!user || user.role !== 'SELLER') {
                alert('您沒有權限訪問賣家中心');
                window.location.href = '/';
                return;
            }

            // 載入數據
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('初始化賣家中心失敗:', error);
            this.showError('載入頁面失敗，請重新整理');
        }
    }

    async loadDashboardData() {
        try {
            // 並行載入所有需要的數據
            const [
                productsResponse,
                ordersResponse,
                allOrdersResponse
            ] = await Promise.all([
                this.loadProducts(),
                this.loadOrders(),
                this.loadAllOrdersForStats()
            ]);

            // 更新統計數據
            this.updateStats(productsResponse, allOrdersResponse);
            
        } catch (error) {
            console.error('載入數據失敗:', error);
            this.showError('載入數據失敗');
        }
    }

    async loadAllOrdersForStats() {
        try {
            // 載入更多訂單以計算統計數據
            const response = await window.apiClient.getSellerOrders({
                page: 1,
                pageSize: 100 // 載入更多訂單來計算統計
            });

            console.log('訂單API回應完整結構:', response);

            if (response.statusCode === 200 && response.data) {
                console.log('訂單數據結構:', response.data);
                console.log('訂單Meta:', response.data.meta);
                console.log('訂單總數 (meta.total):', response.data.meta?.total);
                console.log('訂單總數 (data.length):', response.data.data?.length);
                console.log('訂單列表:', response.data.data);
                return response.data;
            } else {
                throw new Error(response.message || '載入統計數據失敗');
            }
        } catch (error) {
            console.error('載入統計數據失敗:', error);
            return { data: [], total: 0 };
        }
    }

    async loadProducts() {
        try {
            // 使用 seller products API，只顯示當前賣家的商品
            const response = await window.apiClient.getSellerProducts({
                page: 1,
                pageSize: 100 // 載入所有商品來計算統計
            });

            console.log('商品API回應完整結構:', response);

            if (response.statusCode === 200 && response.data) {
                console.log('商品數據結構:', response.data);
                console.log('商品Meta:', response.data.meta);
                console.log('商品總數 (meta.total):', response.data.meta?.total);
                console.log('商品總數 (data.length):', response.data.data?.length);
                console.log('商品列表:', response.data.data);
                console.log('第一個商品的圖片:', response.data.data?.[0]?.images);
                console.log('第一個商品的完整結構:', response.data.data?.[0]);
                console.log('第一個商品的價格相關字段:', {
                    price: response.data.data?.[0]?.price,
                    basePrice: response.data.data?.[0]?.basePrice,
                    variants: response.data.data?.[0]?.variants
                });
                
                // 現在顯示所有商品（不只是當前賣家的）
                this.renderPopularProducts(response.data.data || []);
                
                // 對於統計，我們可能需要過濾出當前賣家的商品
                // 但先測試看看通用API的數據結構是否有價格
                return response.data;
            } else {
                throw new Error(response.message || '載入商品失敗');
            }
        } catch (error) {
            console.error('載入商品失敗:', error);
            this.showProductsError();
            return { data: [], total: 0 };
        }
    }

    async loadOrders() {
        try {
            const response = await window.apiClient.getSellerOrders({
                page: this.currentPage,
                pageSize: this.pageSize
            });

            if (response.statusCode === 200 && response.data) {
                this.renderOrders(response.data.data || []);
                return response.data;
            } else {
                throw new Error(response.message || '載入訂單失敗');
            }
        } catch (error) {
            console.error('載入訂單失敗:', error);
            this.showOrdersError();
            return { data: [], total: 0 };
        }
    }

    updateStats(productsData, ordersData) {
        // 更新商品總數 - 從 meta.total 或 data.length 取值
        const totalProducts = productsData.meta?.total || productsData.data?.length || 0;
        document.getElementById('total-products').textContent = totalProducts.toLocaleString();

        // 更新訂單總數 - 從 meta.total 或 data.length 取值
        const totalOrders = ordersData.meta?.total || ordersData.data?.length || 0;
        document.getElementById('total-orders').textContent = totalOrders.toLocaleString();

        // 計算總收入和待處理訂單
        const orders = ordersData.data || [];
        let totalRevenue = 0;
        let pendingOrders = 0;

        orders.forEach(order => {
            console.log(`訂單 #${order.id}: 狀態=${order.status}, 金額=${order.totalAmount}`);
            // 計算總收入（包含所有已完成的訂單）
            if (order.status === 'COMPLETED') {
                totalRevenue += order.totalAmount || 0;
            }
            // 計算待處理訂單（未完成和已出貨的訂單）
            if (order.status === 'UNCOMPLETED' || order.status === 'SHIPPED') {
                pendingOrders++;
            }
        });

        // 更新總收入
        document.getElementById('total-revenue').textContent = this.formatPrice(totalRevenue);

        // 更新待處理訂單
        document.getElementById('pending-orders').textContent = pendingOrders.toLocaleString();

        console.log('統計數據更新:', {
            totalProducts,
            totalOrders,
            totalRevenue,
            pendingOrders,
            ordersCount: orders.length
        });
    }

    renderOrders(orders) {
        const loading = document.getElementById('orders-loading');
        const table = document.getElementById('orders-table');
        const tbody = document.getElementById('orders-tbody');
        const empty = document.getElementById('orders-empty');

        loading.style.display = 'none';

        if (!orders || orders.length === 0) {
            table.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        // 清空表格內容
        tbody.innerHTML = '';

        // 填充訂單數據
        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // 取得第一個商品作為顯示
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
            const productName = firstItem ? firstItem.productVariant?.product?.name || '未知商品' : '無商品';
            const itemCount = order.items ? order.items.length : 0;
            const displayName = itemCount > 1 ? `${productName} 等${itemCount}件` : productName;

            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.buyer?.username || '未知客戶'}</td>
                <td>${displayName}</td>
                <td>${this.formatPrice(order.totalAmount)}</td>
                <td>${this.getStatusBadge(order.status)}</td>
                <td>${this.formatDate(order.createdAt)}</td>
                <td>${this.getActionButtons(order)}</td>
            `;

            tbody.appendChild(row);
        });

        table.style.display = 'table';
        empty.style.display = 'none';
    }

    renderPopularProducts(products) {
        const container = document.getElementById('popular-products');
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>暫無商品</h3>
                    <p>開始新增您的第一個商品吧！</p>
                </div>
            `;
            return;
        }

        // 只顯示前6個商品
        const limitedProducts = products.slice(0, 6);
        
        container.innerHTML = limitedProducts.map(product => {
            // 取得商品圖片
            const imageUrl = window.UIUtils.getProductImageUrl(product);

            // 使用新的統計字段
            const minPrice = product.minPrice || 0;
            const maxPrice = product.maxPrice || 0;
            const avgRating = product.avgRating || 0;
            const soldQuantity = product.soldQuantity || 0;
            const reviewCount = product._count?.reviews || 0;
            
            // 價格顯示：如果最小和最大價格相同，只顯示一個價格
            const priceDisplay = minPrice === maxPrice 
                ? `NT$ ${minPrice}` 
                : `NT$ ${minPrice} - ${maxPrice}`;
            
            console.log('商品統計詳情:', {
                name: product.name,
                priceRange: `${minPrice} - ${maxPrice}`,
                avgRating: avgRating,
                soldQuantity: soldQuantity
            });

            return `
                <div class="product-card"><a href="/products/${product.id}" style="text-decoration: none;">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.src='/images/placeholder.svg'">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">${priceDisplay}</div>
                        <div class="product-stats">
                            <div class="stats-row">
                                <span>已售 ${soldQuantity} 件</span>
                                <span>${product.variants?.length || 0} 個規格</span>
                                <span>${avgRating > 0 ? `⭐ ${avgRating}` : '無評價'} (${reviewCount})</span>
                            </div>
                           
                        </div>
                    </div>
                </a></div>
            `;
        }).join('');
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
        if (order.status === 'UNCOMPLETED') {
            return `
                <div class="action-buttons">
                    <button class="btn-sm btn-primary" onclick="sellerDashboard.shipOrder(${order.id})">
                        出貨
                    </button>
                </div>
            `;
        } else if (order.status === 'SHIPPED') {
            return `
                <div class="action-buttons">
                    <button class="btn-sm btn-success" onclick="sellerDashboard.completeOrder(${order.id})">
                        完成
                    </button>
                </div>
            `;
        }
        
        return '<span class="text-muted">無操作</span>';
    }

    async shipOrder(orderId) {
        try {
            if (!confirm('確定要將此訂單標記為已出貨嗎？')) {
                return;
            }

            const response = await window.apiClient.shipOrder(orderId);
            
            if (response.statusCode === 200) {
                alert('訂單已標記為已出貨');
                await this.loadOrders(); // 重新載入訂單
            } else {
                throw new Error(response.message || '操作失敗');
            }
        } catch (error) {
            console.error('出貨訂單失敗:', error);
            alert('出貨失敗：' + error.message);
        }
    }

    async completeOrder(orderId) {
        try {
            if (!confirm('確定要將此訂單標記為已完成嗎？')) {
                return;
            }

            const response = await window.apiClient.completeOrder(orderId);
            
            if (response.statusCode === 200) {
                alert('訂單已完成');
                await this.loadOrders(); // 重新載入訂單
            } else {
                throw new Error(response.message || '操作失敗');
            }
        } catch (error) {
            console.error('完成訂單失敗:', error);
            alert('完成訂單失敗：' + error.message);
        }
    }

    showOrdersError() {
        const loading = document.getElementById('orders-loading');
        const table = document.getElementById('orders-table');
        const empty = document.getElementById('orders-empty');

        loading.style.display = 'none';
        table.style.display = 'none';
        
        empty.innerHTML = `
            <div class="empty-icon">⚠️</div>
            <h3>載入失敗</h3>
            <p>無法載入訂單數據，請重新整理頁面</p>
        `;
        empty.style.display = 'block';

        // 設置預設統計值
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('pending-orders').textContent = '0';
        document.getElementById('total-revenue').textContent = 'NT$ 0';
    }

    showProductsError() {
        const container = document.getElementById('popular-products');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>載入失敗</h3>
                <p>無法載入商品數據，請重新整理頁面</p>
            </div>
        `;

        // 設置預設統計值
        document.getElementById('total-products').textContent = '0';
    }

    showError(message) {
        // 可以使用 toast 通知或其他方式顯示錯誤
        console.error(message);
        alert(message);
    }

    getProductPrice(product) {
        // 嘗試從多個可能的價格字段中找到價格
        let price = product.price || product.basePrice;
        
        // 如果商品本身沒有價格，嘗試從第一個規格中取得
        if (!price && product.variants && product.variants.length > 0) {
            price = product.variants[0].price;
        }
        
        return this.formatPrice(price);
    }

    formatPrice(amount) {
        if (!amount && amount !== 0) return 'NT$ 0';
        return `NT$ ${amount.toLocaleString()}`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return '剛剛';
        } else if (diffInHours < 24) {
            return `${diffInHours}小時前`;
        } else if (diffInHours < 48) {
            return '1天前';
        } else {
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
    }
}

// 初始化賣家中心
const sellerDashboard = new SellerDashboard();

// 導出到全域，供HTML中的事件處理器使用
window.sellerDashboard = sellerDashboard; 
/**
 * 管理後台儀表板 JavaScript
 */

class AdminDashboard {
    constructor() {
        console.log('📊 管理後台儀表板初始化');
        this.authManager = window.App.authManager;
        this.apiClient = window.apiClient;
        this.showAlert = window.App.showAlert || this.fallbackShowAlert.bind(this);
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentSection = 'users';
        this.currentLogSort = '-createdAt';
        this.currentLogSearchParams = {};
        this.init();
    }

    async init() {
        console.log('🔐 檢查管理員認證...');
        
        // 檢查認證狀態
        if (!this.authManager) {
            console.error('❌ AuthManager 未找到');
            this.redirectToLogin();
            return;
        }

        // 檢查認證和權限
        if (!await this.checkAuth()) {
            return;
        }
        
        // 載入數據
        await this.loadDashboardStats();
        await this.loadUsers();
        
        // 初始化事件監聽器
        this.setupEventListeners();
    }

    // 添加缺失的工具方法
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const loadingHTML = `
                <div class="loading-spinner d-flex justify-content-center align-items-center" style="min-height: 200px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">載入中...</span>
                    </div>
                    <span class="ms-2">載入中...</span>
                </div>
            `;
            container.innerHTML = loadingHTML;
        }
    }

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const loadingSpinner = container.querySelector('.loading-spinner');
            if (loadingSpinner) {
                loadingSpinner.remove();
            }
        }
    }

    fallbackShowAlert(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // 簡單的alert fallback
        alert(`${type.toUpperCase()}: ${message}`);
    }

    showError(message) {
        console.error('❌', message);
        this.showAlert(message, 'error');
    }

    showSuccess(message) {
        console.log('✅', message);
        this.showAlert(message, 'success');
    }

    redirectToLogin() {
        console.log('🔄 重定向到登入頁面');
        window.location.href = '/login';
    }

    redirectToHome() {
        console.log('🔄 重定向到首頁');
        window.location.href = '/';
    }

    async checkAuth() {
        console.log('🔐 檢查管理員認證...');
        
        // 檢查 App 和 authManager 是否存在
        if (!window.App) {
            console.error('❌ App 未初始化');
            window.location.href = '/login';
            return false;
        }
        
        const authManager = window.App.authManager;
        if (!authManager) {
            console.error('❌ AuthManager 未初始化');
            window.location.href = '/login';
            return false;
        }
        
        console.log('📊 AuthManager 狀態:', {
            exists: !!authManager,
            user: authManager.user,
            token: !!authManager.token
        });

        // 檢查是否已登入
        if (!authManager.user || !authManager.token) {
            console.warn('❌ 用戶未登入，重定向到登入頁面');
            if (window.App) {
                window.App.showAlert('請先登入', 'warning');
            }
            window.location.href = '/login';
            return false;
        }

        // 檢查是否為管理員
        if (authManager.user?.role !== 'ADMIN') {
            console.warn('❌ 用戶不是管理員，重定向到首頁');
            console.log('用戶角色:', authManager.user?.role);
            if (window.App) {
                window.App.showAlert('您沒有管理員權限', 'error');
            }
            window.location.href = '/';
            return false;
        }

        console.log('✅ 管理員權限驗證通過:', authManager.user.username);
        return true;
    }

    setupEventListeners() {
        // 設置區塊切換事件
        window.showUsersSection = () => this.showSection('users');
        window.showProductsSection = () => this.showSection('products');
        window.showCategoriesSection = () => this.showSection('categories');
        window.showOrdersSection = () => this.showSection('orders');
        window.showLogsSection = () => this.showSection('logs');
        
        // 設置載入函數
        window.loadUsers = () => this.loadUsers();
        window.loadProducts = () => this.loadProductsData();
        window.loadCategories = () => this.loadCategoriesData();
        window.loadOrders = () => this.loadOrdersData();
        window.loadLogs = () => this.loadLogsData();
        
        // 視窗大小變化監聽器已移除
    }

    // 響應式樣式功能已移除，所有欄位都會顯示

    showSection(sectionName) {
        // 隱藏所有區塊
        document.querySelectorAll('.section-container').forEach(section => {
            section.style.display = 'none';
        });
        
        // 顯示指定區塊
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;
            
            // 如果區塊是空的或只有基本結構，初始化內容
            if (!targetSection.querySelector('.data-table') || targetSection.innerHTML.trim().length < 100) {
                this.initSectionContent(sectionName);
            }
        }
    }

    initSectionContent(sectionName) {
        const targetSection = document.getElementById(`${sectionName}-section`);
        
        switch (sectionName) {
            case 'users':
                this.initUsersSection(targetSection);
                break;
            case 'products':
                this.initProductsSection(targetSection);
                break;
            case 'categories':
                this.initCategoriesSection(targetSection);
                break;
            case 'orders':
                this.initOrdersSection(targetSection);
                break;
            case 'logs':
                this.initLogsSection(targetSection);
                break;
        }
    }

    initUsersSection(section) {
        section.innerHTML = `
            <div class="section-header">
                <h2>
                    <i class="bi bi-people"></i>
                    用戶管理
                </h2>
                <div class="section-controls">
                    <button class="btn btn-refresh" onclick="window.adminDashboard.refreshUsers()">
                        <i class="bi bi-arrow-clockwise"></i>
                        重新載入
                    </button>
                    <button class="btn btn-primary" onclick="window.adminDashboard.showUserDetails()">
                        <i class="bi bi-person-plus"></i>
                        查看用戶詳情
                    </button>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="loading-container" id="users-loading">
                    <div class="loading-spinner"></div>
                    <p>載入用戶資料中...</p>
                </div>
                
                <table class="data-table" id="users-table" style="display: none;">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th style="width: 120px;">用戶名</th>
                            <th style="width: 120px;">帳號</th>
                            <th style="width: 180px;">信箱</th>
                            <th style="width: 80px;">角色</th>
                            <th style="width: 100px;">商店名稱</th>
                            <th style="width: 80px;">商品數</th>
                            <th style="width: 80px;">狀態</th>
                            <th style="width: 120px;">註冊時間</th>
                            <th style="width: 140px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                    </tbody>
                </table>
                
                <div class="pagination-container" id="users-pagination" style="display: none;">
                </div>
            </div>
        `;
        
        // 載入用戶數據
        this.loadUsers();
    }

    initProductsSection(section) {
        section.innerHTML = `
            <div class="section-header">
                <h2>
                    <i class="bi bi-box"></i>
                    商品管理
                </h2>
                <div class="section-controls">
                    <button class="btn btn-refresh" onclick="window.adminDashboard.refreshProducts()">
                        <i class="bi bi-arrow-clockwise"></i>
                        重新載入
                    </button>
                    <button class="btn btn-warning" onclick="window.adminDashboard.reviewPendingProducts()">
                        <i class="bi bi-clock"></i>
                        審核待審商品
                    </button>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="loading-container" id="products-loading">
                    <div class="loading-spinner"></div>
                    <p>載入商品資料中...</p>
                </div>
                
                <table class="data-table" id="products-table" style="display: none;">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th style="width: 200px;">商品名稱</th>
                            <th style="width: 120px;">賣家</th>
                            <th style="width: 100px;">價格範圍</th>
                            <th style="width: 80px;">庫存</th>
                            <th style="width: 80px;">狀態</th>
                            <th style="width: 120px;">建立時間</th>
                            <th style="width: 140px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="products-tbody">
                    </tbody>
                </table>
                
                <div class="pagination-container" id="products-pagination" style="display: none;">
                </div>
            </div>
        `;
        
        // 載入商品數據
        this.loadProductsData();
    }

    initCategoriesSection(section) {
        section.innerHTML = `
            <div class="section-header">
                <h2>
                    <i class="bi bi-tags"></i>
                    類別管理
                </h2>
                <div class="section-controls">
                    <button class="btn btn-refresh" onclick="window.adminDashboard.refreshCategories()">
                        <i class="bi bi-arrow-clockwise"></i>
                        重新載入
                    </button>
                    <button class="btn btn-success" onclick="window.adminDashboard.showAddCategoryModal()">
                        <i class="bi bi-plus-circle"></i>
                        新增類別
                    </button>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="loading-container" id="categories-loading">
                    <div class="loading-spinner"></div>
                    <p>載入類別資料中...</p>
                </div>
                
                <table class="data-table" id="categories-table" style="display: none;">
                    <thead>
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th style="width: 200px;">類別名稱</th>
                            <th style="width: 100px;">商品數量</th>
                            <th style="width: 150px;">建立時間</th>
                            <th style="width: 150px;">更新時間</th>
                            <th style="width: 120px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="categories-tbody">
                    </tbody>
                </table>
                
                <div class="pagination-container" id="categories-pagination" style="display: none;">
                </div>
            </div>
        `;
        
        // 載入類別數據
        this.loadCategoriesData();
    }

    initOrdersSection(section) {
        section.innerHTML = `
            <div class="section-header">
                <h2>
                    <i class="bi bi-receipt"></i>
                    訂單管理
                </h2>
                <div class="section-controls">
                    <button class="btn btn-refresh" onclick="window.adminDashboard.refreshOrders()">
                        <i class="bi bi-arrow-clockwise"></i>
                        重新載入
                    </button>
                    <button class="btn btn-danger" onclick="window.adminDashboard.handleDisputes()">
                        <i class="bi bi-exclamation-triangle"></i>
                        處理糾紛
                    </button>
                    <button class="btn btn-secondary" onclick="window.adminDashboard.processRefunds()">
                        <i class="bi bi-arrow-return-left"></i>
                        處理退款
                    </button>
                </div>
            </div>
            
            <div class="data-table-container">
                <div class="loading-container" id="orders-loading">
                    <div class="loading-spinner"></div>
                    <p>載入訂單資料中...</p>
                </div>
                
                <table class="data-table" id="orders-table" style="display: none;">
                    <thead>
                        <tr>
                            <th style="width: 80px;">訂單ID</th>
                            <th style="width: 120px;">買家</th>
                            <th style="width: 120px;">賣家</th>
                            <th style="width: 80px;">商品數量</th>
                            <th style="width: 100px;">總金額</th>
                            <th style="width: 100px;">狀態</th>
                            <th style="width: 120px;">下單時間</th>
                            <th style="width: 100px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="orders-tbody">
                    </tbody>
                </table>
                
                <div class="pagination-container" id="orders-pagination" style="display: none;">
                </div>
            </div>
        `;
        
        // 載入訂單數據
        this.loadOrdersData();
    }

    initLogsSection(section) {
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="mb-0">
                    <i class="bi bi-journal-text me-2"></i>
                    系統日誌
                </h4>
                <div class="d-flex gap-2">
                    <button class="btn btn-success" onclick="window.adminDashboard.refreshLogs()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        重新載入
                    </button>
                    <button class="btn btn-primary" onclick="window.adminDashboard.exportLogs()">
                        <i class="bi bi-download me-1"></i>
                        匯出日誌
                    </button>
                </div>
            </div>

            <!-- 搜尋控件 -->
            <div class="card mb-4">
                <div class="card-body">
                    <h6 class="card-title mb-3">搜尋日誌</h6>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">通用搜尋</label>
                            <input type="text" class="form-control" id="logs-search" 
                                   placeholder="搜尋事件、用戶、IP等..." />
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">事件類型</label>
                            <select class="form-select" id="logs-event-filter">
                                <option value="">全部</option>
                                <option value="USER_LOGIN">用戶登入</option>
                                <option value="USER_LOGOUT">用戶登出</option>
                                <option value="USER_REGISTERED">用戶註冊</option>
                                <option value="USER_BLOCKED">用戶封鎖</option>
                                <option value="USER_UNBLOCKED">用戶解封</option>
                                <option value="USER_DELETED_BY_ADMIN">管理員刪除用戶</option>
                                <option value="PRODUCT_DELETED_BY_ADMIN">管理員刪除商品</option>
                                <option value="ORDER_STATUS_UPDATED_BY_ADMIN">管理員更新訂單</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">用戶名</label>
                            <input type="text" class="form-control" id="logs-username-filter" 
                                   placeholder="用戶名或帳號" />
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">IP地址</label>
                            <input type="text" class="form-control" id="logs-ip-filter" 
                                   placeholder="IP地址" />
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">開始日期</label>
                            <input type="date" class="form-control" id="logs-start-date" />
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">結束日期</label>
                            <input type="date" class="form-control" id="logs-end-date" />
                        </div>
                        <div class="col-12 d-flex justify-content-end">
                            <button class="btn btn-primary me-2" onclick="window.adminDashboard.searchLogs()">
                                <i class="bi bi-search me-1"></i>
                                搜尋
                            </button>
                            <button class="btn btn-outline-secondary" onclick="window.adminDashboard.clearLogSearch()">
                                <i class="bi bi-x-circle me-1"></i>
                                清除
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div id="logs-loading" class="text-center py-5" style="display: none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">載入中...</span>
                        </div>
                        <div class="mt-2">載入日誌中...</div>
                    </div>
                    
                    <div class="data-table-container">
                        <table class="data-table" id="logs-table">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">
                                        <button class="btn btn-link p-0 text-decoration-none" 
                                                onclick="window.adminDashboard.sortLogs('id')"
                                                title="按ID排序">
                                            ID <i class="bi bi-arrow-down-up"></i>
                                        </button>
                                    </th>
                                    <th style="width: 150px;">事件類型</th>
                                    <th style="width: 120px;">操作者</th>
                                    <th style="min-width: 200px;">描述</th>
                                    <th style="width: 120px;">IP地址</th>
                                    <th style="width: 150px;">
                                        <button class="btn btn-link p-0 text-decoration-none" 
                                                onclick="window.adminDashboard.sortLogs('createdAt')"
                                                title="按時間排序">
                                            時間 <i class="bi bi-arrow-down-up"></i>
                                        </button>
                                    </th>
                                    <th style="width: 80px;">詳情</th>
                                </tr>
                            </thead>
                            <tbody id="logs-tbody">
                                <!-- 日誌數據將動態載入 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="logs-pagination" class="d-flex justify-content-between align-items-center mt-4">
                        <!-- 分頁控件將動態載入 -->
                    </div>
                </div>
            </div>
        `;
        
        section.innerHTML = content;
        
        // 載入日誌數據
        this.loadLogsData();
    }

    async loadDashboardStats() {
        try {
            console.log('📊 開始載入統計數據...');
            
            // 檢查 apiClient 是否可用
            if (!window.apiClient) {
                throw new Error('API Client 未初始化');
            }
            
            console.log('🔄 並行載入統計數據...');
            
            // 並行載入所有統計數據
            const [usersResult, productsResult, categoriesResult, ordersResult, logsResult] = await Promise.all([
                window.apiClient.getAdminUsers({ page: 1, pageSize: 1 }).catch(e => ({ error: e, data: null })),
                window.apiClient.getAdminProducts({ page: 1, pageSize: 1 }).catch(e => ({ error: e, data: null })),
                window.apiClient.getAdminCategories({ page: 1, pageSize: 1 }).catch(e => ({ error: e, data: null })),
                window.apiClient.getAdminOrders({ page: 1, pageSize: 1 }).catch(e => ({ error: e, data: null })),
                window.apiClient.getAdminLogs({ page: 1, pageSize: 1 }).catch(e => ({ error: e, data: null }))
            ]);

            console.log('📈 API 回應結果:', {
                users: usersResult,
                products: productsResult,
                categories: categoriesResult,
                orders: ordersResult,
                logs: logsResult
            });

            // 更新統計數字
            const totalUsers = usersResult.error ? '錯誤' : (usersResult.data?.pagination?.total || 0);
            const totalProducts = productsResult.error ? '錯誤' : (productsResult.data?.pagination?.total || 0);
            const totalCategories = categoriesResult.error ? '錯誤' : (categoriesResult.data?.pagination?.total || 0);
            const totalOrders = ordersResult.error ? '錯誤' : (ordersResult.data?.pagination?.total || 0);
            const totalLogs = logsResult.error ? '錯誤' : (logsResult.data?.pagination?.total || 0);
            
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('total-products').textContent = totalProducts;
            document.getElementById('total-categories').textContent = totalCategories;
            document.getElementById('total-orders').textContent = totalOrders;
            document.getElementById('total-logs').textContent = totalLogs;

            console.log('✅ 統計數據載入完成:', {
                users: totalUsers,
                products: totalProducts,
                categories: totalCategories,
                orders: totalOrders,
                logs: totalLogs
            });
            
            // 檢查是否有錯誤
            const errors = [];
            if (usersResult.error) errors.push('用戶數據: ' + usersResult.error.message);
            if (productsResult.error) errors.push('商品數據: ' + productsResult.error.message);
            if (categoriesResult.error) errors.push('類別數據: ' + categoriesResult.error.message);
            if (ordersResult.error) errors.push('訂單數據: ' + ordersResult.error.message);
            if (logsResult.error) errors.push('日誌數據: ' + logsResult.error.message);
            
            if (errors.length > 0 && window.App) {
                window.App.showAlert('部分統計數據載入失敗:\n' + errors.join('\n'), 'warning');
            }
            
        } catch (error) {
            console.error('❌ 載入統計數據失敗:', error);
            
            // 顯示錯誤訊息
            ['total-users', 'total-products', 'total-categories', 'total-orders', 'total-logs'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = '錯誤';
                }
            });
            
            if (window.App) {
                window.App.showAlert('載入統計數據失敗: ' + error.message, 'error');
            }
        }
    }

    async loadUsers(page = 1) {
        try {
            this.showLoading('users');
            console.log(`📊 載入用戶數據 - 頁面 ${page}`);

            const result = await window.apiClient.getAdminUsers({
                page: page,
                pageSize: this.pageSize
            });

            console.log('🔍 API 回應結構檢查:', result);
            
            if (result.data) {
                // 檢查數據結構
                const users = result.data.users || result.data.data || [];
                const pagination = result.data.pagination || result.data.meta || {
                    page: page,
                    totalPages: 1,
                    total: users.length,
                    pageSize: this.pageSize
                };
                
                console.log('👥 解析的用戶數據:', { users, pagination });
                
                this.renderUsersTable(users);
                if (pagination) {
                    this.renderPagination('users', pagination);
                }
                
                // 顯示表格並隱藏載入動畫
                const loadingElement = document.getElementById('users-loading');
                const tableElement = document.getElementById('users-table');
                const paginationElement = document.getElementById('users-pagination');
                
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                if (tableElement) {
                    tableElement.style.display = 'table';
                }
                if (paginationElement && pagination) {
                    paginationElement.style.display = 'flex';
                }
                
                this.currentPage = page;
                this.hideLoading('users');
                console.log('✅ 用戶數據載入完成，表格已顯示');
            } else {
                throw new Error('無法獲取用戶數據');
            }

        } catch (error) {
            console.error('❌ 載入用戶失敗:', error);
            this.hideLoading('users');
            this.showError('users', '載入用戶數據失敗: ' + error.message);
            
            if (window.App) {
                window.App.showAlert('載入用戶數據失敗: ' + error.message, 'error');
            }
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-tbody');
        
        // HTML轉義函數
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        // 調試：檢查用戶數據結構
        if (users.length > 0) {
            console.log('🔍 用戶數據結構檢查:', users[0]);
        }
        
        tbody.innerHTML = users.map(user => {
            // 處理用戶狀態 - 檢查多種可能的字段
            let userStatus = 'ACTIVE';
            let userStatusDisplay = '正常';
            
            if (user.status) {
                userStatus = user.status;
                userStatusDisplay = this.getUserStatusDisplayName(user.status);
            } else if (user.isBlocked !== undefined) {
                userStatus = user.isBlocked ? 'BLOCKED' : 'ACTIVE';
                userStatusDisplay = user.isBlocked ? '已封鎖' : '正常';
            }
            
            console.log(`👤 用戶 ${user.id} 狀態處理:`, {
                originalStatus: user.status,
                isBlocked: user.isBlocked,
                finalStatus: userStatus,
                display: userStatusDisplay
            });
            
            return `
            <tr data-user-id="${user.id}">
                <td>${user.id}</td>
                <td>
                    <div title="${escapeHtml(user.username)}">
                        ${escapeHtml(user.username)}
                    </div>
                </td>
                <td>
                    <div title="${escapeHtml(user.account)}">
                        ${escapeHtml(user.account)}
                    </div>
                </td>
                <td>
                    <div title="${escapeHtml(user.email)}">
                        ${escapeHtml(user.email)}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${user.role.toLowerCase()}">
                        ${this.getRoleDisplayName(user.role)}
                    </span>
                </td>
                <td>
                    <div title="${escapeHtml(user.shopName || '-')}">
                        ${escapeHtml(user.shopName || '-')}
                    </div>
                </td>
                <td style="text-align: center;">
                    ${user._count?.products || 0}
                </td>
                <td>
                    <span class="status-badge ${userStatus.toLowerCase()}">
                        ${userStatusDisplay}
                    </span>
                </td>
                <td>
                    ${this.formatDate(user.createdAt)}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" 
                                onclick="window.adminDashboard.viewUser(${user.id})" 
                                title="查看詳情">
                            <i class="bi bi-eye"></i>
                    </button>
                        ${user.role !== 'ADMIN' ? `
                            ${userStatus === 'ACTIVE' ? `
                                <button class="btn btn-sm btn-warning" 
                                        onclick="window.adminDashboard.blockUser(${user.id})" 
                                        title="封鎖用戶">
                                    <i class="bi bi-lock"></i>
                    </button>
                            ` : `
                                <button class="btn btn-sm btn-success" 
                                        onclick="window.adminDashboard.unblockUser(${user.id})" 
                                        title="解封用戶">
                                    <i class="bi bi-unlock"></i>
                                </button>
                            `}
                            <button class="btn btn-sm btn-danger" 
                                    onclick="window.adminDashboard.deleteUser(${user.id})" 
                                    title="刪除用戶">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    }

    async loadProductsData(page = 1) {
        try {
            console.log(`📦 載入商品數據 - 頁面 ${page}`);

            const result = await window.apiClient.getAdminProducts({
                page: page,
                pageSize: this.pageSize
            });

            console.log('🔍 商品API回應:', result);

            if (result.data) {
                const products = result.data.products || result.data.data || [];
                const pagination = result.data.pagination || result.data.meta || {
                    page: page,
                    totalPages: 1,
                    total: products.length,
                    pageSize: this.pageSize
                };

                this.renderProductsTable(products);
                if (pagination) {
                    this.renderPagination('products', pagination);
                }

                // 顯示表格並隱藏載入動畫
                const loadingElement = document.getElementById('products-loading');
                const tableElement = document.getElementById('products-table');
                const paginationElement = document.getElementById('products-pagination');

                if (loadingElement) loadingElement.style.display = 'none';
                if (tableElement) tableElement.style.display = 'table';
                if (paginationElement && pagination) paginationElement.style.display = 'flex';

                console.log('✅ 商品數據載入完成');
            } else {
                throw new Error('無法獲取商品數據');
            }

        } catch (error) {
            console.error('❌ 載入商品失敗:', error);
            this.hideLoading('products');
            this.showError('載入商品數據失敗: ' + error.message);
        }
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('products-tbody');
        
        // HTML轉義函數
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        tbody.innerHTML = products.map(product => `
            <tr data-product-id="${product.id}">
                <td style="width: 60px;">${product.id}</td>
                <td style="width: 200px;">
                    <div style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                         title="${escapeHtml(product.name)}">
                        ${escapeHtml(product.name)}
                        </div>
                    </td>
                <td style="width: 120px;">
                    <div style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                         title="${escapeHtml(product.seller?.username || product.seller?.shopName || '-')}">
                        ${escapeHtml(product.seller?.username || product.seller?.shopName || '-')}
                    </div>
                </td>
                <td style="width: 100px;">
                    ${product.variants && product.variants.length > 0 ? 
                        `$${Math.min(...product.variants.map(v => v.price))} - $${Math.max(...product.variants.map(v => v.price))}` : 
                        '-'
                    }
                </td>
                <td style="width: 80px; text-align: center;">
                    ${product.variants ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 0}
                </td>
                <td style="width: 80px;">
                    <span class="status-badge ${(product.status || 'ACTIVE').toLowerCase()}">
                        ${this.getStatusDisplayName(product.status || 'ACTIVE')}
                        </span>
                    </td>
                <td style="width: 120px;">
                    ${this.formatDate(product.createdAt)}
                </td>
                <td style="width: 140px;">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" 
                                onclick="window.adminDashboard.viewProduct(${product.id})" 
                                title="查看詳情">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" 
                                onclick="window.adminDashboard.editProduct(${product.id})" 
                                title="編輯商品">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="window.adminDashboard.deleteProduct(${product.id})" 
                                title="刪除商品">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadCategoriesData(page = 1) {
        try {
            console.log(`🏷️ 載入類別數據 - 頁面 ${page}`);

            const result = await window.apiClient.getAdminCategories({
                page: page,
                pageSize: this.pageSize
            });

            console.log('🔍 類別API回應:', result);

            if (result.data) {
                const categories = result.data.categories || result.data.data || [];
                const pagination = result.data.pagination || result.data.meta || {
                    page: page,
                    totalPages: 1,
                    total: categories.length,
                    pageSize: this.pageSize
                };

                this.renderCategoriesTable(categories);
                if (pagination) {
                    this.renderPagination('categories', pagination);
                }

                // 顯示表格並隱藏載入動畫
                const loadingElement = document.getElementById('categories-loading');
                const tableElement = document.getElementById('categories-table');
                const paginationElement = document.getElementById('categories-pagination');

                if (loadingElement) loadingElement.style.display = 'none';
                if (tableElement) tableElement.style.display = 'table';
                if (paginationElement && pagination) paginationElement.style.display = 'flex';

                console.log('✅ 類別數據載入完成');
            } else {
                throw new Error('無法獲取類別數據');
            }

        } catch (error) {
            console.error('❌ 載入類別失敗:', error);
            this.hideLoading('categories');
            this.showError('載入類別數據失敗: ' + error.message);
        }
    }

    renderCategoriesTable(categories) {
        const tbody = document.getElementById('categories-tbody');
        
        // HTML轉義函數
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        tbody.innerHTML = categories.map(category => `
            <tr>
                <td style="width: 80px;">${category.id}</td>
                <td style="width: 200px;">
                    <div style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                         title="${escapeHtml(category.name)}">
                        ${escapeHtml(category.name)}
                    </div>
                </td>
                <td style="width: 100px; text-align: center;">
                    ${category._count?.products || 0}
                </td>
                <td style="width: 150px;">
                    ${this.formatDate(category.createdAt)}
                </td>
                <td style="width: 150px;">
                    ${this.formatDate(category.updatedAt)}
                </td>
                <td style="width: 120px;">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-primary" 
                                onclick="window.adminDashboard.editCategory(${category.id})" 
                                title="編輯類別">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="window.adminDashboard.deleteCategory(${category.id})" 
                                ${category._count?.products > 0 ? 'disabled title="此類別下有商品，無法刪除"' : 'title="刪除類別"'}>
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    </td>
                </tr>
        `).join('');
    }

    async loadOrdersData(page = 1) {
        try {
            console.log(`📋 載入訂單數據 - 頁面 ${page}`);

            const result = await window.apiClient.getAdminOrders({
                page: page,
                pageSize: this.pageSize
            });

            console.log('🔍 訂單API回應:', result);

            if (result.data) {
                const orders = result.data.orders || result.data.data || [];
                const pagination = result.data.pagination || result.data.meta || {
                    page: page,
                    totalPages: 1,
                    total: orders.length,
                    pageSize: this.pageSize
                };

                this.renderOrdersTable(orders);
                if (pagination) {
                    this.renderPagination('orders', pagination);
                }

                // 顯示表格並隱藏載入動畫
                const loadingElement = document.getElementById('orders-loading');
                const tableElement = document.getElementById('orders-table');
                const paginationElement = document.getElementById('orders-pagination');

                if (loadingElement) loadingElement.style.display = 'none';
                if (tableElement) tableElement.style.display = 'table';
                if (paginationElement && pagination) paginationElement.style.display = 'flex';

                console.log('✅ 訂單數據載入完成');
            } else {
                throw new Error('無法獲取訂單數據');
            }

        } catch (error) {
            console.error('❌ 載入訂單失敗:', error);
            this.hideLoading('orders');
            this.showError('載入訂單數據失敗: ' + error.message);
        }
    }

    renderOrdersTable(orders) {
        const tbody = document.getElementById('orders-tbody');
        
        tbody.innerHTML = orders.map(order => `
            <tr data-order-id="${order.id}">
                <td style="width: 80px;">#${order.id}</td>
                <td style="width: 120px;">
                    <div style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                         title="${order.buyer?.username || order.buyer?.account || '-'}">
                        ${order.buyer?.username || order.buyer?.account || '-'}
                    </div>
                </td>
                <td style="width: 120px;">
                    <div style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                         title="${order.seller?.shopName || order.seller?.username || '-'}">
                        ${order.seller?.shopName || order.seller?.username || '-'}
                    </div>
                </td>
                <td style="width: 80px; text-align: center;">
                    ${order._count?.orderItems || order.orderItems?.length || 0}
                </td>
                <td style="width: 100px;">
                    $${order.totalAmount || 0}
                </td>
                <td style="width: 100px;">
                    <span class="status-badge ${(order.status || 'UNCOMPLETED').toLowerCase()}">
                        ${this.getOrderStatusDisplayName(order.status || 'UNCOMPLETED')}
                    </span>
                </td>
                <td style="width: 120px;">
                    ${this.formatDate(order.createdAt)}
                </td>
                <td style="width: 100px;">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" 
                                onclick="window.adminDashboard.viewOrder(${order.id})" 
                                title="查看詳情">
                        <i class="bi bi-eye"></i>
                    </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadLogsData(page = 1, searchParams = {}) {
        console.log('📊 載入日誌數據...');
        this.showLoading('logs-loading');
        
        try {
            // 使用APIClient統一處理API請求
            const params = {
                page: page.toString(),
                pageSize: '20',
                ...searchParams
            };

            const result = await window.apiClient.getAdminLogs(params);
            console.log('✅ 日誌數據載入成功:', result);
            
            if (result.statusCode === 200 && result.data) {
                this.renderLogsTable(result.data.logs || []);
                this.renderPagination('logs', result.data.pagination);
            } else {
                this.showError('載入日誌數據失敗');
            }
        } catch (error) {
            console.error('❌ 載入日誌錯誤:', error);
            this.showError('載入日誌數據時發生錯誤');
        } finally {
            this.hideLoading('logs-loading');
        }
    }

    renderLogsTable(logs) {
        const tbody = document.getElementById('logs-tbody');
        
        tbody.innerHTML = logs.map(log => `
            <tr data-log-id="${log.id}">
                <td>${log.id}</td>
                <td>
                    <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">
                        ${log.event}
                    </code>
                </td>
                <td>${log.actor?.username || log.actor?.account || '-'}</td>
                <td>
                    <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                         title="${log.description || '-'}">
                        ${log.description || '-'}
                    </div>
                </td>
                <td>
                    <code style="background: #e3f2fd; padding: 2px 4px; border-radius: 3px; font-size: 0.75rem;">
                        ${log.ipAddress || '-'}
                    </code>
                </td>
                <td>${this.formatDate(log.createdAt)}</td>
                <td style="width: 100px;">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" 
                                onclick="window.adminDashboard.viewLogDetail(${log.id})" 
                                title="查看詳情">
                        <i class="bi bi-eye"></i>
                    </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(section, pagination) {
        const container = document.getElementById(`${section}-pagination`);
        if (!container || !pagination) return;

        const { page, pageSize, total, totalPages } = pagination;
        
        if (totalPages <= 1) {
            container.innerHTML = `
                <div class="pagination-info">
                    共 ${total} 筆資料
                </div>
            `;
            return;
        }

        // 計算分頁範圍
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        let paginationHTML = `
            <div class="pagination-info">
                顯示 ${((page - 1) * pageSize) + 1} - ${Math.min(page * pageSize, total)} 
                共 ${total} 筆資料
            </div>
            <div class="pagination-controls">
        `;

        // 第一頁按鈕
        if (page > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="window.adminDashboard.goToPage('${section}', 1)">
                    <i class="bi bi-chevron-double-left"></i>
                </button>
                <button class="pagination-btn" onclick="window.adminDashboard.goToPage('${section}', ${page - 1})">
                    <i class="bi bi-chevron-left"></i>
                </button>
            `;
        }

        // 頁碼按鈕
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === page ? 'active' : '';
            paginationHTML += `
                <button class="pagination-btn ${isActive}" onclick="window.adminDashboard.goToPage('${section}', ${i})">
                    ${i}
                </button>
            `;
        }

        // 最後一頁按鈕
        if (page < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" onclick="window.adminDashboard.goToPage('${section}', ${page + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
                <button class="pagination-btn" onclick="window.adminDashboard.goToPage('${section}', ${totalPages})">
                    <i class="bi bi-chevron-double-right"></i>
                </button>
            `;
        }

        paginationHTML += `
            </div>
            <div class="pagination-jump">
                <span>跳到</span>
                <input type="number" id="${section}-page-input" min="1" max="${totalPages}" value="${page}" 
                       onkeypress="if(event.key==='Enter') window.adminDashboard.jumpToPage('${section}')">
                <button class="pagination-btn" onclick="window.adminDashboard.jumpToPage('${section}')">確定</button>
            </div>
        `;

        container.innerHTML = paginationHTML;
    }

    // 分頁相關方法
    goToPage(section, page) {
        console.log(`📄 跳轉到 ${section} 第 ${page} 頁`);
        switch (section) {
            case 'users':
                this.loadUsers(page);
                break;
            case 'products':
                this.loadProductsData(page);
                break;
            case 'categories':
                this.loadCategoriesData(page);
                break;
            case 'orders':
                this.loadOrdersData(page);
                break;
            case 'logs':
                this.loadLogsData(page, this.currentLogSearchParams || {});
                break;
        }
    }

    jumpToPage(section) {
        const input = document.getElementById(`${section}-page-input`);
        if (input) {
            const page = parseInt(input.value);
            if (page && page > 0) {
                this.goToPage(section, page);
            }
        }
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'ADMIN': '管理員',
            'SELLER': '賣家',
            'BUYER': '買家'
        };
        return roleNames[role] || role;
    }

    getUserStatusDisplayName(status) {
        const statusNames = {
            'ACTIVE': '正常',
            'BLOCKED': '已封鎖',
            'INACTIVE': '未激活'
        };
        return statusNames[status] || status;
    }

    getStatusDisplayName(status) {
        const statusNames = {
            'ACTIVE': '上架中',
            'INACTIVE': '已下架',
            'PENDING': '審核中',
            'REJECTED': '已拒絕'
        };
        return statusNames[status] || status;
    }

    getOrderStatusDisplayName(status) {
        const statusNames = {
            'UNCOMPLETED': '未完成',
            'COMPLETED': '已完成',
            'CANCELED': '已取消'
        };
        return statusNames[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
        const date = new Date(dateString);
            
            // 檢查日期是否有效
            if (isNaN(date.getTime())) {
                return '-';
            }
            
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
                minute: '2-digit',
                hour12: false // 使用24小時制
        });
        } catch (error) {
            console.error('日期格式化錯誤:', error);
            return '-';
        }
    }

    // 刷新方法
    refreshUsers() {
        console.log('🔄 刷新用戶數據');
        this.loadUsers();
    }

    refreshProducts() {
        console.log('🔄 刷新商品數據');
        this.loadProductsData();
    }

    refreshCategories() {
        console.log('🔄 刷新類別數據');
        this.loadCategoriesData();
    }

    refreshOrders() {
        console.log('🔄 刷新訂單數據');
        this.loadOrdersData();
    }

    refreshLogs() {
        console.log('🔄 刷新日誌數據');
        this.loadLogsData();
    }

    // 管理功能方法
    showUserDetails() {
        window.App.showAlert('用戶詳情功能開發中...', 'info');
    }

    reviewPendingProducts() {
        window.App.showAlert('商品審核功能開發中...', 'info');
    }

    handleDisputes() {
        window.App.showAlert('糾紛處理功能開發中...', 'info');
    }

    processRefunds() {
        window.App.showAlert('退款處理功能開發中...', 'info');
    }

    exportLogs() {
        window.App.showAlert('日誌匯出功能開發中...', 'info');
    }

    // 用戶管理功能
    async viewUser(userId) {
        try {
            console.log(`👁️ 查看用戶詳情 ID: ${userId}`);
            
            // 從當前用戶列表中找到用戶資訊
            const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
            if (!userRow) {
                this.showError('找不到用戶資訊');
                return;
            }
            
            const cells = userRow.querySelectorAll('td');
            const userData = {
                id: userId,
                username: cells[1]?.textContent || '-',
                account: cells[2]?.textContent || '-',
                email: cells[3]?.textContent || '-',
                role: cells[4]?.textContent || '-',
                shopName: cells[5]?.textContent || '-',
                productCount: cells[6]?.textContent || '0',
                status: cells[7]?.textContent || '-',
                createdAt: cells[8]?.textContent || '-'
            };
            
            this.showUserDetailsModal(userData);
            
        } catch (error) {
            console.error('❌ 查看用戶詳情失敗:', error);
            this.showError('查看用戶詳情失敗: ' + error.message);
        }
    }

    showUserDetailsModal(user) {
        const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">用戶詳情 #${user.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">用戶名</label>
                        <div class="info-display">${user.username}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">帳號</label>
                        <div class="info-display">${user.account}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">信箱</label>
                        <div class="info-display">${user.email}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">角色</label>
                        <div class="info-display">${user.role}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">商店名稱</label>
                        <div class="info-display">${user.shopName}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">商品數量</label>
                        <div class="info-display">${user.productCount} 個</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">狀態</label>
                        <div class="info-display">${user.status}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">註冊時間</label>
                        <div class="info-display">${user.createdAt}</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
        `;
        
        this.showModal('用戶詳情', modalContent);
    }

    async deleteUser(userId) {
        try {
            console.log(`🗑️ 刪除用戶 ID: ${userId}`);
            
            const confirmMessage = '確定要刪除此用戶嗎？\n注意：此操作無法復原！';
            
            if (confirm(confirmMessage)) {
                const result = await window.apiClient.deleteUser(userId);
                
                this.showSuccess('用戶刪除成功');
                this.refreshUsers(); // 刷新用戶列表
            }
        } catch (error) {
            console.error('❌ 刪除用戶失敗:', error);
            this.showError('刪除用戶失敗: ' + error.message);
        }
    }

    async blockUser(userId) {
        try {
            console.log(`🔒 封鎖用戶 ID: ${userId}`);
            
            const confirmMessage = '確定要封鎖此用戶嗎？';
            
            if (confirm(confirmMessage)) {
                const result = await window.apiClient.blockUser(userId);
                
                this.showSuccess('用戶封鎖成功');
                this.refreshUsers(); // 刷新用戶列表
            }
        } catch (error) {
            console.error('❌ 封鎖用戶失敗:', error);
            this.showError('封鎖用戶失敗: ' + error.message);
        }
    }

    async unblockUser(userId) {
        try {
            console.log(`🔓 解封用戶 ID: ${userId}`);
            
            const confirmMessage = '確定要解封此用戶嗎？';
            
            if (confirm(confirmMessage)) {
                const result = await window.apiClient.unblockUser(userId);
                
                this.showSuccess('用戶解封成功');
                this.refreshUsers(); // 刷新用戶列表
            }
        } catch (error) {
            console.error('❌ 解封用戶失敗:', error);
            this.showError('解封用戶失敗: ' + error.message);
        }
    }

    // 商品管理功能
    async viewProduct(productId) {
        try {
            console.log(`👁️ 查看商品詳情 ID: ${productId}`);
            
            // 從當前商品列表中找到商品資訊
            const productRow = document.querySelector(`tr[data-product-id="${productId}"]`);
            if (!productRow) {
                this.showError('找不到商品資訊');
                return;
            }
            
            const cells = productRow.querySelectorAll('td');
            const productData = {
                id: productId,
                name: cells[1]?.textContent || '-',
                seller: cells[2]?.textContent || '-',
                category: cells[3]?.textContent || '-',
                price: cells[4]?.textContent || '-',
                stock: cells[5]?.textContent || '-',
                status: cells[6]?.textContent || '-',
                createdAt: cells[7]?.textContent || '-'
            };
            
            this.showProductDetailsModal(productData);
            
        } catch (error) {
            console.error('❌ 查看商品詳情失敗:', error);
            this.showError('查看商品詳情失敗: ' + error.message);
        }
    }

    showProductDetailsModal(product) {
        const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">商品詳情 #${product.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">商品名稱</label>
                        <div class="info-display">${product.name}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">賣家</label>
                        <div class="info-display">${product.seller}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">分類</label>
                        <div class="info-display">${product.category}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">價格範圍</label>
                        <div class="info-display">${product.price}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">總庫存</label>
                        <div class="info-display">${product.stock}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">狀態</label>
                        <div class="info-display">${product.status}</div>
                    </div>
                    <div class="col-12 mb-3">
                        <label class="form-label">建立時間</label>
                        <div class="info-display">${product.createdAt}</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
        `;
        
        this.showModal('商品詳情', modalContent);
    }

    async editProduct(productId) {
        try {
        console.log(`✏️ 編輯商品 ID: ${productId}`);
            
            // 從當前商品列表中找到商品資訊
            const productRow = document.querySelector(`tr[data-product-id="${productId}"]`);
            if (!productRow) {
                this.showError('找不到商品資訊');
                return;
            }
            
            const cells = productRow.querySelectorAll('td');
            const productData = {
                id: productId,
                name: cells[1]?.textContent?.trim() || '',
                category: cells[2]?.textContent?.trim() || '',
                seller: cells[3]?.textContent?.trim() || '',
                price: cells[4]?.textContent?.trim() || '',
                stock: cells[5]?.textContent?.trim() || '',
                status: cells[6]?.querySelector('.status-badge')?.textContent?.trim() || ''
            };
            
            this.showEditProductModal(productData);
            
        } catch (error) {
            console.error('❌ 編輯商品失敗:', error);
            this.showError('編輯商品失敗: ' + error.message);
        }
    }

    showEditProductModal(product) {
        const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">編輯商品 #${product.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="edit-product-form">
                    <input type="hidden" id="edit-product-id" value="${product.id}">
                    <div class="row">
                        <div class="col-md-12 mb-3">
                            <label for="edit-product-name" class="form-label">商品名稱 <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="edit-product-name" 
                                   value="${product.name}" required maxlength="200">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit-product-status" class="form-label">商品狀態</label>
                            <select class="form-select" id="edit-product-status">
                                <option value="ACTIVE" ${product.status === '上架中' ? 'selected' : ''}>上架中</option>
                                <option value="INACTIVE" ${product.status === '下架' ? 'selected' : ''}>下架</option>
                                <option value="PENDING" ${product.status === '待審核' ? 'selected' : ''}>待審核</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">目前分類</label>
                            <div class="info-display">${product.category}</div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">賣家</label>
                            <div class="info-display">${product.seller}</div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">價格範圍</label>
                            <div class="info-display">${product.price}</div>
                        </div>
                        <div class="col-12 mb-3">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                目前僅支援修改商品名稱和狀態。其他資訊需要賣家自行修改。
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" onclick="window.adminDashboard.updateProduct()">
                    <i class="bi bi-check-circle me-1"></i>
                    更新商品
                </button>
            </div>
        `;
        
        this.showModal('編輯商品', modalContent);
    }

    async updateProduct() {
        try {
            const productId = document.getElementById('edit-product-id').value;
            const name = document.getElementById('edit-product-name').value.trim();
            const status = document.getElementById('edit-product-status').value;
            
            if (!name) {
                this.showError('請輸入商品名稱');
                return;
            }
            
            console.log(`📝 更新商品 ID: ${productId}`);
            
            // 注意：這裡需要根據實際的API來調整
            // 目前使用 updateProduct API，但可能需要管理員專用的API
            const result = await window.apiClient.updateProduct(productId, {
                name: name,
                status: status
            });
            
            this.showSuccess('商品更新成功');
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('admin-modal'));
            if (modal) modal.hide();
            
            // 刷新商品列表
            this.refreshProducts();
            
        } catch (error) {
            console.error('❌ 更新商品失敗:', error);
            this.showError('更新商品失敗: ' + error.message);
        }
    }

    async deleteProduct(productId) {
        try {
            console.log(`🗑️ 刪除商品 ID: ${productId}`);
            
            const confirmMessage = '確定要刪除此商品嗎？\n注意：此操作無法復原！';
            
            if (confirm(confirmMessage)) {
                const result = await window.apiClient.deleteAdminProduct(productId);
                
                this.showSuccess('商品刪除成功');
                this.refreshProducts(); // 刷新商品列表
            }
        } catch (error) {
            console.error('❌ 刪除商品失敗:', error);
            this.showError('刪除商品失敗: ' + error.message);
        }
    }

    // 類別管理功能
    showAddCategoryModal() {
        const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">新增類別</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="add-category-form">
                    <div class="mb-3">
                        <label for="category-name" class="form-label">類別名稱 <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="category-name" required maxlength="100">
                        <div class="form-text">最多100個字元</div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-success" onclick="window.adminDashboard.createCategory()">
                    <i class="bi bi-plus-circle"></i>
                    新增類別
                </button>
            </div>
        `;
        
        this.showModal('新增類別', modalContent);
    }

    async createCategory() {
        try {
            const name = document.getElementById('category-name')?.value.trim();

            if (!name) {
                this.showError('請輸入類別名稱');
                return;
            }

            console.log('➕ 創建新類別:', { name });

            const categoryData = { name };

            const result = await window.apiClient.createCategory(categoryData);
            
            this.showSuccess('類別創建成功');
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('admin-modal'));
            if (modal) modal.hide();
            
            // 刷新類別列表
            this.refreshCategories();

        } catch (error) {
            console.error('❌ 創建類別失敗:', error);
            this.showError('創建類別失敗: ' + error.message);
        }
    }

    editCategory(categoryId) {
        console.log(`✏️ 編輯類別 ID: ${categoryId}`);
        
        // 先獲取類別詳情
        this.loadCategoryForEdit(categoryId);
    }

    async loadCategoryForEdit(categoryId) {
        try {
            console.log('📋 載入類別詳情進行編輯...');
            
            const result = await window.apiClient.getAdminCategory(categoryId);
            
            if (result.data) {
                const category = result.data;
                this.showEditCategoryModal(category);
            } else {
                throw new Error('無法獲取類別詳情');
            }

        } catch (error) {
            console.error('❌ 載入類別詳情失敗:', error);
            this.showError('載入類別詳情失敗: ' + error.message);
        }
    }

    showEditCategoryModal(category) {
        // HTML轉義函數
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">編輯類別 #${category.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="edit-category-form">
                    <input type="hidden" id="edit-category-id" value="${category.id}">
                    <div class="mb-3">
                        <label for="edit-category-name" class="form-label">類別名稱 <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="edit-category-name" 
                               value="${escapeHtml(category.name || '')}" required maxlength="100">
                        <div class="form-text">最多100個字元</div>
                    </div>
                    <div class="mb-3">
                        <div class="row">
                            <div class="col-md-6">
                                <label class="form-label">商品數量</label>
                                <div class="info-display">${category._count?.products || 0} 個商品</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">建立時間</label>
                                <div class="info-display">${this.formatDate(category.createdAt)}</div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" onclick="window.adminDashboard.updateCategory()">
                    <i class="bi bi-check-circle"></i>
                    更新類別
                </button>
            </div>
        `;
        
        this.showModal('編輯類別', modalContent);
    }

    async updateCategory() {
        try {
            const categoryId = document.getElementById('edit-category-id')?.value;
            const name = document.getElementById('edit-category-name')?.value.trim();

            if (!name) {
                this.showError('請輸入類別名稱');
                return;
            }

            console.log('📝 更新類別:', { categoryId, name });

            const categoryData = { name };

            const result = await window.apiClient.updateCategory(categoryId, categoryData);
            
            this.showSuccess('類別更新成功');
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('admin-modal'));
            if (modal) modal.hide();
            
            // 刷新類別列表
            this.refreshCategories();

        } catch (error) {
            console.error('❌ 更新類別失敗:', error);
            this.showError('更新類別失敗: ' + error.message);
        }
    }

    async deleteCategory(categoryId) {
        try {
            console.log(`🗑️ 刪除類別 ID: ${categoryId}`);
            
            const confirmMessage = '確定要刪除此類別嗎？\n注意：只有沒有商品的類別才能被刪除。';
            
            if (confirm(confirmMessage)) {
                const result = await window.apiClient.deleteCategory(categoryId);
                
                this.showSuccess('類別刪除成功');
                this.refreshCategories(); // 刷新類別列表
            }
        } catch (error) {
            console.error('❌ 刪除類別失敗:', error);
            let errorMessage = '刪除類別失敗: ' + error.message;
            
            // 處理特定錯誤訊息
            if (error.message.includes('商品')) {
                errorMessage = '無法刪除此類別，因為該類別下還有商品。請先移除或重新分類所有商品。';
            }
            
            this.showError(errorMessage);
        }
    }

    // 訂單管理功能
    async viewOrder(orderId) {
        try {
            console.log(`👁️ 查看訂單詳情 ID: ${orderId}`);
            
            const result = await window.apiClient.getAdminOrder(orderId);
            
            if (result.data) {
                this.showOrderDetailsModal(result.data);
            } else {
                this.showError('無法獲取訂單詳情');
            }
            
        } catch (error) {
            console.error('❌ 查看訂單詳情失敗:', error);
            this.showError('查看訂單詳情失敗: ' + error.message);
        }
    }

    showOrderDetailsModal(order) {
        const modalContent = `
            <div class="modal-header">
                <h5 class="modal-title">訂單詳情 #${order.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">買家</label>
                        <div class="info-display">${order.buyer?.username || order.buyer?.account || '-'}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">賣家</label>
                        <div class="info-display">${order.seller?.shopName || order.seller?.username || '-'}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">商品數量</label>
                        <div class="info-display">${order._count?.orderItems || order.orderItems?.length || 0} 項</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">總金額</label>
                        <div class="info-display">$${order.totalAmount || 0}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">訂單狀態</label>
                        <div class="info-display">
                            <span class="status-badge ${order.status.toLowerCase()}">
                                ${this.getOrderStatusDisplayName(order.status)}
                            </span>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">下單時間</label>
                        <div class="info-display">${this.formatDate(order.createdAt)}</div>
                    </div>
                    ${order.shippingAddress ? `
                    <div class="col-12 mb-3">
                        <label class="form-label">收貨地址</label>
                        <div class="info-display">${order.shippingAddress}</div>
                    </div>
                    ` : ''}
                    ${order.notes ? `
                    <div class="col-12 mb-3">
                        <label class="form-label">備註</label>
                        <div class="info-display">${order.notes}</div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- 訂單狀態更新 -->
                <div class="mt-4">
                    <label class="form-label">更新訂單狀態</label>
                    <div class="d-flex gap-2">
                        <select class="form-select" id="order-status-select">
                            <option value="UNCOMPLETED" ${order.status === 'UNCOMPLETED' ? 'selected' : ''}>未完成</option>
                            <option value="COMPLETED" ${order.status === 'COMPLETED' ? 'selected' : ''}>已完成</option>
                            <option value="CANCELED" ${order.status === 'CANCELED' ? 'selected' : ''}>已取消</option>
                        </select>
                        <button class="btn btn-primary" onclick="window.adminDashboard.updateOrderStatus(${order.id})">
                            更新
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
            </div>
        `;
        
        this.showModal('訂單詳情', modalContent);
    }

    async updateOrderStatus(orderId) {
        try {
            const statusSelect = document.getElementById('order-status-select');
            const newStatus = statusSelect.value;
            
            if (!newStatus) {
                this.showError('請選擇新的訂單狀態');
                return;
            }
            
            console.log(`📝 更新訂單狀態 ID: ${orderId}, 新狀態: ${newStatus}`);
            
            const result = await window.apiClient.updateOrderStatus(orderId, newStatus);
            
            this.showSuccess('訂單狀態更新成功');
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('admin-modal'));
            if (modal) modal.hide();
            
            // 刷新訂單列表
            this.refreshOrders();
            
        } catch (error) {
            console.error('❌ 更新訂單狀態失敗:', error);
            this.showError('更新訂單狀態失敗: ' + error.message);
        }
    }

    // 搜尋日誌
    searchLogs() {
        const searchParams = {};
        
        // 通用搜尋
        const search = document.getElementById('logs-search')?.value.trim();
        if (search) searchParams.search = search;
        
        // 事件類型
        const event = document.getElementById('logs-event-filter')?.value;
        if (event) searchParams.event = event;
        
        // 用戶名
        const username = document.getElementById('logs-username-filter')?.value.trim();
        if (username) searchParams.username = username;
        
        // IP地址
        const ip = document.getElementById('logs-ip-filter')?.value.trim();
        if (ip) searchParams.ip = ip;
        
        // 時間範圍
        const startDate = document.getElementById('logs-start-date')?.value;
        if (startDate) searchParams.startDate = startDate;
        
        const endDate = document.getElementById('logs-end-date')?.value;
        if (endDate) searchParams.endDate = endDate;
        
        console.log('🔍 搜尋參數:', searchParams);
        
        // 保存搜尋參數到實例
        this.currentLogSearchParams = searchParams;
        
        // 重新載入數據
        this.loadLogsData(1, searchParams);
    }

    // 清除搜尋
    clearLogSearch() {
        // 清除表單
        document.getElementById('logs-search').value = '';
        document.getElementById('logs-event-filter').value = '';
        document.getElementById('logs-username-filter').value = '';
        document.getElementById('logs-ip-filter').value = '';
        document.getElementById('logs-start-date').value = '';
        document.getElementById('logs-end-date').value = '';
        
        // 清除搜尋參數
        this.currentLogSearchParams = {};
        
        // 重新載入原始數據
        this.loadLogsData();
    }

    // 查看日誌詳情
    async viewLogDetail(logId) {
        try {
            // 使用APIClient獲取所有日誌，然後找到指定的日誌
            // 修改：使用更大的pageSize來確保找到目標日誌
            const result = await window.apiClient.getAdminLogs({ pageSize: 1000 });
            
            if (result.statusCode !== 200 || !result.data) {
                this.showError('獲取日誌數據失敗');
                return;
            }
            
            const log = result.data.logs.find(l => l.id === logId);
            
            if (!log) {
                this.showError('找不到指定的日誌記錄');
                return;
            }

            // 格式化meta數據
            let metaDisplay = '-';
            if (log.meta && typeof log.meta === 'object') {
                metaDisplay = `<pre style="white-space: pre-wrap; font-size: 0.85rem;">${JSON.stringify(log.meta, null, 2)}</pre>`;
            }

            // 創建模態框內容
            const modalContent = `
                <div class="modal-header">
                    <h5 class="modal-title">日誌詳情 #${log.id}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">事件類型</label>
                            <div class="form-control-plaintext">
                                <code>${log.event}</code>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">操作者</label>
                            <div class="form-control-plaintext">
                                ${log.actor?.username || log.actor?.account || '-'}
                                ${log.actor?.role ? `<span class="badge bg-secondary ms-2">${this.getRoleDisplayName(log.actor.role)}</span>` : ''}
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-bold">描述</label>
                            <div class="form-control-plaintext">
                                ${log.description || '-'}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">IP地址</label>
                            <div class="form-control-plaintext">
                                <code>${log.ipAddress || '-'}</code>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">時間</label>
                            <div class="form-control-plaintext">
                                ${this.formatDate(log.createdAt)}
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-bold">詳細資訊</label>
                            <div class="form-control-plaintext">
                                ${metaDisplay}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                </div>
            `;

            // 顯示模態框
            this.showModal('日誌詳情', modalContent);

        } catch (error) {
            console.error('查看日誌詳情錯誤:', error);
            this.showError('獲取日誌詳情失敗');
        }
    }

    // 添加排序功能
    sortLogs(field) {
        // 切換排序方向
        if (this.currentLogSort === field) {
            this.currentLogSort = field.startsWith('-') ? field.substring(1) : '-' + field;
        } else {
            this.currentLogSort = field;
        }
        
        // 重新載入數據
        this.loadLogsData(1, { 
            ...this.currentLogSearchParams, 
            sortBy: this.currentLogSort 
        });
    }

    // 顯示模態框的通用方法
    showModal(title, content) {
        // 檢查是否已有模態框
        let modal = document.getElementById('admin-modal');
        if (!modal) {
            // 創建模態框
            modal = document.createElement('div');
            modal.id = 'admin-modal';
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" id="admin-modal-content">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // 設置內容
        document.getElementById('admin-modal-content').innerHTML = content;

        // 顯示模態框
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

// 初始化管理後台儀表板
function initAdminDashboard() {
    console.log('🚀 初始化管理員儀表板');
    
    const initDashboard = () => {
        const dashboard = new AdminDashboard();
        
        // 設置全域變數供按鈕調用
        window.adminDashboard = dashboard;
        
        // 為了向後兼容，也設置舊的函數名稱
        window.showUsersSection = () => dashboard.showSection('users');
        window.showProductsSection = () => dashboard.showSection('products');
        window.showCategoriesSection = () => dashboard.showSection('categories');
        window.showOrdersSection = () => dashboard.showSection('orders');
        window.showLogsSection = () => dashboard.showSection('logs');
        window.loadUsers = () => dashboard.loadUsers();
        window.loadCategories = () => dashboard.loadCategoriesData();
        
        // 開始初始化
        dashboard.init().then(() => {
            console.log('✅ 管理員儀表板初始化完成');
        }).catch(error => {
            console.error('❌ 管理員儀表板初始化失敗:', error);
        });
    };

    // 確保DOM已載入
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
} 

// 如果當前頁面是管理後台，自動初始化
if (document.body.querySelector('.admin-dashboard-main')) {
    console.log('🎯 檢測到管理員儀表板頁面，開始初始化...');
    initAdminDashboard();
}
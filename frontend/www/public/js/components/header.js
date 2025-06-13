import authManager from '../services/auth-manager.js';
import apiClient from '../services/api-client.js';
import { getCategoryIcon } from '../services/utils.js';

export class Header {
    constructor() {
        this.userGreeting = document.getElementById('user-greeting');
        this.authButtons = document.getElementById('auth-buttons');
        this.userDropdown = document.getElementById('user-dropdown');
        this.cartIcon = document.getElementById('cart-icon');
        this.cartCountBadge = document.getElementById('cart-count');
        this.chatIcon = document.getElementById('chat-icon');
        this.logoutBtn = document.getElementById('logout-btn');
        this.categoryMenu = document.getElementById('category-dropdown-menu');
        this.mobileCategoriesContainer = document.getElementById('mobile-categories-container');
        
        // 手機版元素
        this.mobileCartIcon = document.getElementById('mobile-cart-icon');
        this.mobileCartCountBadge = document.getElementById('cart-count-mobile');
        this.mobileChatIcon = document.getElementById('mobile-chat-icon');
        this.mobileUserInfo = document.getElementById('mobile-user-info');
        this.mobileAuthButtons = document.getElementById('mobile-auth-buttons');
        this.mobileUserGreeting = document.getElementById('mobile-user-greeting');
        this.mobileUserEmail = document.getElementById('mobile-user-email');
        this.mobileUserMenu = document.getElementById('mobile-user-menu');
        this.mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    }

    init() {
        window.addEventListener('authChange', (e) => this.updateUI(e.detail));
        this.logoutBtn?.addEventListener('click', (e) => this.handleLogout(e));
        this.mobileLogoutBtn?.addEventListener('click', (e) => this.handleLogout(e));
        
        // 為所有登出連結添加事件監聽器（包括服務器端渲染的）
        this.setupLogoutHandlers();
        
        // 監聽購物車更新事件
        window.addEventListener('cartUpdated', () => {
            this.updateCartCount();
        });
        
        // 設置搜尋功能
        this.setupSearchFunctionality();
        
        // Initial UI state based on current auth status
        this.updateUI({ 
            user: authManager.user, 
            isAuthenticated: authManager.isAuthenticated() 
        });

        this.loadCategories();
        this.setupMobileDropdown();
    }

    setupLogoutHandlers() {
        // 為所有指向 /logout 的連結添加事件監聽器
        const logoutLinks = document.querySelectorAll('a[href="/logout"]');
        logoutLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleLogout(e));
        });
    }

    setupMobileDropdown() {
        // Handle touch devices dropdown for navigation items
        const navDropdownToggle = document.querySelector('.nav-item.dropdown .nav-link');
        if (navDropdownToggle) {
            navDropdownToggle.addEventListener('click', (e) => {
                // Only handle on touch devices
                if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
                    e.preventDefault();
                    const dropdown = e.target.closest('.nav-item.dropdown');
                    dropdown.classList.toggle('show');
                }
            });
        }

        // Handle touch devices dropdown for user menu
        const userDropdownToggle = document.querySelector('#user-dropdown button');
        if (userDropdownToggle) {
            userDropdownToggle.addEventListener('click', (e) => {
                // Only handle on touch devices
                if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
                    e.preventDefault();
                    const dropdown = e.target.closest('.dropdown');
                    dropdown.classList.toggle('show');
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
                document.querySelectorAll('.nav-item.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });
    }

    setupSearchFunctionality() {
        // 桌面版搜尋
        const searchForm = document.querySelector('.search-center form');
        const searchInput = document.getElementById('search-input');
        
        // 手機版搜尋 (在offcanvas中)
        const mobileSearchForm = document.querySelector('#mobile-menu form');
        const mobileSearchInput = document.querySelector('#mobile-menu .search-input');
        
        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch(searchInput.value.trim());
            });
        }
        
        if (mobileSearchForm && mobileSearchInput) {
            mobileSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch(mobileSearchInput.value.trim());
            });
        }
    }

    performSearch(searchTerm) {
        if (!searchTerm) {
            // 如果沒有搜尋詞，跳轉到所有商品頁面
            window.location.href = '/products';
            return;
        }
        
        // 跳轉到商品頁面並帶上搜尋參數
        const params = new URLSearchParams();
        params.set('search', searchTerm);
        window.location.href = `/products?${params.toString()}`;
    }

    updateUI({ user, isAuthenticated }) {
        if (isAuthenticated && user) {
            // 桌面版
            if (this.userGreeting) {
                this.userGreeting.textContent = `${user.username}，您好`;
            }
            
            if (this.authButtons) {
                this.authButtons.style.display = 'none';
            }
            
            if (this.userDropdown) {
                this.userDropdown.style.display = 'block';
                this.updateUserDropdownMenu(user);
            }
            
            // 手機版
            if (this.mobileUserInfo) {
                this.mobileUserInfo.style.display = 'block';
            }
            if (this.mobileAuthButtons) {
                this.mobileAuthButtons.style.display = 'none';
            }
            if (this.mobileUserMenu) {
                this.mobileUserMenu.style.display = 'block';
                this.updateMobileUserMenu(user);
            }
            if (this.mobileUserGreeting) {
                this.mobileUserGreeting.textContent = user.username || user.account || '用戶';
            }
            if (this.mobileUserEmail) {
                this.mobileUserEmail.textContent = user.email || user.account || '';
            }
            
            // 根據用戶角色顯示不同的按鈕
            if (user.role === 'BUYER') {
                // 買家顯示購物車和聊天室
                if (this.cartIcon) {
                    this.cartIcon.style.display = 'inline-block';
                    this.updateCartCount();
                }
                if (this.mobileCartIcon) {
                    this.mobileCartIcon.style.display = 'inline-block';
                }
                if (this.chatIcon) {
                    this.chatIcon.style.display = 'inline-block';
                }
                if (this.mobileChatIcon) {
                    this.mobileChatIcon.style.display = 'inline-block';
                }
            } else if (user.role === 'SELLER') {
                // 賣家顯示聊天室和賣家中心
                if (this.chatIcon) {
                    this.chatIcon.style.display = 'inline-block';
                }
                if (this.mobileChatIcon) {
                    this.mobileChatIcon.style.display = 'inline-block';
                }
                this.showSellerCenter();
            }
        } else {
            // 桌面版
            if (this.userGreeting) {
                this.userGreeting.textContent = '您好, 訪客';
            }
            
            if (this.authButtons) {
                this.authButtons.style.display = 'block';
            }
            
            if (this.userDropdown) {
                this.userDropdown.style.display = 'none';
            }
            
            // 手機版
            if (this.mobileUserInfo) {
                this.mobileUserInfo.style.display = 'none';
            }
            if (this.mobileAuthButtons) {
                this.mobileAuthButtons.style.display = 'block';
            }
            if (this.mobileUserMenu) {
                this.mobileUserMenu.style.display = 'none';
            }
            
            // 隱藏購物車和賣家中心
            if (this.cartIcon) {
                this.cartIcon.style.display = 'none';
            }
            if (this.mobileCartIcon) {
                this.mobileCartIcon.style.display = 'none';
            }
            if (this.chatIcon) {
                this.chatIcon.style.display = 'none';
            }
            if (this.mobileChatIcon) {
                this.mobileChatIcon.style.display = 'none';
            }
            this.hideSellerCenter();
        }
    }

    updateCartCount() {
        if (!window.authManager?.isAuthenticated()) return;
        
        const user = window.authManager.getUser();
        if (user?.role !== 'BUYER') return;
        
        fetch('/api/v1/buyers/me/cart')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.items && data.data.items.length > 0) {
                    const totalItems = data.data.items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    // 桌面版
                    if (this.cartCountBadge) {
                        this.cartCountBadge.textContent = totalItems;
                        this.cartCountBadge.style.display = 'inline-block';
                    }
                    
                    // 手機版
                    if (this.mobileCartCountBadge) {
                        this.mobileCartCountBadge.textContent = totalItems;
                        this.mobileCartCountBadge.style.display = 'inline-block';
                    }
                } else {
                    // 桌面版
                    if (this.cartCountBadge) {
                        this.cartCountBadge.style.display = 'none';
                    }
                    
                    // 手機版
                    if (this.mobileCartCountBadge) {
                        this.mobileCartCountBadge.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Failed to update cart count:', error);
            });
    }

    showSellerCenter() {
        // 修改購物車按鈕為賣家中心
        if (this.cartIcon) {
            this.cartIcon.href = '/seller/dashboard';
            this.cartIcon.innerHTML = '賣家中心';
            this.cartIcon.style.display = 'inline-block';
        }
        if (this.mobileCartIcon) {
            this.mobileCartIcon.href = '/seller/dashboard';
            this.mobileCartIcon.innerHTML = '<i class="bi bi-shop text-muted"></i>';
            this.mobileCartIcon.style.display = 'inline-block';
        }
    }

    hideSellerCenter() {
        // 重置購物車按鈕
        if (this.cartIcon) {
            this.cartIcon.href = '/cart';
            this.cartIcon.innerHTML = '<i class="bi bi-cart me-1"></i>購物車<span class="position-absolute cart-badge" id="cart-count" style="display: none;">0</span>';
            // 重新獲取購物車計數元素的引用
            this.cartCountBadge = document.getElementById('cart-count');
        }
        if (this.mobileCartIcon) {
            this.mobileCartIcon.href = '/cart';
            this.mobileCartIcon.innerHTML = '<i class="bi bi-cart text-muted"></i><span class="position-absolute cart-badge-mobile" id="cart-count-mobile" style="display: none;">0</span>';
            // 重新獲取手機版購物車計數元素的引用
            this.mobileCartCountBadge = document.getElementById('cart-count-mobile');
        }
    }

    updateUserDropdownMenu(user) {
        const buyerOrdersLink = document.getElementById('buyer-orders-link');
        const sellerDashboardLink = document.getElementById('seller-dashboard-link');
        const adminDashboardLink = document.getElementById('admin-dashboard-link');
        
        if (user.role === 'BUYER') {
            // 買家顯示我的訂單，隱藏賣家中心
            if (buyerOrdersLink) buyerOrdersLink.style.display = 'block';
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'none';
            if (adminDashboardLink) adminDashboardLink.style.display = 'none';
        } else if (user.role === 'SELLER') {
            // 賣家隱藏我的訂單，顯示賣家中心
            if (buyerOrdersLink) buyerOrdersLink.style.display = 'none';
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'block';
            if (adminDashboardLink) adminDashboardLink.style.display = 'none';
        } else if (user.role === 'ADMIN') {
            // 管理員顯示管理後台，隱藏兩者
            if (buyerOrdersLink) buyerOrdersLink.style.display = 'none';
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'none';
            if (adminDashboardLink) adminDashboardLink.style.display = 'block';
        } else {
            // 其他角色隱藏兩者
            if (buyerOrdersLink) buyerOrdersLink.style.display = 'none';
            if (sellerDashboardLink) sellerDashboardLink.style.display = 'none';
            if (adminDashboardLink) adminDashboardLink.style.display = 'none';
        }
    }

    updateMobileUserMenu(user) {
        const mobileBuyerOrdersLink = document.getElementById('mobile-buyer-orders-link');
        const mobileBuyerCartLink = document.getElementById('mobile-buyer-cart-link');
        const mobileSellerDashboardLink = document.getElementById('mobile-seller-dashboard-link');
        const mobileAdminDashboardLink = document.getElementById('mobile-admin-dashboard-link');
        if (user.role === 'BUYER') {
            // 買家顯示我的訂單和購物車，隱藏賣家中心
            if (mobileBuyerOrdersLink) mobileBuyerOrdersLink.style.display = 'block';
            if (mobileBuyerCartLink) mobileBuyerCartLink.style.display = 'block';
            if (mobileSellerDashboardLink) mobileSellerDashboardLink.style.display = 'none';
            if (mobileAdminDashboardLink) mobileAdminDashboardLink.style.display = 'none';
        } else if (user.role === 'SELLER') {
            // 賣家隱藏我的訂單和購物車，顯示賣家中心
            if (mobileBuyerOrdersLink) mobileBuyerOrdersLink.style.display = 'none';
            if (mobileBuyerCartLink) mobileBuyerCartLink.style.display = 'none';
            if (mobileSellerDashboardLink) mobileSellerDashboardLink.style.display = 'block';
            if (mobileAdminDashboardLink) mobileAdminDashboardLink.style.display = 'none';
        } else {
            // 其他角色隱藏所有
            if (mobileBuyerOrdersLink) mobileBuyerOrdersLink.style.display = 'none';
            if (mobileBuyerCartLink) mobileBuyerCartLink.style.display = 'none';
            if (mobileSellerDashboardLink) mobileSellerDashboardLink.style.display = 'none';
            if (mobileAdminDashboardLink) mobileAdminDashboardLink.style.display = 'block';
        }
    }

    async loadCategories() {
        // 載入桌面版類別
        if (this.categoryMenu) {
            const loadingIndicator = this.categoryMenu.querySelector('#category-loading');
            
            try {
                const result = await apiClient.getCategories();
                (result.data || []).forEach(category => {
                    const icon = getCategoryIcon(category.name) || 'bi-tag';
                    const item = document.createElement('li');
                    item.innerHTML = `<a class="dropdown-item" href="/products?categoryId=${category.id}"><i class="bi ${icon} me-2"></i>${category.name}</a>`;
                    this.categoryMenu.insertBefore(item, loadingIndicator);
                });
            } catch (error) {
                console.error('Failed to load desktop categories:', error);
            } finally {
                loadingIndicator?.remove();
            }
        }

        // 載入手機版類別
        if (this.mobileCategoriesContainer) {
            const mobileLoadingIndicator = this.mobileCategoriesContainer.querySelector('#mobile-category-loading');
            
            try {
                const result = await apiClient.getCategories();
                
                (result.data || []).forEach(category => {
                    const icon = getCategoryIcon(category.name) || 'bi-tag';
                    const item = document.createElement('li');
                    item.className = 'nav-item';
                    item.innerHTML = `<a class="nav-link py-3" href="/products?categoryId=${category.id}"><i class="${icon} me-3"></i>${category.name}</a>`;
                    this.mobileCategoriesContainer.insertBefore(item, mobileLoadingIndicator);
                });
            } catch (error) {
                console.error('Failed to load mobile categories:', error);
            } finally {
                mobileLoadingIndicator?.remove();
            }
        }
    }

    async handleLogout(e) {
        e.preventDefault();
        await authManager.logout();
        window.location.href = '/';
    }
} 
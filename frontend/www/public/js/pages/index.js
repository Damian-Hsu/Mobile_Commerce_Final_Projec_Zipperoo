// Note: Dependencies like APIClient and UIUtils will be refactored into importable modules.
// For now, their usage is commented out or replaced with placeholders.

import apiClient from '../services/api-client.js';
import { UIUtils, getCategoryIcon } from '../services/utils.js';

export class IndexPage {
    constructor() {
        this.apiClient = apiClient;
        // this.uiUtils = new UIUtils(); // To be enabled after UIUtils is refactored

        this.categoriesContainer = document.querySelector('.categories-container');
        this.hotProductsContainer = document.getElementById('hot-products-container');
        this.hotProductsLoading = document.getElementById('hot-products-loading');
        this.noProductsMessage = document.getElementById('no-products');
        this.categoriesLoading = document.getElementById('categories-loading');
        this.newsletterForm = document.getElementById('newsletter-form');
    }

    async init() {
        try {
            // 更新調試信息
            this.updateDebugInfo();
            
            // 等待 apiClient 準備就緒
            await this.waitForApiClient();
            
            // 並行載入分類和熱門商品
            await Promise.all([
                this.loadCategories(),
                this.loadHotProducts()
            ]);
            
            // 設置事件監聽器
            this.setupEventListeners();
        } catch (error) {
            console.error('初始化首頁失敗:', error);
        }
    }

    updateDebugInfo() {
        try {
            // 更新當前 URL
            const currentUrlElement = document.getElementById('debug-current-url');
            if (currentUrlElement) {
                currentUrlElement.textContent = window.location.href;
            }

            // 獲取 API 配置信息
            if (window.apiClient && window.apiClient.baseURL) {
                const apiFullElement = document.getElementById('debug-api-full');
                if (apiFullElement) {
                    apiFullElement.textContent = window.apiClient.baseURL;
                }

                const apiBaseElement = document.getElementById('debug-api-base');
                if (apiBaseElement) {
                    const baseUrl = window.apiClient.baseURL.replace('/api/v1', '');
                    apiBaseElement.textContent = baseUrl;
                }
            }

            // 監聽 API 請求
            this.setupApiRequestLogger();
        } catch (error) {
            console.error('更新調試信息失敗:', error);
        }
    }

    setupApiRequestLogger() {
        // 記錄 API 請求
        const originalRequest = window.apiClient.request;
        if (originalRequest) {
            window.apiClient.request = async function(method, endpoint, data, requireAuth) {
                const fullUrl = `${this.baseURL}${endpoint}`;
                
                // 更新調試顯示
                const debugElement = document.getElementById('debug-last-request');
                if (debugElement) {
                    const timestamp = new Date().toLocaleTimeString();
                    debugElement.innerHTML = `
                        <strong>${timestamp}</strong><br>
                        ${method} ${fullUrl}<br>
                        ${data ? `Data: ${JSON.stringify(data)}` : ''}
                    `;
                }
                
                return originalRequest.call(this, method, endpoint, data, requireAuth);
            };
        }
    }

    setupEventListeners() {
        if (this.newsletterForm) {
            this.newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        }
        document.body.addEventListener('click', this.handleProductCardClicks.bind(this));
        document.querySelectorAll('form[role="search"]').forEach(form => {
            form.addEventListener('submit', this.handleSearchSubmit.bind(this));
        });
    }

    async loadCategories() {
        try {
            this.showCategoriesLoading();

            const response = await window.apiClient.getCategories();
            
            if (response.statusCode === 200 && response.data) {
                // 只取前6個分類
                const categories = response.data.slice(0, 6);
                this.renderCategories(categories);
            } else {
                console.error('載入分類失敗:', response.message);
                this.showDefaultCategories();
            }
        } catch (error) {
            console.error('載入分類失敗:', error);
            this.showDefaultCategories();
        } finally {
            this.hideCategoriesLoading();
        }
    }

    async loadHotProducts() {
        try {
            this.showHotProductsLoading();

            // 載入熱門商品 (取前8個)
            const response = await window.apiClient.getProducts({ 
                pageSize: 8, 
                page: 1,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });
            
            if (response.statusCode === 200 && response.data && response.data.data) {
                this.renderHotProducts(response.data.data);
            } else {
                console.error('載入熱門商品失敗:', response.message);
                this.showNoProducts();
            }
        } catch (error) {
            console.error('載入熱門商品失敗:', error);
            this.showNoProducts();
        } finally {
            this.hideHotProductsLoading();
        }
    }

    renderCategories(categories) {
        if (!this.categoriesContainer) return;

        const defaultIcon = 'bi-grid';

        const categoriesHTML = categories.map(category => {
            const icon = getCategoryIcon(category.name) || defaultIcon;
            console.log(`API Category: ${category.name}, Icon: ${icon}`); // Debug log
            return `
                <div class="col-lg-3 col-md-6 mb-4">
                    <a href="/products?categoryId=${category.id}" class="category-card card h-100">
                        <div class="card-body">
                            <div class="category-icon">
                                <i class="bi ${icon}"></i>
                            </div>
                            <h5 class="card-title fw-bold">${category.name}</h5>
                            <p class="card-text text-muted">${category.description || '探索更多商品'}</p>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        this.categoriesContainer.innerHTML = categoriesHTML;
    }

    renderHotProducts(products) {
        if (!this.hotProductsContainer) return;

        if (products.length === 0) {
            this.showNoProducts();
            return;
        }

        const productsHTML = products.map(product => {
            const imageUrl = window.UIUtils ? window.UIUtils.getProductImageUrl(product) : '/images/placeholder.svg';
            const price = product.variants && product.variants.length > 0 ? product.variants[0].price : 0;
            
            return `
                    <div class="col-lg-3 col-md-6 mb-4">
                    <div class="product-card card h-100" onclick="window.location.href='/products/${product.id}'" style="cursor: pointer;">
                            <div class="product-image">
                            <img src="${imageUrl}" 
                                 class="card-img-top" 
                                 alt="${product.name}" 
                                 loading="lazy"
                                 onerror="this.src='/images/placeholder.svg'; this.onerror=null;">
                                <div class="product-overlay">
                                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.location.href='/products/${product.id}'">
                                        <i class="bi bi-eye me-1"></i>查看詳情
                                </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <h6 class="card-title fw-bold text-truncate">${product.name}</h6>
                                <p class="card-text text-muted small text-truncate">${product.description || ''}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="price fw-bold text-primary">NT$ ${price.toLocaleString()}</span>
                                    <small class="text-muted">${product.category?.name || ''}</small>
                                </div>
                            </div>
                        </div>
                    </div>
            `;
        }).join('');

        this.hotProductsContainer.innerHTML = productsHTML;
        this.hideNoProducts();
    }

    showDefaultCategories() {
        // 如果API失敗，顯示預設分類
        if (!this.categoriesContainer) return;

        const defaultCategoriesData = [
            { name: '女裝', href: '/products?category=women', description: '優雅洋裝、時尚上衣' },
            { name: '男裝', href: '/products?category=men', description: '帥氣西裝、休閒穿搭' },
            { name: '鞋類', href: '/products?category=shoes', description: '舒適美鞋、潮流款式' },
            { name: '配件', href: '/products?category=accessories', description: '精美飾品、實用配件' },
            { name: '包包', href: '/products?category=bags', description: '時尚包款、實用收納' },
            { name: '運動', href: '/products?category=sports', description: '運動裝備、健身用品' }
        ];

        const defaultCategories = defaultCategoriesData.map(category => {
            const icon = getCategoryIcon(category.name);
            console.log(`Category: ${category.name}, Icon: ${icon}`); // Debug log
            return `
                <div class="col-lg-3 col-md-6 mb-4">
                    <a href="${category.href}" class="category-card card h-100">
                        <div class="card-body">
                            <div class="category-icon">
                                <i class="bi ${icon}"></i>
                            </div>
                            <h5 class="card-title fw-bold">${category.name}</h5>
                            <p class="card-text text-muted">${category.description}</p>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        this.categoriesContainer.innerHTML = defaultCategories;
    }

    showCategoriesLoading() {
        if (this.categoriesLoading) {
            this.categoriesLoading.style.display = 'flex';
        }
    }

    hideCategoriesLoading() {
        if (this.categoriesLoading) {
            this.categoriesLoading.style.display = 'none';
        }
    }

    showHotProductsLoading() {
        if (this.hotProductsLoading) {
            this.hotProductsLoading.style.display = 'block';
        }
        if (this.hotProductsContainer) {
            this.hotProductsContainer.innerHTML = '';
        }
        this.hideNoProducts();
    }

    hideHotProductsLoading() {
        if (this.hotProductsLoading) {
            this.hotProductsLoading.style.display = 'none';
        }
    }

    showNoProducts() {
        if (this.noProductsMessage) {
            this.noProductsMessage.classList.remove('d-none');
        }
    }

    hideNoProducts() {
        if (this.noProductsMessage) {
            this.noProductsMessage.classList.add('d-none');
        }
    }

    async waitForApiClient() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (window.apiClient && 
                typeof window.apiClient.getCategories === 'function' &&
                typeof window.apiClient.getProducts === 'function') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('API客戶端載入超時');
    }

    handleNewsletterSubmit(event) {
        event.preventDefault();
        const emailInput = event.target.querySelector('input[type="email"]');
        if (emailInput.value) {
            // this.uiUtils.showToast('Thank you for subscribing!', 'success');
            console.log(`Subscribed with ${emailInput.value}`);
            emailInput.value = '';
        }
    }

    handleProductCardClicks(event) {
        const target = event.target.closest('button');
        if (!target) return;

        const productId = target.dataset.productId;
        if (!productId) return;

        if (target.classList.contains('add-to-cart-btn')) {
            this.handleAddToCartClick(productId, target);
        } else if (target.classList.contains('wishlist-btn')) {
            // this.handleWishlistClick(productId, target);
        } else if (target.classList.contains('quick-view-btn')) {
            // this.handleQuickViewClick(productId);
        }
    }

    async handleAddToCartClick(productId, button) {
        UIUtils.showLoading(button);
        try {
            await this.apiClient.addToCart(productId, 1);
            UIUtils.showToast('商品已成功加入購物車！', 'success');
            // TODO: Update cart icon in header
        } catch (error) {
            UIUtils.showToast(error.message || '加入購物車失敗。', 'danger');
        } finally {
            UIUtils.hideLoading(button);
        }
    }

    handleSearchSubmit(event) {
        event.preventDefault();
        const queryInput = event.target.querySelector('input[type="search"]');
        if (queryInput.value) {
            window.location.href = `/products?search=${encodeURIComponent(queryInput.value)}`;
        }
    }
}

// 全局初始化
window.indexPage = new IndexPage(); 
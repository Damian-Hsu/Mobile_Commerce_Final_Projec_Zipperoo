import apiClient from '../services/api-client.js';
import { UIUtils } from '../services/utils.js';

export class ProductsPage {
    constructor() {
        this.container = document.getElementById('products-container');
        this.loadingElement = document.getElementById('products-loading');
        this.noProductsElement = document.getElementById('no-products');
        this.resultsInfo = document.getElementById('resultsInfo');
        this.paginationContainer = document.getElementById('pagination-container');
        
        // 視圖模式相關元素
        this.gridViewBtn = document.getElementById('gridView');
        this.listViewBtn = document.getElementById('listView');
        this.currentView = 'grid'; // 預設為網格視圖

        this.filters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            pageSize: 12
        };
    }

    init() {
        if (!this.container) return;
        this.parseUrlForFilters();
        this.updateFilterUI();
        this.setupEventListeners();
        this.setupFiltersCollapse();
        this.loadCategories();
        this.loadProducts();
        
        // 全域收藏功能
        window.addToWishlist = (productId) => {
            UIUtils.showToast('收藏功能開發中', 'info');
        };
    }

    async loadCategories() {
        try {
            const response = await apiClient.getCategories();
            const categoriesContainer = document.getElementById('categories-container');
            
            // 檢查分類 API 的回應結構
            const categories = response.data?.data || response.data || [];
            if (Array.isArray(categories) && categories.length > 0) {
                categoriesContainer.innerHTML = '';
                categories.forEach(category => {
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    div.innerHTML = `
                        <input class="form-check-input" type="radio" name="category" value="${category.id}" id="category${category.id}">
                        <label class="form-check-label" for="category${category.id}">${category.name}</label>
                    `;
                    categoriesContainer.appendChild(div);
                });
            } else {
                categoriesContainer.innerHTML = '<p class="text-muted small">無可用分類</p>';
    }
  } catch (error) {
            console.error('Failed to load categories:', error);
            document.getElementById('categories-container').innerHTML = '<p class="text-danger small">載入分類失敗</p>';
        }
    }

    parseUrlForFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        this.filters.search = urlParams.get('search') || '';
        this.filters.categoryId = urlParams.get('categoryId') || '';
        this.filters.minPrice = urlParams.get('minPrice') || '';
        this.filters.maxPrice = urlParams.get('maxPrice') || '';
        this.filters.sortBy = urlParams.get('sortBy') || 'createdAt';
        this.filters.sortOrder = urlParams.get('sortOrder') || 'desc';
        this.filters.page = parseInt(urlParams.get('page') || '1', 10);
    }

    updateFilterUI() {
        // Update category radio buttons
        setTimeout(() => {
            document.querySelectorAll('input[name="category"]').forEach(radio => {
                if (radio.value === this.filters.categoryId) {
                    radio.checked = true;
                }
            });
        }, 100); // Wait for categories to load

        // Update price inputs
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        if (minPriceInput) minPriceInput.value = this.filters.minPrice;
        if (maxPriceInput) maxPriceInput.value = this.filters.maxPrice;

        // Update sort dropdown
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            if (this.filters.sortBy === 'price' && this.filters.sortOrder === 'desc') {
                sortSelect.value = 'price-desc';
            } else if (this.filters.sortBy === 'price' && this.filters.sortOrder === 'asc') {
                sortSelect.value = 'price';
    } else {
                sortSelect.value = this.filters.sortBy;
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFiltersAndReload());
        this.paginationContainer?.addEventListener('click', e => this.handlePaginationClick(e));
        document.body.addEventListener('click', e => this.handleProductCardClick(e));
        
        // 視圖切換事件監聽器
        this.gridViewBtn?.addEventListener('click', () => this.switchView('grid'));
        this.listViewBtn?.addEventListener('click', () => this.switchView('list'));
    }

    async applyFiltersAndReload() {
        const selectedCategory = document.querySelector('input[name="category"]:checked')?.value || '';
        this.filters.categoryId = selectedCategory; // 使用 categoryId 而不是 category
        this.filters.minPrice = document.getElementById('minPrice')?.value || '';
        this.filters.maxPrice = document.getElementById('maxPrice')?.value || '';
        
        // 處理排序
        const sortValue = document.getElementById('sortBy')?.value || 'createdAt';
        if (sortValue === 'price-desc') {
            this.filters.sortBy = 'price';
            this.filters.sortOrder = 'desc';
        } else if (sortValue === 'price') {
            this.filters.sortBy = 'price';
            this.filters.sortOrder = 'asc';
        } else {
            this.filters.sortBy = sortValue;
            this.filters.sortOrder = 'desc';
        }
        
        this.filters.page = 1; // Reset to first page
        this.updateURL();
        await this.loadProducts();
    }

    async handlePaginationClick(e) {
        e.preventDefault();
        const pageLink = e.target.closest('[data-page]');
        if (pageLink && !pageLink.parentElement.classList.contains('disabled')) {
            this.filters.page = parseInt(pageLink.dataset.page, 10);
            this.updateURL();
            await this.loadProducts();
        }
    }

    async loadProducts() {
        this.showLoading();

        try {
            // 清理 filters，移除空值
            const cleanFilters = {};
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    cleanFilters[key] = value;
                }
            });

            const response = await apiClient.getProducts(cleanFilters);
            this.hideLoading();
            
            // API 回應結構：{ statusCode, message, data: { data: [], meta: {} } }
            if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                this.renderProducts(response.data.data);
                this.renderPagination(response.data.meta);
                this.updateResultsInfo(response.data.meta);
            } else {
                this.showNoProducts();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError(error.message || 'Error loading products');
        }
    }

    showLoading() {
        this.loadingElement.style.display = 'block';
        this.container.style.display = 'none';
        this.noProductsElement.classList.add('d-none');
    }

    hideLoading() {
        this.loadingElement.style.display = 'none';
        this.container.style.display = 'flex';
    }

    showNoProducts() {
        this.loadingElement.style.display = 'none';
        this.container.style.display = 'none';
        this.noProductsElement.classList.remove('d-none');
        this.resultsInfo.innerHTML = '<span class="text-muted">找不到商品</span>';
        this.paginationContainer.innerHTML = '';
    }

    showError(message) {
        this.loadingElement.style.display = 'none';
        this.container.style.display = 'none';
        this.resultsInfo.innerHTML = `<span class="text-danger">${message}</span>`;
    }
    
    renderProducts(products) {
        this.lastProducts = products; // 保存數據供視圖切換使用
        this.container.innerHTML = '';
        
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.container.appendChild(card);
        });
        this.container.style.display = 'flex';
    }

    updateResultsInfo(meta) {
        const { page, pageSize, total } = meta;
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        this.resultsInfo.innerHTML = `<span class="text-muted">顯示第 ${start}-${end} 項，共 ${total} 個商品</span>`;
    }
    
    updateURL() {
        const params = new URLSearchParams();
        Object.entries(this.filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }

    renderPagination(meta) {
        // Pagination logic from original file...
        const { page, totalPages } = meta;
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }
        // Simplified pagination for brevity
        let html = '<ul class="pagination justify-content-center">';
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">Previous</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">Next</a></li>`;
        html += '</ul>';
        this.paginationContainer.innerHTML = html;
    }

    createProductCard(product) {
        const col = document.createElement('div');
        col.className = 'col';
        
        // 處理商品圖片
        const imageUrl = UIUtils.getProductImageUrl(product);
        
        // 處理價格 - 使用 API 提供的 minPrice 和 maxPrice
        let priceDisplay = 'N/A';
        let firstVariant = null;
        
        if (product.variants && product.variants.length > 0) {
            firstVariant = product.variants[0];
            
            // 優先使用 API 提供的 minPrice 和 maxPrice
            if (product.minPrice !== undefined && product.maxPrice !== undefined) {
                if (product.minPrice === product.maxPrice) {
                    priceDisplay = `NT$ ${product.minPrice}`;
                } else {
                    priceDisplay = `NT$ ${product.minPrice} - ${product.maxPrice}`;
                }
            } else {
                // 後備方案：從 variants 計算
                const minPrice = Math.min(...product.variants.map(v => v.price));
                const maxPrice = Math.max(...product.variants.map(v => v.price));
                
                if (minPrice === maxPrice) {
                    priceDisplay = `NT$ ${minPrice}`;
                } else {
                    priceDisplay = `NT$ ${minPrice} - ${maxPrice}`;
                }
            }
        }
        
        // 處理評分
        const avgRating = product.avgRating || 0;
        const reviewCount = product._count?.reviews || 0;
        const stars = UIUtils.generateStars(avgRating);
        
        // 處理商品描述 - 限制長度
        const description = product.description 
            ? (product.description.length > 100 
                ? product.description.substring(0, 100) + '...' 
                : product.description)
            : '';

        // 根據當前視圖模式創建不同的佈局
        if (this.currentView === 'list') {
            col.innerHTML = this.createListViewCard(product, imageUrl, priceDisplay, avgRating, reviewCount, stars, description);
  } else {
            col.innerHTML = this.createGridViewCard(product, imageUrl, priceDisplay, avgRating, reviewCount, stars, description);
        }
        
        return col;
    }

    createGridViewCard(product, imageUrl, priceDisplay, avgRating, reviewCount, stars, description) {
        return `
            <div class="card product-card h-100 border-0 shadow-sm cursor-pointer" 
                 onclick="window.location.href='/products/${product.id}'"
                 style="cursor: pointer;">
                <div class="position-relative overflow-hidden">
                    <img src="${imageUrl}" 
                         class="card-img-top product-image" 
                         alt="${product.name}"
                         style="height: 250px; object-fit: cover;"
                         onerror="this.src='/images/placeholder.svg'">
                    <div class="product-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                        <div class="d-flex gap-2">
                            <button class="btn btn-light btn-sm wishlist-btn rounded-circle" 
                                    title="加入收藏"
                                    onclick="event.stopPropagation(); addToWishlist(${product.id})">
                                <i class="bi bi-heart"></i>
                            </button>
                            <span class="badge bg-primary">
                                <i class="bi bi-eye me-1"></i>查看詳情
                            </span>
                        </div>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-2 text-dark">${product.name}</h5>
                    ${description ? `<p class="card-text text-muted small mb-2">${description}</p>` : ''}
                    <div class="mb-2">
                        <span class="fw-bold text-primary fs-5">${priceDisplay}</span>
                    </div>
                    <div class="d-flex align-items-center mt-auto">
                        <div class="stars me-2">${stars}</div>
                        <small class="text-muted">(${reviewCount} 則評價)</small>
                    </div>
                </div>
            </div>
        `;
    }

    createListViewCard(product, imageUrl, priceDisplay, avgRating, reviewCount, stars, description) {
        return `
            <div class="card product-card border-0 shadow-sm cursor-pointer" 
                 onclick="window.location.href='/products/${product.id}'"
                 style="cursor: pointer;">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-auto">
                            <img src="${imageUrl}" 
                                 class="rounded" 
                                 alt="${product.name}"
                                 style="width: 120px; height: 120px; object-fit: cover;"
                                 onerror="this.src='/images/placeholder.svg'">
                        </div>
                        <div class="col">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="mb-0 text-dark">${product.name}</h5>
                                <div class="text-end">
                                    <div class="fw-bold text-primary fs-5">${priceDisplay}</div>
                                    <div class="d-flex align-items-center mt-1">
                                        <div class="stars me-2">${stars}</div>
                                        <small class="text-muted">(${reviewCount})</small>
                                    </div>
                                </div>
                            </div>
                            ${description ? `<p class="text-muted mb-2">${description}</p>` : ''}
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="event.stopPropagation(); addToWishlist(${product.id})"
                                            title="加入收藏">
                                        <i class="bi bi-heart me-1"></i>收藏
                                    </button>
                                    <button class="btn btn-primary btn-sm" 
                                            onclick="event.stopPropagation(); window.location.href='/products/${product.id}'">
                                        <i class="bi bi-eye me-1"></i>查看詳情
                                    </button>
                                </div>
                                ${product.category ? `<span class="badge bg-secondary">${product.category.name}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    handleProductCardClick(e) {
        // 商品卡片點擊事件處理（如果需要的話）
        // 現在主要通過 onclick 直接跳轉到商品詳情頁
    }

    switchView(viewType) {
        this.currentView = viewType;
        
        // 更新按鈕狀態
        this.gridViewBtn?.classList.toggle('active', viewType === 'grid');
        this.listViewBtn?.classList.toggle('active', viewType === 'list');
        
        // 更新容器類別
        if (viewType === 'list') {
            this.container.className = 'row row-cols-1 g-3';
  } else {
            this.container.className = 'row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4';
        }
        
        // 重新渲染商品 (如果有數據的話)
        if (this.lastProducts) {
            this.renderProducts(this.lastProducts);
        }
    }

    setupFiltersCollapse() {
        const filtersCollapse = document.getElementById('filtersCollapse');
        const filtersToggleIcon = document.getElementById('filtersToggleIcon');
        const filtersToggle = document.getElementById('filtersToggle');
        
        if (filtersCollapse && filtersToggleIcon && filtersToggle) {
            // 檢查螢幕大小，在小螢幕上預設摺疊
            const checkScreenSize = () => {
                if (window.innerWidth < 768) {
                    // 小螢幕：預設摺疊
                    filtersCollapse.classList.remove('show');
                    filtersToggleIcon.className = 'bi bi-chevron-down';
                    filtersToggle.setAttribute('aria-expanded', 'false');
                } else {
                    // 大螢幕：預設展開
                    filtersCollapse.classList.add('show');
                    filtersToggleIcon.className = 'bi bi-chevron-up';
                    filtersToggle.setAttribute('aria-expanded', 'true');
                }
            };
            
            // 初始檢查
            checkScreenSize();
            
            // 監聽視窗大小變化
            window.addEventListener('resize', checkScreenSize);
            
            // 監聽摺疊事件
            filtersCollapse.addEventListener('show.bs.collapse', () => {
                filtersToggleIcon.className = 'bi bi-chevron-up';
                filtersToggle.setAttribute('aria-expanded', 'true');
            });
            
            filtersCollapse.addEventListener('hide.bs.collapse', () => {
                filtersToggleIcon.className = 'bi bi-chevron-down';
                filtersToggle.setAttribute('aria-expanded', 'false');
            });
        }
    }
} 
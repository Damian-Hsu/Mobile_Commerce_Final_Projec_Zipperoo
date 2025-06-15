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
            const sortKey = `${this.filters.sortBy}${this.filters.sortOrder === 'asc' ? '-asc' : ''}`;
            if (this.filters.sortBy === 'price' && this.filters.sortOrder === 'desc') {
                sortSelect.value = 'price-desc';
            } else if (this.filters.sortBy === 'price' && this.filters.sortOrder === 'asc') {
                sortSelect.value = 'price';
            } else if (this.filters.sortBy === 'rating' && this.filters.sortOrder === 'desc') {
                sortSelect.value = 'rating-desc';
            } else if (this.filters.sortBy === 'sales' && this.filters.sortOrder === 'desc') {
                sortSelect.value = 'sales-desc';
            } else if (this.filters.sortBy === 'name' && this.filters.sortOrder === 'desc') {
                sortSelect.value = 'name-desc';
            } else if (this.filters.sortBy === 'createdAt' && this.filters.sortOrder === 'asc') {
                sortSelect.value = 'createdAt-asc';
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
        if (sortValue.includes('-desc')) {
            this.filters.sortBy = sortValue.replace('-desc', '');
            this.filters.sortOrder = 'desc';
        } else if (sortValue.includes('-asc')) {
            this.filters.sortBy = sortValue.replace('-asc', '');
            this.filters.sortOrder = 'asc';
        } else if (sortValue === 'price') {
            this.filters.sortBy = 'price';
            this.filters.sortOrder = 'asc';
        } else if (sortValue === 'name') {
            this.filters.sortBy = 'name';
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
            
            // 等待DOM更新後再滑動
            setTimeout(() => {
                // 滑動到結果資訊區域，並留一些頂部空間
                const resultsInfo = document.getElementById('resultsInfo');
                if (resultsInfo) {
                    const offsetTop = resultsInfo.offsetTop - 100; // 減去100px，留出頂部空間
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }, 100);
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
        const { page, totalPages } = meta;
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }
        
        let html = '<ul class="pagination justify-content-center">';
        
        // 上一頁按鈕
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${page - 1}">上一頁</a>
                 </li>`;
        
        // 計算顯示的頁碼範圍
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);
        
        // 如果不是從第1頁開始，顯示第1頁和省略號
        if (startPage > 1) {
            html += `<li class="page-item">
                        <a class="page-link" href="#" data-page="1">1</a>
                     </li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled">
                            <span class="page-link">...</span>
                         </li>`;
            }
        }
        
        // 顯示頁碼
        for (let i = startPage; i <= endPage; i++) {
            html += `<li class="page-item ${i === page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                     </li>`;
        }
        
        // 如果不是到最後一頁，顯示省略號和最後一頁
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<li class="page-item disabled">
                            <span class="page-link">...</span>
                         </li>`;
            }
            html += `<li class="page-item">
                        <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                     </li>`;
        }
        
        // 下一頁按鈕
        html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${page + 1}">下一頁</a>
                 </li>`;
        
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
        
        // 處理商品描述 - 處理換行符並限制行數
        let description = '';
        if (product.description) {
            // 將換行符轉換為 <br> 標籤
            let formattedDesc = product.description
                .replace(/\\n/g, '<br>')    // 處理轉義的 \n
                .replace(/\n/g, '<br>')     // 處理真正的換行符
                .replace(/\r\n/g, '<br>')   // 處理Windows格式換行
                .replace(/\r/g, '<br>');    // 處理Mac格式換行
            
            // 按 <br> 分割並限制最多5行
            const lines = formattedDesc.split('<br>');
            if (lines.length > 5) {
                formattedDesc = lines.slice(0, 5).join('<br>') + '...';
            }
            
            // 如果單行太長也要截斷
            const maxLength = 200;
            if (formattedDesc.replace(/<br>/g, '').length > maxLength) {
                const textContent = formattedDesc.replace(/<br>/g, ' ');
                formattedDesc = textContent.substring(0, maxLength) + '...';
                // 重新添加換行符處理
                formattedDesc = formattedDesc.replace(/\n/g, '<br>');
            }
            
            description = formattedDesc;
        }

        // 根據當前視圖模式創建不同的佈局
        if (this.currentView === 'list') {
            col.innerHTML = this.createListViewCard(product, imageUrl, priceDisplay, avgRating, reviewCount, stars, description);
          } else {
            col.innerHTML = this.createGridViewCard(product, imageUrl, priceDisplay, avgRating, reviewCount, stars, description);
        }
        
        // 設置商品描述內容（支援HTML）
        if (description) {
            const descElements = col.querySelectorAll('.product-description-content');
            descElements.forEach(element => {
                element.innerHTML = description;
            });
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
                    ${description ? `<p class="card-text text-muted small mb-2 product-description-content"></p>` : ''}
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
                    <!-- 桌面版佈局 -->
                    <div class="row align-items-center d-none d-md-flex">
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
                            ${description ? `<p class="text-muted mb-2 product-description-content"></p>` : ''}
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
                    
                    <!-- 手機版簡化佈局 -->
                    <div class="d-flex d-md-none mobile-list-view">
                        <!-- 左側商品圖片 -->
                        <div class="mobile-product-image">
                            <img src="${imageUrl}" 
                                 class="rounded" 
                                 alt="${product.name}"
                                 onerror="this.src='/images/placeholder.svg'">
                        </div>
                        
                        <!-- 右側商品信息 -->
                        <div class="mobile-product-info flex-grow-1 position-relative">
                            <!-- 商品名稱和類別 -->
                            <div class="mb-2">
                                <h6 class="mb-1 text-dark mobile-product-name">${product.name}</h6>
                                ${product.category ? `<span class="badge bg-light text-dark mobile-category">${product.category.name}</span>` : ''}
                            </div>
                            
                            <!-- 價格 -->
                            <div class="mb-2">
                                <div class="fw-bold text-primary mobile-price">${priceDisplay}</div>
                            </div>
                            
                            <!-- 評分 -->
                            <div class="d-flex align-items-center mobile-rating mb-2">
                                <div class="stars me-2">${stars}</div>
                                <small class="text-muted">(${reviewCount})</small>
                            </div>
                            
                            <!-- 右下角收藏按鈕 -->
                            <button class="btn btn-link p-0 mobile-wishlist-btn position-absolute" 
                                    onclick="event.stopPropagation(); addToWishlist(${product.id})"
                                    title="加入收藏">
                                <i class="bi bi-heart"></i>
                            </button>
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
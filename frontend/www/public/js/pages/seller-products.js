class SellerProducts {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.searchQuery = '';
        this.statusFilter = '';
        this.products = [];
        this.allProducts = []; // 保存所有商品的原始數據
        this.totalProducts = 0;
        this.config = new window.Config();
    }

    async waitForApiClient() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (window.apiClient && typeof window.apiClient.getSellerProducts === 'function') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('API 客戶端載入超時');
    }

    async init() {
        try {
            await this.waitForApiClient();
            
            // 檢查用戶認證
            if (!window.apiClient.isAuthenticated()) {
                window.location.href = '/login';
                return;
            }

            this.setupEventListeners();
            await this.loadProducts();
        } catch (error) {
            console.error('初始化商品頁面失敗:', error);
            this.showError();
        }
    }

    setupEventListeners() {
        // 搜索功能 - 只獲取商品頁面的搜尋框，避免與導航欄衝突
        const searchInput = document.querySelector('.seller-products-main #search-input');
        const searchBtn = document.querySelector('.seller-products-main #search-btn');
        
        console.log('🔍 設置事件監聽器 - searchInput:', !!searchInput, 'searchBtn:', !!searchBtn);
        
        if (searchInput && searchBtn) {
            // 防止搜尋框被意外清空
            searchInput.addEventListener('input', (e) => {
                console.log('🔍 輸入框內容變化:', `"${e.target.value}"`);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('🔍 Enter鍵觸發搜尋，當前值:', `"${e.target.value}"`);
                    e.preventDefault(); // 防止表單提交
                    this.handleSearch();
                }
            });
            
            searchBtn.addEventListener('click', (e) => {
                console.log('🔍 搜尋按鈕點擊');
                e.preventDefault(); // 防止表單提交
                const currentValue = searchInput.value;
                console.log('🔍 點擊時輸入框值:', `"${currentValue}"`);
                this.handleSearch();
            });
            
            console.log('🔍 搜尋事件監聽器已綁定');
        } else {
            console.error('🔍 搜尋元素未找到');
        }

        // 狀態篩選
        const statusFilter = document.querySelector('.seller-products-main #status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
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
        const statusFilterSelect = document.querySelector('.seller-products-main #status-filter');
        if (statusFilterSelect) {
            statusFilterSelect.value = status;
        }
        
        // 重新載入商品
        this.loadProducts();
    }

    handleSearch() {
        console.log('🔍 handleSearch 被調用');
        
        // 只獲取商品頁面的搜尋輸入框，避免與導航欄搜尋框衝突
        const searchInput = document.querySelector('.seller-products-main #search-input');
        
        console.log('🔍 商品頁面搜尋框:', !!searchInput);
        
        if (searchInput) {
            const inputValue = searchInput.value;
            console.log('🔍 輸入框原始值:', `"${inputValue}"`);
            
            this.searchQuery = inputValue.trim();
            this.currentPage = 1;
            
            console.log('🔍 處理後的搜尋關鍵字:', `"${this.searchQuery}"`);
            console.log('🔍 搜尋關鍵字長度:', this.searchQuery.length);
            
            this.loadProducts();
        } else {
            console.error('🔍 找不到商品頁面的搜尋輸入框');
        }
    }

    async loadProducts() {
        try {
            this.showLoading();

            // 構建API請求參數
            const params = {
                page: this.currentPage,
                pageSize: this.pageSize
            };

            // 添加搜尋參數
            if (this.searchQuery && this.searchQuery.trim()) {
                params.search = this.searchQuery.trim();
                console.log('🔍 添加搜尋參數:', params.search);
            }

            console.log('🔍 API請求參數:', params);
            const response = await window.apiClient.getSellerProducts(params);

            if (response.statusCode === 200 && response.data) {
                // 獲取API返回的商品數據
                this.allProducts = response.data.data || [];
                
                // 後端過濾（搜尋）+ 前端過濾（狀態）
                let filteredProducts = this.allProducts;
                
                // 狀態過濾（前端處理，因為後端不支持複雜的狀態過濾）
                if (this.statusFilter) {
                    filteredProducts = filteredProducts.filter(product => {
                        if (this.statusFilter === 'OUT_OF_STOCK') {
                            // 缺貨篩選：庫存為0的商品
                            const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
                            return totalStock === 0;
                        } else {
                            // 其他狀態篩選
                            return product.status === this.statusFilter;
                        }
                    });
                }
                
                this.products = filteredProducts;
                
                // 如果有狀態過濾，使用過濾後的數量；否則使用API返回的總數
                if (this.statusFilter) {
                    this.totalProducts = filteredProducts.length;
                } else {
                    this.totalProducts = response.data.meta?.total || filteredProducts.length;
                }
                
                // 載入所有商品用於統計（不受搜尋和狀態過濾影響）
                await this.loadAllProductsForStats();
                
                this.renderProducts();
                this.updatePagination({
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    total: this.totalProducts,
                    totalPages: Math.ceil(this.totalProducts / this.pageSize)
                });
            } else {
                throw new Error(response.message || '載入商品失敗');
            }
        } catch (error) {
            console.error('載入商品失敗:', error);
            this.showError();
        }
    }

    // 載入所有商品用於統計
    async loadAllProductsForStats() {
        try {
            // 如果沒有搜尋和狀態過濾，直接使用當前數據
            if (!this.searchQuery && !this.statusFilter) {
                console.log('🔍 無搜尋和過濾，使用當前數據計算統計');
                this.updateStats();
                return;
            }

            console.log('🔍 載入所有商品用於統計計算');
            // 載入所有商品用於統計（不包含搜尋參數）
            const response = await window.apiClient.getSellerProducts({
                page: 1,
                pageSize: 1000 // 載入大量商品用於統計
            });

            if (response.statusCode === 200 && response.data) {
                const allProductsForStats = response.data.data || [];
                console.log('🔍 統計用商品數量:', allProductsForStats.length);
                this.updateStatsWithData(allProductsForStats);
            }
        } catch (error) {
            console.error('載入統計數據失敗:', error);
            // 如果載入失敗，使用當前數據
            this.updateStats();
        }
    }

    updateStats() {
        this.updateStatsWithData(this.allProducts);
    }

    updateStatsWithData(products) {
        // 使用指定數據計算各狀態商品數量，不受篩選影響
        const stats = {
            total: products.length,
            onShelf: 0,
            offShelf: 0,
            outOfStock: 0
        };

        products.forEach(product => {
            // 計算庫存總量
            const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
            const isOutOfStock = totalStock === 0;

            // 根據商品狀態統計（不論是否缺貨）
            switch (product.status) {
                case 'ON_SHELF':
                    stats.onShelf++;
                    break;
                case 'OFF_SHELF':
                    stats.offShelf++;
                    break;
            }

            // 單獨統計缺貨商品（可以與上架/下架狀態並存）
            if (isOutOfStock) {
                stats.outOfStock++;
            }
        });

        console.log('🔍 賣家商品統計:', stats);

        // 更新統計顯示
        document.getElementById('seller-total-products').textContent = stats.total.toLocaleString();
        document.getElementById('on-shelf-products').textContent = stats.onShelf.toLocaleString();
        document.getElementById('off-shelf-products').textContent = stats.offShelf.toLocaleString();
        document.getElementById('out-of-stock-products').textContent = stats.outOfStock.toLocaleString();
    }

    renderProducts() {
        const loading = document.getElementById('products-loading');
        const table = document.getElementById('products-table');
        const tbody = document.getElementById('products-tbody');
        const empty = document.getElementById('products-empty');
        const error = document.getElementById('products-error');

        // 隱藏載入和錯誤狀態
        loading.style.display = 'none';
        error.style.display = 'none';

        if (!this.products || this.products.length === 0) {
            table.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        // 清空表格內容
        tbody.innerHTML = '';

        // 填充商品數據
        this.products.forEach(product => {
            const row = document.createElement('tr');
            
            // 獲取商品圖片
            const imageUrl = this.getProductImage(product);
            
            // 計算庫存總量
            const totalStock = product.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0;
            
            // 價格範圍顯示
            const priceDisplay = this.getPriceDisplay(product);
            
            row.innerHTML = `
                <td>
                    <div class="product-info">
                        <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                             onerror="this.src='/images/placeholder.svg'">
                        <div class="product-details">
                            <h6>${product.name}</h6>
                            <p class="d-none d-md-block">${product.category?.name || '未分類'}</p>
                            <p class="d-md-none mobile-info">
                                <span class="category">${product.category?.name || '未分類'}</span> • 
                                <span class="stock">庫存: ${totalStock}</span>
                            </p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="price-range">${priceDisplay}</div>
                </td>
                <td>
                    <div class="stock-info">
                        <div class="stock-number">${totalStock}</div>
                        <div class="stock-status ${this.getStockStatusClass(totalStock)}">${this.getStockStatusText(totalStock)}</div>
                    </div>
                </td>
                <td>
                    <span class="product-status ${this.getStatusClass(product.status)}">${this.getStatusText(product.status)}</span>
                </td>
                <td>
                    <div class="rating-info">
                        <div class="rating-stars">${this.getRatingStars(product.avgRating || 0)}</div>
                        <div class="rating-count">${product._count?.reviews || 0} 評價</div>
                    </div>
                </td>
                <td>
                    <div class="sales-info">${product.soldQuantity || 0}</div>
                </td>
                <td>
                    <div class="order-date">${this.formatDate(product.createdAt)}</div>
                </td>
                <td>
                    ${this.getActionButtons(product)}
                </td>
            `;

            tbody.appendChild(row);
        });

        table.style.display = 'table';
        empty.style.display = 'none';
    }

    getProductImage(product) {
        return window.UIUtils.getProductImageUrl(product);
    }

    getPriceDisplay(product) {
        const minPrice = product.minPrice || 0;
        const maxPrice = product.maxPrice || 0;
        
        if (minPrice === maxPrice) {
            return `NT$ ${minPrice}`;
        } else {
            return `NT$ ${minPrice} - ${maxPrice}`;
        }
    }

    getStockStatusClass(stock) {
        if (stock === 0) return 'out';
        if (stock < 10) return 'low';
        return 'normal';
    }

    getStockStatusText(stock) {
        if (stock === 0) return '缺貨';
        if (stock < 10) return '庫存不足';
        return '庫存充足';  
    }

    getStatusClass(status) {
        switch (status) {
            case 'ON_SHELF': return 'on-shelf';
            case 'OFF_SHELF': return 'off-shelf';
            case 'OUT_OF_STOCK': return 'out-of-stock';
            default: return 'off-shelf';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'ON_SHELF': return '上架中';
            case 'OFF_SHELF': return '已下架';
            case 'DELETED': return '已刪除';
            default: return '未知';
        }
    }

    getRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        
        if (hasHalfStar) {
            stars += '⭐';
        }
        
        return stars || '☆☆☆☆☆';
    }

    getActionButtons(product) {
        return `
            <div class="action-buttons">
                <button class="btn-icon btn-primary" onclick="sellerProducts.editProduct(${product.id})" title="編輯">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-icon btn-outline-secondary" onclick="sellerProducts.viewProduct(${product.id})" title="查看">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="sellerProducts.deleteProduct(${product.id})" title="刪除">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
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
            this.loadProducts();
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadProducts();
    }

    async viewProduct(productId) {
        window.location.href = `/products/${productId}`;
    }

    async editProduct(productId) {
        try {
            // 暫時使用現有商品列表中的資料
            const product = this.products.find(p => p.id === productId);
            
            if (product) {
                this.showEditModal(product);
            } else {
                // 如果在當前列表中找不到，嘗試使用公共 API
                const response = await window.apiClient.getProduct(productId);
                
                if (response.statusCode === 200 && response.data) {
                    this.showEditModal(response.data);
                } else {
                    throw new Error(response.message || '獲取商品資料失敗');
                }
            }
        } catch (error) {
            console.error('獲取商品資料失敗:', error);
            alert('獲取商品資料失敗：' + error.message);
        }
    }

    showEditModal(product) {
        console.log('編輯商品資料:', product); // 調試用
        const modalContent = document.getElementById('productEditModalContent');
        
        // 安全地獲取分類ID
        const categoryId = product.categoryId || product.category?.id || '';
        
        // 構建編輯表單
        modalContent.innerHTML = `
            <form class="product-edit-form" id="productEditForm">
                <div class="product-edit-section">
                    <h6>基本資訊</h6>
                    <div class="row">
                        <div class="col-md-8">
                            <div class="mb-3">
                                <label for="productName" class="form-label">商品名稱</label>
                                <input type="text" class="form-control" id="productName" value="${product.name || ''}" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="productCategory" class="form-label">商品分類</label>
                                <select class="form-select" id="productCategory" required>
                                    <option value="">選擇分類</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="productDescription" class="form-label">商品描述</label>
                        <textarea class="form-control" id="productDescription" rows="4" placeholder="請輸入商品描述...">${product.description || ''}</textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="productStatus" class="form-label">商品狀態</label>
                                <select class="form-select" id="productStatus" required>
                                    <option value="ON_SHELF" ${product.status === 'ON_SHELF' ? 'selected' : ''}>上架中</option>
                                    <option value="OFF_SHELF" ${product.status === 'OFF_SHELF' ? 'selected' : ''}>已下架</option>
                                    
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="product-edit-section">
                    <h6>商品規格</h6>
                    <div id="variantsContainer">
                        ${this.renderVariants(product.variants || [])}
                    </div>
                    <button type="button" class="btn btn-add-variant" onclick="sellerProducts.addVariant()">
                        <i class="bi bi-plus"></i> 新增規格
                    </button>
                </div>

                <div class="product-edit-section">
                    <h6>商品圖片</h6>
                    
                    <!-- 圖片上傳方式選擇 -->
                    <div class="mb-3">
                        <div class="btn-group" role="group" aria-label="圖片上傳方式">
                            <input type="radio" class="btn-check" name="imageUploadMethod" id="uploadFile" value="file" checked>
                            <label class="btn btn-outline-primary" for="uploadFile">檔案上傳</label>
                            
                            <input type="radio" class="btn-check" name="imageUploadMethod" id="uploadUrl" value="url">
                            <label class="btn btn-outline-primary" for="uploadUrl">網址輸入</label>
                        </div>
                    </div>
                    
                    <!-- 檔案上傳區域 -->
                    <div id="fileUploadArea" class="mb-3">
                        <label for="productImages" class="form-label">選擇圖片檔案</label>
                        <input type="file" class="form-control" id="productImages" multiple accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onchange="sellerProducts.handleFileUpload(event)">
                        <div class="form-text">支援 JPG、PNG、GIF、WebP 格式，最多上傳 8 張圖片，每張最大 10MB</div>
                    </div>
                    
                    <!-- 網址輸入區域 -->
                    <div id="urlUploadArea" class="mb-3" style="display: none;">
                        <label for="imageUrlInput" class="form-label">圖片網址</label>
                        <div class="input-group">
                            <input type="url" class="form-control" id="imageUrlInput" placeholder="https://example.com/image.jpg">
                            <button type="button" class="btn btn-outline-secondary" onclick="sellerProducts.addImageUrl()">
                                <i class="bi bi-plus"></i> 新增
                            </button>
                        </div>
                        <div class="form-text">請輸入有效的圖片網址（支援 JPG、PNG、GIF、WebP 格式）</div>
                    </div>
                    
                    <!-- 圖片預覽區域 -->
                    <div class="image-preview-container">
                        <div class="image-preview" id="imagePreview">
                            ${this.renderImagePreviews(product.images || [])}
                        </div>
                        <div class="image-upload-status" id="imageUploadStatus" style="display: none;">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">上傳中...</span>
                            </div>
                            <span class="ms-2">圖片上傳中...</span>
                        </div>
                    </div>
                </div>

                <input type="hidden" id="productId" value="${product.id}">
            </form>
        `;

        // 載入分類選項
        this.loadCategories(categoryId);

        // 設置儲存按鈕事件
        const saveBtn = document.getElementById('saveProductBtn');
        saveBtn.onclick = () => this.saveProduct();

        // 設置圖片上傳方式切換事件
        this.setupImageUploadToggle();

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('productEditModal'));
        modal.show();
    }

    renderVariants(variants) {
        if (!variants || variants.length === 0) {
            return `
                <div class="variant-item" data-index="0">
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label">規格名稱</label>
                            <input type="text" class="form-control variant-name" placeholder="例：預設" value="預設">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">價格</label>
                            <input type="number" class="form-control variant-price" placeholder="0" min="0" step="0.01">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">庫存</label>
                            <input type="number" class="form-control variant-stock" placeholder="0" min="0">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button type="button" class="btn btn-remove-variant" onclick="sellerProducts.removeVariant(0)" style="display: none;">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        return variants.map((variant, index) => `
            <div class="variant-item" data-index="${index}">
                <div class="row">
                    <div class="col-md-4">
                        <label class="form-label">規格名稱</label>
                        <input type="text" class="form-control variant-name" placeholder="例：預設" value="${variant.name || ''}">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">價格</label>
                        <input type="number" class="form-control variant-price" placeholder="0" min="0" step="0.01" value="${variant.price || ''}">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">庫存</label>
                        <input type="number" class="form-control variant-stock" placeholder="0" min="0" value="${variant.stock || ''}">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button type="button" class="btn btn-remove-variant" onclick="sellerProducts.removeVariant(${index})" ${variants.length <= 1 ? 'style="display: none;"' : ''}>
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderImagePreviews(images) {
        if (!images || images.length === 0) return '';
        
        return images.map((image, index) => `
            <div class="image-preview-item" data-index="${index}" data-url="${image.url}" data-id="${image.id || ''}">
                <img src="${window.UIUtils.getImageUrl(image.url)}" alt="商品圖片" onerror="this.src='/images/placeholder.svg'">
                <button type="button" class="image-remove-btn" onclick="sellerProducts.removeImage(${index})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `).join('');
    }

    async loadCategories(selectedCategoryId = null) {
        try {
            const response = await window.apiClient.getCategories();
            const categorySelect = document.getElementById('productCategory');
            
            if (response.statusCode === 200 && response.data) {
                categorySelect.innerHTML = '<option value="">選擇分類</option>';
                response.data.forEach(category => {
                    const selected = selectedCategoryId && category.id === selectedCategoryId ? 'selected' : '';
                    categorySelect.innerHTML += `<option value="${category.id}" ${selected}>${category.name}</option>`;
                });
            }
        } catch (error) {
            console.error('載入分類失敗:', error);
        }
    }

    addVariant() {
        const container = document.getElementById('variantsContainer');
        const variants = container.querySelectorAll('.variant-item');
        const newIndex = variants.length;
        
        const newVariant = document.createElement('div');
        newVariant.className = 'variant-item';
        newVariant.setAttribute('data-index', newIndex);
        newVariant.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <label class="form-label">規格名稱</label>
                    <input type="text" class="form-control variant-name" placeholder="例：大、中、小">
                </div>
                <div class="col-md-3">
                    <label class="form-label">價格</label>
                    <input type="number" class="form-control variant-price" placeholder="0" min="0" step="0.01">
                </div>
                <div class="col-md-3">
                    <label class="form-label">庫存</label>
                    <input type="number" class="form-control variant-stock" placeholder="0" min="0">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-remove-variant" onclick="sellerProducts.removeVariant(${newIndex})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(newVariant);
        this.updateRemoveButtons();
    }

    removeVariant(index) {
        const container = document.getElementById('variantsContainer');
        const variant = container.querySelector(`[data-index="${index}"]`);
        if (variant) {
            variant.remove();
            this.updateRemoveButtons();
        }
    }

    updateRemoveButtons() {
        const container = document.getElementById('variantsContainer');
        const variants = container.querySelectorAll('.variant-item');
        
        variants.forEach((variant, index) => {
            const removeBtn = variant.querySelector('.btn-remove-variant');
            if (variants.length <= 1) {
                removeBtn.style.display = 'none';
            } else {
                removeBtn.style.display = 'block';
            }
            variant.setAttribute('data-index', index);
            removeBtn.setAttribute('onclick', `sellerProducts.removeVariant(${index})`);
        });
    }

    setupImageUploadToggle() {
        const fileRadio = document.getElementById('uploadFile');
        const urlRadio = document.getElementById('uploadUrl');
        const fileArea = document.getElementById('fileUploadArea');
        const urlArea = document.getElementById('urlUploadArea');

        fileRadio.addEventListener('change', () => {
            if (fileRadio.checked) {
                fileArea.style.display = 'block';
                urlArea.style.display = 'none';
            }
        });

        urlRadio.addEventListener('change', () => {
            if (urlRadio.checked) {
                fileArea.style.display = 'none';
                urlArea.style.display = 'block';
            }
        });
    }

    async handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const productId = document.getElementById('productId').value;
        if (!productId) {
            alert('無法獲取商品ID');
            return;
        }

        // 檢查檔案數量限制
        const currentImages = document.querySelectorAll('.image-preview-item').length;
        if (currentImages + files.length > 8) {
            alert('最多只能上傳8張圖片');
            return;
        }

        // 檢查檔案大小和格式
        for (let file of files) {
            if (file.size > 10 * 1024 * 1024) { // 10MB
                alert(`檔案 ${file.name} 超過10MB大小限制`);
                return;
            }
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
                alert(`檔案 ${file.name} 格式不支援，請使用 JPG、PNG、GIF 或 WebP 格式`);
                return;
            }
        }

        try {
            // 顯示上傳狀態
            this.showUploadStatus(true);

            // 上傳圖片到服務器
            const response = await window.apiClient.uploadProductImages(productId, files);
            
            console.log('圖片上傳回應:', response); // 調試用
            
            // 檢查是否成功上傳
            if (response && (response.statusCode === 201 || response.statusCode === 200) && response.data) {
                // 添加新上傳的圖片到預覽
                this.addImagesToPreview(response.data);
                
                // 清空檔案輸入
                event.target.value = '';
                
                alert('圖片上傳成功！');
            } else if (response && response.data) {
                // 如果有數據但狀態碼不是預期的，仍然嘗試添加圖片
                this.addImagesToPreview(response.data);
                event.target.value = '';
                alert('圖片上傳成功！');
            } else {
                throw new Error('上傳失敗：無效的回應格式');
            }
        } catch (error) {
            console.error('圖片上傳失敗:', error);
            // 檢查錯誤訊息是否實際上是成功訊息
            if (error.message && error.message.toLowerCase().includes('successfully')) {
                alert('圖片上傳成功！');
                event.target.value = '';
            } else {
                alert('圖片上傳失敗：' + error.message);
            }
        } finally {
            this.showUploadStatus(false);
        }
    }

    addImageUrl() {
        const urlInput = document.getElementById('imageUrlInput');
        const url = urlInput.value.trim();
        
        if (!url) {
            alert('請輸入圖片網址');
            return;
        }

        // 簡單的URL格式驗證
        if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
            alert('請輸入有效的圖片網址（支援 JPG、PNG、GIF、WebP 格式）');
            return;
        }

        // 檢查圖片數量限制
        const currentImages = document.querySelectorAll('.image-preview-item').length;
        if (currentImages >= 8) {
            alert('最多只能添加8張圖片');
            return;
        }

        // 添加到預覽
        this.addImagesToPreview([{ url: url, id: Date.now() }]);
        
        // 清空輸入框
        urlInput.value = '';
    }

    addImagesToPreview(images) {
        const preview = document.getElementById('imagePreview');
        
        images.forEach(image => {
            const currentImages = preview.querySelectorAll('.image-preview-item');
            const newIndex = currentImages.length;
            
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.setAttribute('data-index', newIndex);
            previewItem.setAttribute('data-url', image.url);
            previewItem.setAttribute('data-id', image.id || '');
            previewItem.innerHTML = `
                <img src="${window.UIUtils.getImageUrl(image.url)}" alt="商品圖片" onerror="this.src='/images/placeholder.svg'">
                <button type="button" class="image-remove-btn" onclick="sellerProducts.removeImage(${newIndex})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            preview.appendChild(previewItem);
        });
    }

    removeImage(index) {
        const preview = document.getElementById('imagePreview');
        const imageItem = preview.querySelector(`[data-index="${index}"]`);
        if (imageItem) {
            imageItem.remove();
            // 重新編號剩餘的圖片
            this.reindexImages();
        }
    }

    reindexImages() {
        const preview = document.getElementById('imagePreview');
        const imageItems = preview.querySelectorAll('.image-preview-item');
        
        imageItems.forEach((item, index) => {
            item.setAttribute('data-index', index);
            const removeBtn = item.querySelector('.image-remove-btn');
            removeBtn.setAttribute('onclick', `sellerProducts.removeImage(${index})`);
        });
    }

    showUploadStatus(show) {
        const statusElement = document.getElementById('imageUploadStatus');
        statusElement.style.display = show ? 'block' : 'none';
    }

    async saveProduct() {
        try {
            const form = document.getElementById('productEditForm');
            const productId = document.getElementById('productId').value;
            
            // 顯示載入狀態
            const saveBtn = document.getElementById('saveProductBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '儲存中...';
            saveBtn.disabled = true;
            
            // 收集表單數據
            const formData = {
                name: document.getElementById('productName').value.trim(),
                description: document.getElementById('productDescription').value.trim(),
                categoryId: parseInt(document.getElementById('productCategory').value),
                status: document.getElementById('productStatus').value,
                variants: this.collectVariants(),
                imageUrls: this.collectImageUrls()
            };

            // 驗證必填欄位
            if (!formData.name) {
                alert('請輸入商品名稱');
                return;
            }
            
            if (!formData.categoryId || isNaN(formData.categoryId)) {
                alert('請選擇商品分類');
                return;
            }
            
            if (!formData.variants || formData.variants.length === 0) {
                alert('請至少添加一個商品規格');
                return;
            }

            console.log('準備更新商品:', formData); // 調試用

            // 發送更新請求
            const response = await window.apiClient.updateProduct(productId, formData);
            
            if (response.statusCode === 200) {
                alert('商品更新成功！');
                
                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('productEditModal'));
                modal.hide();
                
                // 重新載入商品列表
                await this.loadProducts();
            } else {
                throw new Error(response.message || '更新商品失敗');
            }
        } catch (error) {
            console.error('儲存商品失敗:', error);
            alert('儲存商品失敗：' + (error.message || '未知錯誤'));
        } finally {
            // 恢復按鈕狀態
            const saveBtn = document.getElementById('saveProductBtn');
            if (saveBtn) {
                saveBtn.textContent = '儲存變更';
                saveBtn.disabled = false;
            }
        }
    }

    collectVariants() {
        const variants = [];
        const variantItems = document.querySelectorAll('.variant-item');
        
        variantItems.forEach(item => {
            const name = item.querySelector('.variant-name').value.trim();
            const price = parseFloat(item.querySelector('.variant-price').value) || 0;
            const stock = parseInt(item.querySelector('.variant-stock').value) || 0;
            
            if (name && price > 0) {
                variants.push({ 
                    name: name, 
                    price: price, 
                    stock: stock 
                });
            }
        });
        
        console.log('收集到的規格:', variants); // 調試用
        return variants;
    }

    collectImageUrls() {
        const imageItems = document.querySelectorAll('.image-preview-item');
        const imageUrls = [];
        
        imageItems.forEach(item => {
            const url = item.getAttribute('data-url');
            if (url) {
                imageUrls.push(url);
            }
        });
        
        return imageUrls;
    }

    async deleteProduct(productId) {
        if (!confirm('確定要刪除這個商品嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await window.apiClient.deleteProduct(productId);
            
            if (response.statusCode === 200) {
                alert('商品已成功刪除');
                await this.loadProducts();
            } else {
                throw new Error(response.message || '刪除商品失敗');
            }
        } catch (error) {
            console.error('刪除商品失敗:', error);
            alert('刪除商品失敗：' + error.message);
        }
    }

    showLoading() {
        document.getElementById('products-loading').style.display = 'block';
        document.getElementById('products-table').style.display = 'none';
        document.getElementById('products-empty').style.display = 'none';
        document.getElementById('products-error').style.display = 'none';
    }

    showError() {
        document.getElementById('products-loading').style.display = 'none';
        document.getElementById('products-table').style.display = 'none';
        document.getElementById('products-empty').style.display = 'none';
        document.getElementById('products-error').style.display = 'block';
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
}

// 等待所有必要組件準備就緒
async function waitForDependencies() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.apiClient && 
            typeof window.apiClient.getSellerProducts === 'function' &&
            window.UIUtils && 
            typeof window.UIUtils.getProductImageUrl === 'function' &&
            window.Config) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    throw new Error('依賴組件載入超時');
}

// 等待App初始化完成或直接初始化
function initializePage() {
    if (window.UIUtils && window.apiClient && window.Config) {
        // 依賴已經準備就緒，直接初始化
        window.sellerProducts = new SellerProducts();
        window.sellerProducts.init();
    } else {
        // 等待App初始化完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                waitForDependencies().then(() => {
                    window.sellerProducts = new SellerProducts();
                    window.sellerProducts.init();
                }).catch(error => {
                    console.error('初始化商品頁面失敗:', error);
                });
            });
        } else {
            waitForDependencies().then(() => {
                window.sellerProducts = new SellerProducts();
                window.sellerProducts.init();
            }).catch(error => {
                console.error('初始化商品頁面失敗:', error);
            });
        }
    }
}

// 監聽App初始化事件
window.addEventListener('appInitialized', () => {
    initializePage();
});

// 如果App已經初始化完成，直接初始化
if (window.App && window.App.initialized) {
    initializePage();
} 
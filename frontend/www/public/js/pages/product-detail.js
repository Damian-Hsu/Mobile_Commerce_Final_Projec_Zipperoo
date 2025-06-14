import apiClient from '../services/api-client.js';
import authManager from '../services/auth-manager.js';
import { UIUtils } from '../services/utils.js';

export class ProductDetailPage {
    constructor() {
        this.productId = window.productId;
        this.currentProduct = null;
        this.selectedVariant = null;
        this.quantity = 1;
        
        console.log('ProductDetailPage 初始化，商品ID:', this.productId);
        
        // DOM elements
        this.loadingElement = document.getElementById('product-loading');
        this.errorElement = document.getElementById('product-error');
        this.contentElement = document.getElementById('product-content');
        this.mainImage = document.getElementById('main-image');
        this.thumbnailContainer = document.getElementById('thumbnail-images');
        this.variantsContainer = document.getElementById('variants-container');
        this.addToCartBtn = document.getElementById('add-to-cart-btn');
        this.buyNowBtn = document.getElementById('buy-now-btn');
        
        // 檢查必要的DOM元素
        const requiredElements = {
            'product-loading': this.loadingElement,
            'product-error': this.errorElement,
            'product-content': this.contentElement,
            'main-image': this.mainImage,
            'thumbnail-images': this.thumbnailContainer,
            'variants-container': this.variantsContainer,
            'add-to-cart-btn': this.addToCartBtn,
            'buy-now-btn': this.buyNowBtn
        };
        
        for (const [id, element] of Object.entries(requiredElements)) {
            if (!element) {
                console.error(`找不到必要的DOM元素: ${id}`);
            } else {
                console.log(`✓ 找到DOM元素: ${id}`);
            }
        }
    }

    init() {
        console.log('ProductDetailPage init 開始');
        
        if (!this.productId) {
            console.error('商品ID不存在');
            this.showError('商品ID不存在');
            return;
        }
        
        // 檢查必要的DOM元素是否存在
        if (!this.loadingElement || !this.errorElement || !this.contentElement) {
            console.error('缺少必要的DOM元素');
            alert('頁面載入錯誤：缺少必要的元素');
            return;
        }

        this.setupEventListeners();
        this.loadProduct();
        console.log('ProductDetailPage init 完成');
    }

    setupEventListeners() {
        // Add to cart button
        this.addToCartBtn?.addEventListener('click', () => this.addToCart());
        
        // Buy now button
        this.buyNowBtn?.addEventListener('click', () => this.buyNow());
        
        // Add to wishlist button
        document.getElementById('add-to-wishlist-btn')?.addEventListener('click', () => this.addToWishlist());
        
        // Write review button
        document.getElementById('write-review-btn')?.addEventListener('click', () => this.writeReview());
        
        // Contact seller button
        document.getElementById('contact-seller-btn')?.addEventListener('click', () => this.contactSeller());
        
        // Tab change events
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.getAttribute('data-bs-target') === '#reviews') {
                    this.loadReviews();
                }
            });
        });
    }

    async loadProduct() {
        this.showLoading();

        try {
            console.log('=== 商品載入開始 ===');
            console.log('商品ID:', this.productId);
            console.log('API 基礎 URL:', apiClient.baseURL);
            
            const response = await apiClient.getProduct(this.productId);
            console.log('=== API 回應完整資料 ===');
            console.log('回應狀態:', response.statusCode);
            console.log('回應訊息:', response.message);
            console.log('回應資料:', response.data);
            
            if (response.data) {
                this.currentProduct = response.data;
                console.log('=== 商品基本資訊 ===');
                console.log('商品名稱:', this.currentProduct.name);
                console.log('商品描述:', this.currentProduct.description);
                console.log('=== 商品規格檢查 ===');
                console.log('規格陣列存在:', !!this.currentProduct.variants);
                console.log('規格陣列類型:', typeof this.currentProduct.variants);
                console.log('規格數量:', this.currentProduct.variants?.length || 0);
                console.log('規格內容:', this.currentProduct.variants);
                console.log('=== 商品圖片檢查 ===');
                console.log('圖片陣列:', this.currentProduct.images);
                console.log('=== 商品評價檢查 ===');
                console.log('評價計數:', this.currentProduct._count?.reviews);
                console.log('平均評分:', this.currentProduct.avgRating);
                
                this.renderProduct();
                this.loadRelatedProducts();
            } else {
                console.error('❌ API 回應中沒有資料');
                this.showError('找不到商品');
            }
        } catch (error) {
            console.error('=== 載入商品失敗 ===');
            console.error('錯誤類型:', error.constructor.name);
            console.error('錯誤訊息:', error.message);
            console.error('完整錯誤:', error);
            this.showError(error.message || '載入商品失敗');
        }
    }

    renderProduct() {
        const product = this.currentProduct;
        console.log('開始渲染商品:', product);
        
        // Update page title
        document.title = `${product.name} - Zipperoo`;
        
        // Breadcrumb
        document.getElementById('breadcrumb-product-name').textContent = product.name;
        
        // Basic product info
        document.getElementById('product-name').textContent = product.name;
        // document.getElementById('product-description').textContent = product.description || '暫無商品說明';
        document.getElementById('full-description').textContent = product.description || '暫無詳細說明';
        
        // Seller info
        const sellerName = product.seller?.shopName || product.seller?.username || '未知賣家';
        document.getElementById('seller-name').textContent = sellerName;
        
        // Show contact seller button for buyers
        const currentUser = authManager.user;
        const contactSellerBtn = document.getElementById('contact-seller-btn');
        if (contactSellerBtn && currentUser && currentUser.role === 'BUYER' && product.seller) {
            contactSellerBtn.style.display = 'inline-block';
        }
        
        // Rating and reviews
        const avgRating = product.avgRating || 0;
        const reviewCount = product._count?.reviews || 0;
        
        document.getElementById('product-stars').innerHTML = UIUtils.generateStars(avgRating);
        document.getElementById('rating-text').textContent = avgRating.toFixed(1);
        document.getElementById('review-count').textContent = reviewCount;
        
        // Price
        this.updatePriceDisplay();
        
        // Images
        this.renderImages();
        
        // Variants
        this.renderVariants();
        
        // 立即載入評價（不需要等待使用者點擊標籤）
        this.loadReviews();
        
        this.showContent();
    }

    updatePriceDisplay() {
        const product = this.currentProduct;
        const priceElement = document.getElementById('product-price');
        const priceRangeElement = document.getElementById('price-range');
        
        if (this.selectedVariant) {
            // Show selected variant price
            priceElement.textContent = `NT$ ${this.selectedVariant.price}`;
            priceRangeElement.style.display = 'none';
        } else if (product.variants && product.variants.length > 0) {
            // Show price range
            if (product.minPrice !== undefined && product.maxPrice !== undefined) {
                if (product.minPrice === product.maxPrice) {
                    priceElement.textContent = `NT$ ${product.minPrice}`;
                    priceRangeElement.style.display = 'none';
                } else {
                    priceElement.textContent = `NT$ ${product.minPrice}`;
                    priceRangeElement.textContent = `- NT$ ${product.maxPrice}`;
                    priceRangeElement.style.display = 'inline';
                }
            }
        }
    }

    renderImages() {
        const product = this.currentProduct;
        const images = product.images || [];
        
        if (images.length === 0) {
            // No images available
            this.mainImage.src = '/images/placeholder.svg';
            this.mainImage.alt = product.name;
            this.thumbnailContainer.innerHTML = '';
            return;
        }
        
        // Set main image with error handling
        this.mainImage.src = UIUtils.getImageUrl(images[0].url);
        this.mainImage.alt = product.name;
        this.mainImage.onerror = () => {
            this.mainImage.src = '/images/placeholder.svg';
            this.mainImage.onerror = null; // 防止無限循環
        };
        
        // Render thumbnails
        this.thumbnailContainer.innerHTML = '';
        images.forEach((image, index) => {
            const col = document.createElement('div');
            col.className = 'col-2';
            
            col.innerHTML = `
                <img src="${UIUtils.getImageUrl(image.url)}" 
                     alt="${product.name}" 
                     class="img-fluid rounded cursor-pointer thumbnail-image ${index === 0 ? 'active' : ''}"
                     style="border: 2px solid ${index === 0 ? '#bb9571' : 'transparent'};"
                     onerror="this.src='/images/placeholder.svg'; this.onerror=null;"
                     onclick="switchMainImage('${UIUtils.getImageUrl(image.url)}', this)">
            `;
            
            this.thumbnailContainer.appendChild(col);
        });
        
        // Make switchMainImage globally available
        window.switchMainImage = (imageUrl, element) => {
            this.mainImage.src = imageUrl;
            // 為主圖片也添加錯誤處理
            this.mainImage.onerror = () => {
                this.mainImage.src = '/images/placeholder.svg';
                this.mainImage.onerror = null;
            };
            
            // Update active thumbnail
            document.querySelectorAll('.thumbnail-image').forEach(img => {
                img.style.border = '2px solid transparent';
                img.classList.remove('active');
            });
            element.style.border = '2px solid #bb9571';
            element.classList.add('active');
        };
    }

    renderVariants() {
        const product = this.currentProduct;
        const variants = product.variants || [];
        
        console.log('渲染規格，規格列表:', variants);
        
        if (!this.variantsContainer) {
            console.error('找不到規格容器元素');
            return;
        }
        
        if (variants.length === 0) {
            console.log('沒有規格選項');
            this.variantsContainer.innerHTML = '<p class="text-muted">此商品無規格選項</p>';
            
            // 設定缺貨狀態和禁用購買按鈕
            const stockBadge = document.getElementById('stock-badge');
            const stockText = document.getElementById('stock-text');
            if (stockBadge && stockText) {
                stockBadge.className = 'badge bg-danger';
                stockBadge.textContent = '缺貨';
                stockText.textContent = '暫時缺貨';
            }
            
            // 禁用購買按鈕
            if (this.addToCartBtn) this.addToCartBtn.disabled = true;
            if (this.buyNowBtn) this.buyNowBtn.disabled = true;
            return;
        }
        
        // 計算總庫存
        const totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
        console.log('總庫存:', totalStock);
        
        // 設定初始庫存狀態
        const stockBadge = document.getElementById('stock-badge');
        const stockText = document.getElementById('stock-text');
        if (stockBadge && stockText) {
            if (totalStock === 0) {
                // 完全缺貨
                stockBadge.className = 'badge bg-danger';
                stockBadge.textContent = '缺貨';
                stockText.textContent = '暫時缺貨';
                // 禁用購買按鈕
                if (this.addToCartBtn) this.addToCartBtn.disabled = true;
                if (this.buyNowBtn) this.buyNowBtn.disabled = true;
            } else {
                // 有庫存，等待用戶選擇規格
                stockBadge.className = 'badge bg-info';
                stockBadge.textContent = '請選擇規格';
                stockText.textContent = '請選擇商品規格';
                // 禁用購買按鈕，等待選擇規格
                if (this.addToCartBtn) this.addToCartBtn.disabled = true;
                if (this.buyNowBtn) this.buyNowBtn.disabled = true;
            }
        }
        
        this.variantsContainer.innerHTML = '';
        console.log('清空規格容器，開始添加規格按鈕');
        
        variants.forEach((variant, index) => {
            console.log(`渲染規格 ${index}:`, variant);
            const variantButton = document.createElement('button');
            variantButton.className = `btn btn-outline-secondary me-1 mb-2 variant-btn ${variant.stock === 0 ? 'disabled' : ''}`;
            variantButton.disabled = variant.stock === 0;
            variantButton.innerHTML = `
                <div class="d-flex flex-column">
                    <span class="fw-bold">${variant.name || '未命名規格'}</span>
                    <!-- <small>NT$ ${variant.price || 0}</small> -->
                </div>
            `;
            
            if (variant.stock > 0) {
                variantButton.addEventListener('click', () => this.selectVariant(variant, variantButton));
            }
            
            this.variantsContainer.appendChild(variantButton);
        });
        
        console.log(`成功渲染 ${variants.length} 個規格選項，總庫存: ${totalStock}`);
    }

    selectVariant(variant, buttonElement) {
        this.selectedVariant = variant;
        
        // Update variant button styles
        document.querySelectorAll('.variant-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-secondary');
        });
        
        buttonElement.classList.remove('btn-outline-secondary');
        buttonElement.classList.add('btn-primary');
        
        // Update price display
        this.updatePriceDisplay();
        
        // Update stock information
        this.updateStockInfo();
        
        // Enable action buttons
        this.addToCartBtn.disabled = false;
        this.buyNowBtn.disabled = false;
    }

    updateStockInfo() {
        const stockBadge = document.getElementById('stock-badge');
        const stockText = document.getElementById('stock-text');
        
        if (this.selectedVariant) {
            const stock = this.selectedVariant.stock;
            
            if (stock > 10) {
                stockBadge.className = 'badge bg-success';
                stockBadge.textContent = '有庫存';
                stockText.textContent = `剩餘 ${stock} 件`;
            } else if (stock > 0) {
                stockBadge.className = 'badge bg-warning';
                stockBadge.textContent = '庫存不多';
                stockText.textContent = `剩餘 ${stock} 件`;
            } else {
                stockBadge.className = 'badge bg-danger';
                stockBadge.textContent = '缺貨';
                stockText.textContent = '暫時缺貨';
            }
        }
    }

    async addToCart() {
        if (!this.selectedVariant) {
            UIUtils.showToast('請選擇商品規格', 'warning');
            return;
        }

        UIUtils.showLoading(this.addToCartBtn);
        
        try {
            await apiClient.addToCart(this.selectedVariant.id, this.quantity);
            UIUtils.showToast('商品已加入購物車！', 'success');
            
            // 觸發購物車更新事件
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        } catch (error) {
            UIUtils.showToast(error.message || '無法加入購物車', 'danger');
        } finally {
            UIUtils.hideLoading(this.addToCartBtn);
        }
    }

    async buyNow() {
        if (!this.selectedVariant) {
            UIUtils.showToast('請選擇商品規格', 'warning');
            return;
        }

        // Add to cart first, then redirect to checkout
        try {
            await apiClient.addToCart(this.selectedVariant.id, this.quantity);
            window.location.href = '/checkout';
        } catch (error) {
            UIUtils.showToast(error.message || '立即購買失敗', 'danger');
        }
    }

    addToWishlist() {
        UIUtils.showToast('收藏功能開發中', 'info');
    }

    async writeReview() {
        // 檢查用戶是否已登入
        if (!apiClient.isAuthenticated()) {
            this.showLoginRequiredMessage();
            return;
        }

        // 顯示評價模態框
        this.showReviewModal();
    }

    async loadReviews() {
        const reviewsContainer = document.getElementById('reviews-container');
        const reviewsLoading = document.getElementById('reviews-loading');
        const noReviews = document.getElementById('no-reviews');
        
        if (!reviewsContainer) {
            console.error('找不到評價容器元素');
            return;
        }
        
        reviewsLoading.style.display = 'block';
        noReviews.classList.add('d-none');
        
        try {
            console.log('載入商品評價，商品ID:', this.productId);
            const response = await apiClient.getProductReviews(this.productId);
            console.log('評價 API 回應:', response);
            
            // 處理分頁格式的回應 (response.data.data) 或直接陣列格式 (response.data)
            let reviews = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    // 直接陣列格式
                    reviews = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    // 分頁格式
                    reviews = response.data.data;
                } else {
                    console.warn('評價 API 回應格式異常:', response.data);
                    reviews = [];
                }
            }
            
            reviewsLoading.style.display = 'none';
            
            if (reviews.length === 0) {
                console.log('沒有評價');
                reviewsContainer.innerHTML = '';
                noReviews.classList.remove('d-none');
                return;
            }
            
            console.log(`載入了 ${reviews.length} 則評價`);
            reviewsContainer.innerHTML = '';
            reviews.forEach((review, index) => {
                console.log(`渲染評價 ${index}:`, review);
                const reviewElement = this.createReviewElement(review);
                reviewsContainer.appendChild(reviewElement);
            });
            
        } catch (error) {
            console.error('載入評價失敗:', error);
            reviewsLoading.style.display = 'none';
            reviewsContainer.innerHTML = `<p class="text-danger">載入評價失敗: ${error.message}</p>`;
        }
    }

    createReviewElement(review) {
        const div = document.createElement('div');
        div.className = 'card mb-3';
        
        const createdAt = new Date(review.createdAt).toLocaleDateString('zh-TW');
        const currentUser = apiClient.getCurrentUser();
        const isOwnReview = currentUser && currentUser.id === review.buyer?.id;
        
        // 檢查是否已編輯
        const editedBadge = review.isEdited ? '<span class="badge bg-secondary ms-2">已編輯</span>' : '';
        
        div.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong>${review.buyer?.username || '匿名用戶'}</strong>${editedBadge}
                        <div class="stars">${UIUtils.generateStars(review.score)}</div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                    <small class="text-muted">${createdAt}</small>
                        ${isOwnReview ? `
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm" onclick="window.productDetailPage.editReview(${review.id}, ${review.score}, '${(review.comment || '').replace(/'/g, "\\'")}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="window.productDetailPage.deleteReview(${review.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                ${review.comment ? `<p class="mb-0">${review.comment}</p>` : '<p class="mb-0 text-muted">沒有留言</p>'}
            </div>
        `;
        
        return div;
    }

    async loadRelatedProducts() {
        try {
            // 如果沒有分類ID，就不載入相關商品
            if (!this.currentProduct.categoryId) {
                console.log('商品沒有分類，跳過載入相關商品');
                return;
            }

            const response = await apiClient.getProducts({ 
                categoryId: this.currentProduct.categoryId,
                pageSize: 4 
            });
            
            const relatedProducts = response.data?.data || [];
            const filteredProducts = relatedProducts.filter(p => p.id !== this.currentProduct.id);
            
            this.renderRelatedProducts(filteredProducts.slice(0, 4));
        } catch (error) {
            console.error('載入相關商品失敗:', error);
        }
    }

    renderRelatedProducts(products) {
        const container = document.getElementById('related-products');
        container.innerHTML = '';
        
        products.forEach(product => {
            const col = document.createElement('div');
            col.className = 'col-md-3 col-sm-6 mb-3';
            
            const imageUrl = UIUtils.getProductImageUrl(product);
            
            const priceDisplay = product.minPrice !== undefined && product.maxPrice !== undefined
                ? (product.minPrice === product.maxPrice 
                    ? `NT$ ${product.minPrice}` 
                    : `NT$ ${product.minPrice} - ${product.maxPrice}`)
                : 'N/A';
            
            col.innerHTML = `
                <div class="card h-100">
                    <a href="/products/${product.id}">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             alt="${product.name}" 
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='/images/placeholder.svg'; this.onerror=null;">
                    </a>
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="text-primary fw-bold">${priceDisplay}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
    }

    showLoading() {
        this.loadingElement.style.display = 'block';
        this.errorElement.classList.add('d-none');
        this.contentElement.classList.add('d-none');
    }

    showError(message) {
        this.loadingElement.style.display = 'none';
        this.errorElement.classList.remove('d-none');
        this.contentElement.classList.add('d-none');
        document.getElementById('error-message').textContent = message;
    }

    showContent() {
        this.loadingElement.style.display = 'none';
        this.errorElement.classList.add('d-none');
        this.contentElement.classList.remove('d-none');
    }

    // 評價相關方法
    showLoginRequiredMessage() {
        const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
        
        // 隱藏表單，顯示登入提示
        document.getElementById('review-form').classList.add('d-none');
        document.getElementById('login-required-message').classList.remove('d-none');
        document.getElementById('not-purchased-message').classList.add('d-none');
        
        modal.show();
    }

    showReviewModal() {
        const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
        
        // 顯示表單，隱藏其他訊息
        document.getElementById('review-form').classList.remove('d-none');
        document.getElementById('login-required-message').classList.add('d-none');
        document.getElementById('not-purchased-message').classList.add('d-none');
        
        // 設定商品資訊
        this.setupReviewForm();
        
        modal.show();
    }

    setupReviewForm() {
        const product = this.currentProduct;
        
        // 設定商品圖片
        const productImage = document.getElementById('review-product-image');
        const imageUrl = UIUtils.getProductImageUrl(product);
        productImage.src = imageUrl;
        productImage.onerror = () => {
            productImage.src = '/images/placeholder.svg';
            productImage.onerror = null;
        };
        
        // 設定商品名稱
        document.getElementById('review-product-name').textContent = product.name;
        
        // 設定規格資訊（如果有選擇的規格）
        const variantInfo = this.selectedVariant 
            ? `規格：${this.selectedVariant.name}` 
            : '所有規格';
        document.getElementById('review-product-variant').textContent = variantInfo;
        
        // 重置表單
        this.resetReviewForm();
        
        // 綁定事件
        this.bindReviewFormEvents();
    }

    resetReviewForm() {
        // 重置評分
        const ratingInputs = document.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => input.checked = false);
        
        // 重置評分文字
        document.getElementById('rating-text').textContent = '請選擇評分';
        
        // 重置評論內容
        document.getElementById('review-comment').value = '';
        
        // 重置提交按鈕
        const submitBtn = document.getElementById('submit-review-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>提交評價';
    }

    bindReviewFormEvents() {
        // 移除舊的事件監聽器
        const form = document.getElementById('review-form');
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // 評分選擇事件
        const ratingInputs = newForm.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const rating = parseInt(e.target.value);
                this.updateRatingText(rating);
            });
        });
        
        // 表單提交事件
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
    }

    updateRatingText(rating) {
        const ratingTexts = {
            1: '非常不滿意',
            2: '不滿意',
            3: '普通',
            4: '滿意',
            5: '非常滿意'
        };
        
        document.getElementById('rating-text').textContent = ratingTexts[rating] || '請選擇評分';
    }

    async submitReview() {
        const submitBtn = document.getElementById('submit-review-btn');
        const originalContent = submitBtn.innerHTML;
        
        try {
            // 獲取表單資料
            const formData = new FormData(document.getElementById('review-form'));
            const rating = formData.get('rating');
            const comment = formData.get('comment');
            
            // 驗證評分
            if (!rating) {
                UIUtils.showToast('請選擇評分', 'warning');
                return;
            }
            
            // 顯示載入狀態
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>提交中...';
            
            // 準備評價資料
            const reviewData = {
                score: parseInt(rating)
            };
            
            if (comment && comment.trim()) {
                reviewData.comment = comment.trim();
            }
            
            // 提交評價
            const response = await apiClient.createReview(this.productId, reviewData);
            
            if (response.statusCode === 201 || response.success) {
                UIUtils.showToast('評價提交成功！', 'success');
                
                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
                modal.hide();
                
                // 重新載入評價列表
                this.loadReviews();
                
                // 更新評價統計
                this.updateReviewStats();
                
            } else {
                throw new Error(response.message || '提交失敗');
            }
            
        } catch (error) {
            console.error('提交評價失敗:', error);
            
            // 處理特定錯誤
            if (error.message.includes('尚未購買') || error.message.includes('已完成訂單')) {
                this.showNotPurchasedMessage();
            } else if (error.message.includes('已評論')) {
                UIUtils.showToast('您已經評價過此商品了', 'warning');
            } else {
                UIUtils.showToast(error.message || '評價提交失敗，請稍後再試', 'danger');
            }
            
        } finally {
            // 恢復按鈕狀態
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    }

    showNotPurchasedMessage() {
        // 隱藏表單，顯示未購買提示
        document.getElementById('review-form').classList.add('d-none');
        document.getElementById('login-required-message').classList.add('d-none');
        document.getElementById('not-purchased-message').classList.remove('d-none');
    }

    async updateReviewStats() {
        try {
            // 重新載入商品資料以獲取最新的評價統計
            const response = await apiClient.getProduct(this.productId);
            if (response.data) {
                const product = response.data;
                
                // 更新評分顯示
                const avgRating = product.avgRating || 0;
                const reviewCount = product._count?.reviews || 0;
                
                document.getElementById('product-stars').innerHTML = UIUtils.generateStars(avgRating);
                document.getElementById('rating-text').textContent = avgRating.toFixed(1);
                document.getElementById('review-count').textContent = reviewCount;
            }
        } catch (error) {
            console.error('更新評價統計失敗:', error);
        }
    }

    // 編輯評價
    editReview(reviewId, currentScore, currentComment) {
        // 設定模態框標題
        document.getElementById('reviewModalLabel').textContent = '編輯評價';
        
        // 顯示評價模態框
        this.showReviewModal();
        
        // 填入現有資料
        setTimeout(() => {
            // 設定評分
            const ratingInput = document.querySelector(`input[name="rating"][value="${currentScore}"]`);
            if (ratingInput) {
                ratingInput.checked = true;
                this.updateRatingText(currentScore);
            }
            
            // 設定評論內容
            document.getElementById('review-comment').value = currentComment;
            
            // 修改提交按鈕
            const submitBtn = document.getElementById('submit-review-btn');
            submitBtn.innerHTML = '<i class="bi bi-pencil me-2"></i>更新評價';
            
            // 修改表單提交處理
            const form = document.getElementById('review-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                this.updateReview(reviewId);
            };
        }, 100);
    }

    // 更新評價
    async updateReview(reviewId) {
        const submitBtn = document.getElementById('submit-review-btn');
        const originalContent = submitBtn.innerHTML;
        
        try {
            // 獲取表單資料
            const formData = new FormData(document.getElementById('review-form'));
            const rating = formData.get('rating');
            const comment = formData.get('comment');
            
            // 驗證評分
            if (!rating) {
                UIUtils.showToast('請選擇評分', 'warning');
                return;
            }
            
            // 顯示載入狀態
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>更新中...';
            
            // 準備更新資料
            const updateData = {
                score: parseInt(rating)
            };
            
            if (comment && comment.trim()) {
                updateData.comment = comment.trim();
            }
            
            // 更新評價
            const response = await apiClient.updateReview(reviewId, updateData);
            
            if (response.statusCode === 200 || response.success) {
                UIUtils.showToast('評價更新成功！', 'success');
                
                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
                modal.hide();
                
                // 重新載入評價列表
                this.loadReviews();
                
                // 更新評價統計
                this.updateReviewStats();
                
                // 重置模態框標題
                document.getElementById('reviewModalLabel').textContent = '撰寫評價';
                
            } else {
                throw new Error(response.message || '更新失敗');
            }
            
        } catch (error) {
            console.error('更新評價失敗:', error);
            UIUtils.showToast(error.message || '評價更新失敗，請稍後再試', 'danger');
            
        } finally {
            // 恢復按鈕狀態
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    }

    // 刪除評價
    async deleteReview(reviewId) {
        if (!confirm('確定要刪除這則評價嗎？此操作無法復原。')) {
            return;
        }
        
        try {
            const response = await apiClient.deleteReview(reviewId);
            
            if (response.statusCode === 200 || response.success) {
                UIUtils.showToast('評價已刪除', 'success');
                
                // 重新載入評價列表
                this.loadReviews();
                
                // 更新評價統計
                this.updateReviewStats();
                
            } else {
                throw new Error(response.message || '刪除失敗');
            }
            
        } catch (error) {
            console.error('刪除評價失敗:', error);
            UIUtils.showToast(error.message || '評價刪除失敗，請稍後再試', 'danger');
        }
    }

    async contactSeller() {
        const currentUser = authManager.user;
        if (!currentUser) {
            alert('請先登入');
            window.location.href = '/login';
            return;
        }

        if (currentUser.role !== 'BUYER') {
            alert('只有買家可以聊天');
            return;
        }

        if (!this.currentProduct?.seller?.id) {
            alert('找不到賣家資訊');
            return;
        }

        console.log('Contacting seller:', this.currentProduct.seller);
        console.log('Current user:', currentUser);

        try {
            // Create or get chat room with seller
            const response = await apiClient.createOrGetChatRoom(this.currentProduct.seller.id);
            
            console.log('Chat room response:', response);
            
            if (apiClient.isSuccess(response) && response.data) {
                // Redirect to chat page with room selected
                window.location.href = `/chat?room=${response.data.id}`;
            } else {
                console.error('Chat room creation failed:', response);
                alert('建立聊天室失敗：' + (response.message || '未知錯誤'));
            }
        } catch (error) {
            console.error('聯繫賣家失敗:', error);
            alert('聯繫賣家失敗：' + (error.message || '未知錯誤'));
        }
    }
} 
// 新增商品頁面功能
class SellerProductNew {
    constructor() {
        this.imageFiles = [];
        this.variantCount = 1;
        this.categories = [];
        
        this.init();
    }

    async init() {
        console.log('初始化新增商品頁面');
        
        // 載入分類資料
        await this.loadCategories();
        
        // 綁定事件
        this.bindEvents();
        
        console.log('新增商品頁面初始化完成');
    }

    async loadCategories() {
        try {
            const response = await window.apiClient.getCategories();
            this.categories = response.data || [];
            
            const categorySelect = document.getElementById('categoryId');
            categorySelect.innerHTML = '<option value="">請選擇分類</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
            console.log('分類載入完成:', this.categories.length);
        } catch (error) {
            console.error('載入分類失敗:', error);
            this.showAlert('載入分類失敗', 'error');
        }
    }

    bindEvents() {
        // 圖片上傳
        const imageUploadArea = document.getElementById('image-upload-area');
        const imageInput = document.getElementById('image-input');
        
        imageUploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });
        
        // 拖拽上傳
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.style.borderColor = '#bb9571';
        });
        
        imageUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            imageUploadArea.style.borderColor = '#dee2e6';
        });
        
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.style.borderColor = '#dee2e6';
            this.handleImageUpload(e.dataTransfer.files);
        });
        
        // 新增規格
        document.getElementById('add-variant-btn').addEventListener('click', () => {
            this.addVariant();
        });
        
        // 表單提交
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
    }

    handleImageUpload(files) {
        const maxFiles = 5;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (this.imageFiles.length + files.length > maxFiles) {
            this.showAlert(`最多只能上傳 ${maxFiles} 張圖片`, 'warning');
            return;
        }
        
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                this.showAlert('請選擇圖片文件', 'warning');
                return;
            }
            
            if (file.size > maxSize) {
                this.showAlert('圖片大小不能超過 5MB', 'warning');
                return;
            }
            
            this.imageFiles.push(file);
            this.addImagePreview(file);
        });
    }

    addImagePreview(file) {
        const container = document.getElementById('image-preview-container');
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="預覽圖片">
                <button type="button" class="image-remove-btn" onclick="sellerProductNew.removeImage(${this.imageFiles.length - 1})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            container.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    }

    removeImage(index) {
        this.imageFiles.splice(index, 1);
        this.updateImagePreviews();
    }

    updateImagePreviews() {
        const container = document.getElementById('image-preview-container');
        container.innerHTML = '';
        
        this.imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="預覽圖片">
                    <button type="button" class="image-remove-btn" onclick="sellerProductNew.removeImage(${index})">
                        <i class="bi bi-x"></i>
                    </button>
                `;
                container.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    addVariant() {
        const container = document.querySelector('.variants-container');
        const variantItem = document.createElement('div');
        variantItem.className = 'variant-item';
        variantItem.setAttribute('data-index', this.variantCount);
        
        variantItem.innerHTML = `
            <div class="variant-header">
                <h4>規格 ${this.variantCount + 1}</h4>
                <button type="button" class="btn-remove-variant" onclick="sellerProductNew.removeVariant(${this.variantCount})">刪除</button>
            </div>
            <div class="variant-form">
                <div class="form-group">
                    <label>規格名稱</label>
                    <input type="text" name="variants[${this.variantCount}][name]" placeholder="例如：藍色-L" required>
                </div>
                <div class="form-group">
                    <label>價格 *</label>
                    <input type="number" name="variants[${this.variantCount}][price]" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label>庫存 *</label>
                    <input type="number" name="variants[${this.variantCount}][stock]" min="0" required>
                </div>
            </div>
        `;
        
        container.appendChild(variantItem);
        this.variantCount++;
        
        // 顯示第一個規格的刪除按鈕
        if (this.variantCount > 1) {
            const firstVariant = container.querySelector('.variant-item[data-index="0"] .btn-remove-variant');
            if (firstVariant) {
                firstVariant.style.display = 'inline-block';
            }
        }
    }

    removeVariant(index) {
        const variantItem = document.querySelector(`.variant-item[data-index="${index}"]`);
        if (variantItem) {
            variantItem.remove();
        }
        
        // 如果只剩一個規格，隱藏刪除按鈕
        const remainingVariants = document.querySelectorAll('.variant-item');
        if (remainingVariants.length === 1) {
            const deleteBtn = remainingVariants[0].querySelector('.btn-remove-variant');
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
        }
    }

    async uploadImages() {
        if (this.imageFiles.length === 0) {
            return [];
        }

        const imageUrls = [];
        
        // 這裡應該實現真正的圖片上傳邏輯
        // 目前使用模擬的URL
        for (let i = 0; i < this.imageFiles.length; i++) {
            const file = this.imageFiles[i];
            // 模擬上傳，實際應該上傳到服務器或雲存儲
            const mockUrl = `https://via.placeholder.com/400x400?text=Product+Image+${i + 1}`;
            imageUrls.push(mockUrl);
        }
        
        return imageUrls;
    }

    async submitForm() {
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // 顯示載入狀態
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;
        
        try {
            // 收集表單數據
            const formData = new FormData(document.getElementById('product-form'));
            
            // 收集規格數據
            const variants = [];
            const variantItems = document.querySelectorAll('.variant-item');
            
            variantItems.forEach((item, index) => {
                const nameInput = item.querySelector(`input[name*="[name]"]`);
                const priceInput = item.querySelector(`input[name*="[price]"]`);
                const stockInput = item.querySelector(`input[name*="[stock]"]`);
                
                if (nameInput && priceInput && stockInput) {
                    variants.push({
                        name: nameInput.value,
                        price: parseInt(priceInput.value),
                        stock: parseInt(stockInput.value)
                    });
                }
            });
            
            // 上傳圖片
            const imageUrls = await this.uploadImages();
            
            // 準備商品數據
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                categoryId: parseInt(formData.get('categoryId')),
                status: formData.get('status'),
                variants: variants,
                imageUrls: imageUrls
            };
            
            console.log('提交商品數據:', productData);
            
            // 調用API創建商品
            const response = await window.apiClient.createProduct(productData);
            
            console.log('商品創建成功:', response);
            this.showAlert('商品創建成功！', 'success');
            
            // 延遲跳轉到商品列表
            setTimeout(() => {
                window.location.href = '/seller/products';
            }, 1500);
            
        } catch (error) {
            console.error('創建商品失敗:', error);
            this.showAlert(error.message || '創建商品失敗，請稍後再試', 'error');
        } finally {
            // 恢復按鈕狀態
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    showAlert(message, type = 'info') {
        // 創建提示框
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '300px';
        
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(alert);
        
        // 自動移除
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// 等待 API 客戶端準備就緒
async function waitForApiClient() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.apiClient && typeof window.apiClient.getCategories === 'function') {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    throw new Error('API 客戶端載入超時');
}

// 初始化
waitForApiClient().then(() => {
    window.sellerProductNew = new SellerProductNew();
}).catch(error => {
    console.error('初始化新增商品頁面失敗:', error);
}); 
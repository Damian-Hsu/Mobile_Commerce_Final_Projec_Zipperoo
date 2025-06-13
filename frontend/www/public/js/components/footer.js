export class Footer {
    constructor() {
        this.footerCategoriesContainer = document.getElementById('footer-categories');
        this.footerCategoryLoading = document.getElementById('footer-category-loading');
    }

    init() {
        if (this.footerCategoriesContainer) {
            this.loadFooterCategories();
        }
    }

    async loadFooterCategories() {
        if (!this.footerCategoriesContainer || !this.footerCategoryLoading) return;

        try {
            // 等待 apiClient 載入
            await this.waitForApiClient();
            
            const result = await window.apiClient.getCategories();
            
            if (result && result.data) {
                // 只顯示前5個分類，以保持頁尾的簡潔
                const categories = result.data.slice(0, 5);
                
                categories.forEach(category => {
                    const item = document.createElement('li');
                    item.className = 'mb-2';
                    item.innerHTML = `<a href="/products?categoryId=${category.id}" class="text-muted text-decoration-none">${category.name}</a>`;
                    this.footerCategoriesContainer.insertBefore(item, this.footerCategoryLoading);
                });
            }
        } catch (error) {
            console.error('載入頁尾分類失敗:', error);
            // 如果載入失敗，顯示錯誤訊息
            if (this.footerCategoryLoading) {
                this.footerCategoryLoading.innerHTML = '<span class="text-muted"><i class="bi bi-exclamation-triangle"></i> 載入失敗</span>';
            }
        } finally {
            // 移除載入指示器
            if (this.footerCategoryLoading) {
                this.footerCategoryLoading.remove();
            }
        }
    }

    async waitForApiClient() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (window.apiClient && typeof window.apiClient.getCategories === 'function') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('API客戶端載入超時');
    }
}

// Footer組件將由App.js統一管理，不需要自動初始化 
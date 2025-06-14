import apiClient from '../services/api-client.js';
import { UIUtils } from '../services/utils.js';

export class CartPage {
    constructor() {
        this.cartContainer = document.getElementById('cart-items-container');
        this.loadingElement = document.getElementById('cart-loading');
        this.emptyCartElement = document.getElementById('empty-cart');
        this.cartActionsElement = document.getElementById('cart-actions');
        this.selectAllCheckbox = document.getElementById('selectAll');
        this.checkoutBtn = document.getElementById('checkout-btn');
        
        // Summary elements
        this.subtotalElement = document.getElementById('subtotal-amount');
        this.shippingElement = document.getElementById('shipping-amount');
        this.discountElement = document.getElementById('discount-amount');
        this.totalElement = document.getElementById('total-amount');
        
        this.cartData = null;
        this.selectedItems = new Set();
    }

    init() {
        if (!this.cartContainer) return;
        
        this.setupEventListeners();
        this.loadCart();
    }

    setupEventListeners() {
        // Select all checkbox
        this.selectAllCheckbox?.addEventListener('change', () => this.handleSelectAll());
        
        // Checkout button
        this.checkoutBtn?.addEventListener('click', () => this.proceedToCheckout());
        
        // Delete selected
        document.getElementById('deleteSelected')?.addEventListener('click', () => this.deleteSelectedItems());
        
        // Promo code
        document.getElementById('applyPromo')?.addEventListener('click', () => this.applyPromoCode());
    }

    async loadCart() {
        this.showLoading();
        
        try {
            const response = await apiClient.getCart();
            console.log('購物車回應:', response);
            
            if (response.data && response.data.items && response.data.items.length > 0) {
                this.cartData = response.data;
                this.renderCartItems(response.data.items);
                this.showCartContent();
                this.updateSummary();
            } else {
                this.showEmptyCart();
            }
        } catch (error) {
            console.error('載入購物車失敗:', error);
            if (error.message.includes('未找到購物車')) {
                this.showEmptyCart();
            } else {
                UIUtils.showToast('載入購物車失敗', 'danger');
                this.showEmptyCart();
            }
        }
    }

    showLoading() {
        this.loadingElement.style.display = 'block';
        this.cartContainer.style.display = 'none';
        this.emptyCartElement.classList.add('d-none');
        this.cartActionsElement.classList.add('d-none');
    }

    showCartContent() {
        this.loadingElement.style.display = 'none';
        this.cartContainer.style.display = 'block';
        this.emptyCartElement.classList.add('d-none');
        this.cartActionsElement.classList.remove('d-none');
    }

    showEmptyCart() {
        this.loadingElement.style.display = 'none';
        this.cartContainer.style.display = 'none';
        this.emptyCartElement.classList.remove('d-none');
        this.cartActionsElement.classList.add('d-none');
        this.checkoutBtn.disabled = true;
    }

    renderCartItems(items) {
        this.cartContainer.innerHTML = '';
        
        items.forEach(item => {
            const cartItem = this.createCartItemElement(item);
            this.cartContainer.appendChild(cartItem);
        });
        
        // Initialize selected items based on isSelected, but exclude off-shelf/out-of-stock items
        this.selectedItems.clear();
        items.forEach(item => {
            const product = item.productVariant.product;
            const variant = item.productVariant;
            const isProductOffShelf = product.status === 'OFF_SHELF' || product.status === 'DELETED';
            const isOutOfStock = variant.stock === 0;
            
            // Only add to selected items if product is available and was previously selected
            if (item.isSelected && !isProductOffShelf && !isOutOfStock) {
                this.selectedItems.add(item.id);
            }
        });
        
        this.updateSelectAllState();
        this.updateSummary();
        this.updateCheckoutButton();
    }

    createCartItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'card border-0 shadow-sm mb-3 cart-item';
        itemDiv.dataset.itemId = item.id;
        
        const product = item.productVariant.product;
        const variant = item.productVariant;
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0].url 
            : '/images/placeholder.svg';
        
        const totalPrice = item.quantity * item.unitPrice;
        
        // 檢查商品狀態
        const isProductOffShelf = product.status === 'OFF_SHELF' || product.status === 'DELETED';
        const isOutOfStock = variant.stock === 0;
        const isQuantityExceedsStock = item.quantity > variant.stock;
        
        itemDiv.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <!-- Checkbox -->
                    <div class="col-auto">
                        <div class="form-check">
                            <input class="form-check-input item-checkbox" type="checkbox" 
                                   data-item-id="${item.id}" 
                                   ${item.isSelected && !isProductOffShelf && !isOutOfStock ? 'checked' : ''}
                                   ${isProductOffShelf || isOutOfStock ? 'disabled' : ''}>
                        </div>
                    </div>
                    
                    <!-- Product Image -->
                    <div class="col-auto">
                        <img src="${imageUrl}" 
                             alt="${product.name}" 
                             class="rounded" 
                             style="width: 80px; height: 80px; object-fit: cover;"
                             onerror="this.src='/images/placeholder.svg'">
                    </div>
                    
                    <!-- Product Info -->
                    <div class="col">
                        <h6 class="mb-1">
                            <a href="/products/${product.id}" class="text-decoration-none text-dark">
                                ${product.name}
                            </a>
                        </h6>
                        <small class="text-muted">規格: ${variant.name}</small>
                        <div class="mt-1">
                            <span class="text-primary fw-bold">NT$ ${item.unitPrice}</span>
                        </div>
                        <div class="mt-1">
                            ${isProductOffShelf ? 
                                '<span class="badge bg-danger">商品已下架</span>' : 
                                isOutOfStock ? 
                                    '<span class="badge bg-warning text-dark">缺貨</span>' :
                                    isQuantityExceedsStock ?
                                        `<span class="badge bg-warning text-dark">庫存不足 (僅剩 ${variant.stock} 件)</span>` :
                                        `<small class="text-success">庫存: ${variant.stock} 件</small>`
                            }
                        </div>
                    </div>
                    
                    <!-- Quantity Controls -->
                    <div class="col-auto">
                        <div class="d-flex align-items-center">
                            <button class="btn btn-outline-secondary btn-sm quantity-btn" 
                                    data-action="decrease" data-item-id="${item.id}"
                                    ${item.quantity <= 1 || isProductOffShelf || isOutOfStock ? 'disabled' : ''}>
                                <i class="bi bi-dash"></i>
                            </button>
                            <span class="mx-3 fw-bold quantity-display">${item.quantity}</span>
                            <button class="btn btn-outline-secondary btn-sm quantity-btn" 
                                    data-action="increase" data-item-id="${item.id}"
                                    ${item.quantity >= variant.stock || isProductOffShelf || isOutOfStock ? 'disabled' : ''}>
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                        ${isProductOffShelf || isOutOfStock ? 
                            '<div class="mt-1"><small class="text-danger">無法調整數量</small></div>' : 
                            ''}
                    </div>
                    
                    <!-- Total Price -->
                    <div class="col-auto text-end">
                        <div class="fw-bold text-primary item-total">NT$ ${totalPrice}</div>
                        <button class="btn btn-link btn-sm text-danger p-0 mt-1 delete-item-btn" 
                                data-item-id="${item.id}">
                            <i class="bi bi-trash"></i> 刪除
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.addItemEventListeners(itemDiv, item);
        
        return itemDiv;
    }

    addItemEventListeners(itemDiv, item) {
        // Checkbox change
        const checkbox = itemDiv.querySelector('.item-checkbox');
        checkbox.addEventListener('change', () => this.handleItemSelect(item.id, checkbox.checked));
        
        // Quantity buttons
        const quantityBtns = itemDiv.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                this.updateQuantity(item.id, newQuantity);
            });
        });
        
        // Delete button
        const deleteBtn = itemDiv.querySelector('.delete-item-btn');
        deleteBtn.addEventListener('click', () => this.deleteItem(item.id));
    }

    handleSelectAll() {
        const isChecked = this.selectAllCheckbox.checked;
        const checkboxes = document.querySelectorAll('.item-checkbox:not(:disabled)');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const itemId = parseInt(checkbox.dataset.itemId);
            this.handleItemSelect(itemId, isChecked);
        });
    }

    handleItemSelect(itemId, isSelected) {
        if (isSelected) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }
        
        this.updateSelectAllState();
        this.updateSummary();
        this.updateCheckoutButton();
        
        // Update item selection on server
        this.updateItemSelection(itemId, isSelected);
    }

    updateSelectAllState() {
        const allAvailableCheckboxes = document.querySelectorAll('.item-checkbox:not(:disabled)');
        const checkedAvailableCheckboxes = document.querySelectorAll('.item-checkbox:not(:disabled):checked');
        
        if (allAvailableCheckboxes.length === 0) {
            this.selectAllCheckbox.indeterminate = false;
            this.selectAllCheckbox.checked = false;
        } else if (checkedAvailableCheckboxes.length === allAvailableCheckboxes.length) {
            this.selectAllCheckbox.indeterminate = false;
            this.selectAllCheckbox.checked = true;
        } else if (checkedAvailableCheckboxes.length > 0) {
            this.selectAllCheckbox.indeterminate = true;
        } else {
            this.selectAllCheckbox.indeterminate = false;
            this.selectAllCheckbox.checked = false;
        }
    }

    updateSummary() {
        if (!this.cartData || !this.cartData.items) return;
        
        let subtotal = 0;
        let selectedCount = 0;
        
        this.cartData.items.forEach(item => {
            if (this.selectedItems.has(item.id)) {
                subtotal += item.quantity * item.unitPrice;
                selectedCount++;
            }
        });
        
        const shipping = 0; // 免費運送
        const discount = 0; // 暫時沒有折扣
        const total = subtotal + shipping - discount;
        
        this.subtotalElement.textContent = `NT$ ${subtotal}`;
        this.shippingElement.textContent = shipping === 0 ? '免費' : `NT$ ${shipping}`;
        this.discountElement.textContent = `-NT$ ${discount}`;
        this.totalElement.textContent = `NT$ ${total}`;
    }

    updateCheckoutButton() {
        this.checkoutBtn.disabled = this.selectedItems.size === 0;
    }

    async updateQuantity(itemId, newQuantity) {
        if (newQuantity < 1) return;
        
        try {
            UIUtils.showLoading(document.querySelector(`[data-item-id="${itemId}"]`));
            
            await apiClient.updateCartItem(itemId, { quantity: newQuantity });
            
            // Update local data
            const item = this.cartData.items.find(item => item.id === itemId);
            if (item) {
                item.quantity = newQuantity;
            }
            
            // Re-render the specific item
            this.loadCart();
            
            UIUtils.showToast('數量已更新', 'success');
            
            // Trigger cart update event
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            
        } catch (error) {
            console.error('更新數量失敗:', error);
            
            // 根據錯誤類型顯示不同的訊息和處理方式
            if (error.message.includes('商品已下架') || error.message.includes('商品不存在')) {
                // 商品已下架或不存在，詢問是否移除
                const shouldRemove = confirm('此商品已下架或不存在，是否從購物車中移除？');
                if (shouldRemove) {
                    this.deleteItem(itemId);
                }
            } else if (error.message.includes('庫存不足')) {
                UIUtils.showToast('庫存不足，請調整數量', 'warning');
                // 重新載入購物車以獲取最新庫存信息
                this.loadCart();
            } else if (error.message.includes('缺貨')) {
                UIUtils.showToast('商品已缺貨，無法更新數量', 'warning');
                // 重新載入購物車以獲取最新狀態
                this.loadCart();
            } else {
                UIUtils.showToast('更新數量失敗：' + error.message, 'danger');
            }
        }
    }

    async updateItemSelection(itemId, isSelected) {
        try {
            await apiClient.updateCartItem(itemId, { isSelected });
        } catch (error) {
            console.error('更新選擇狀態失敗:', error);
        }
    }

    async deleteItem(itemId) {
        if (!confirm('確定要刪除此商品嗎？')) return;
        
        try {
            await apiClient.removeFromCart(itemId);
            
            // Remove from selected items
            this.selectedItems.delete(itemId);
            
            // Reload cart
            this.loadCart();
            
            UIUtils.showToast('商品已刪除', 'success');
            
            // Trigger cart update event
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            
        } catch (error) {
            console.error('刪除商品失敗:', error);
            UIUtils.showToast('刪除商品失敗', 'danger');
        }
    }

    async deleteSelectedItems() {
        if (this.selectedItems.size === 0) {
            UIUtils.showToast('請選擇要刪除的商品', 'warning');
            return;
        }
        
        if (!confirm(`確定要刪除 ${this.selectedItems.size} 個商品嗎？`)) return;
        
        try {
            const deletePromises = Array.from(this.selectedItems).map(itemId => 
                apiClient.removeFromCart(itemId)
            );
            
            await Promise.all(deletePromises);
            
            this.selectedItems.clear();
            this.loadCart();
            
            UIUtils.showToast('已刪除所選商品', 'success');
            
            // Trigger cart update event
            window.dispatchEvent(new CustomEvent('cartUpdated'));
            
        } catch (error) {
            console.error('批量刪除失敗:', error);
            UIUtils.showToast('刪除商品失敗', 'danger');
        }
    }

    proceedToCheckout() {
        if (this.selectedItems.size === 0) {
            UIUtils.showToast('請選擇要結帳的商品', 'warning');
            return;
        }
        
        // 將選中的商品ID存到sessionStorage，然後跳轉到結帳頁面
        const selectedItemIds = Array.from(this.selectedItems);
        sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItemIds));
        
        window.location.href = '/checkout';
    }

    applyPromoCode() {
        const promoCode = document.getElementById('promoCode').value.trim();
        if (!promoCode) {
            UIUtils.showToast('請輸入優惠代碼', 'warning');
            return;
        }
        
        // TODO: 實現優惠代碼功能
        UIUtils.showToast('優惠代碼功能開發中', 'info');
    }
} 
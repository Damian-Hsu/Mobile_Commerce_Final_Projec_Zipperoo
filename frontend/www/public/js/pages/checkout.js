import apiClient from '../services/api-client.js';
import { UIUtils } from '../services/utils.js';

export class CheckoutPage {
    constructor() {
        this.itemsContainer = document.getElementById('checkout-items-container');
        this.loadingElement = document.getElementById('checkout-loading');
        this.placeOrderBtn = document.getElementById('place-order-btn');
        this.agreeTermsCheckbox = document.getElementById('agreeTerms');
        
        // Summary elements
        this.subtotalElement = document.getElementById('order-subtotal');
        this.shippingElement = document.getElementById('order-shipping');
        this.discountElement = document.getElementById('order-discount');
        this.serviceFeeElement = document.getElementById('order-service-fee');
        this.totalElement = document.getElementById('order-total');
        
        this.checkoutItems = [];
        this.orderData = {
            subtotal: 0,
            shipping: 0,
            discount: 0,
            serviceFee: 0,
            total: 0
        };
    }

    init() {
        if (!this.itemsContainer) return;
        
        this.setupEventListeners();
        this.loadCheckoutItems();
        this.setupPaymentMethodSelection();
        this.setupAddressForm();
    }

    setupEventListeners() {
        // Terms checkbox
        this.agreeTermsCheckbox?.addEventListener('change', () => {
            this.updatePlaceOrderButton();
        });
        
        // Place order button
        this.placeOrderBtn?.addEventListener('click', () => this.placeOrder());
        
        // Form validation
        const form = document.getElementById('shipping-form');
        form?.addEventListener('input', () => {
            this.validateForm();
        });
    }

    setupPaymentMethodSelection() {
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => {
                // Remove selected class from all
                document.querySelectorAll('.form-check').forEach(check => {
                    check.classList.remove('selected');
                });
                
                // Add selected class to current
                if (e.target.checked) {
                    e.target.closest('.form-check').classList.add('selected');
                }
                
                this.updatePlaceOrderButton();
            });
        });
        
        // Set initial selection
        const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (checkedMethod) {
            checkedMethod.closest('.form-check').classList.add('selected');
        }
    }

    setupAddressForm() {
        const citySelect = document.getElementById('city');
        const districtSelect = document.getElementById('district');
        const postalCodeInput = document.getElementById('postalCode');
        
        // City/District mapping (simplified)
        const districts = {
            '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
            '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區'],
            '桃園市': ['桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區', '大園區', '龜山區', '八德區', '龍潭區', '平鎮區'],
            '台中市': ['中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區'],
            '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區'],
            '高雄市': ['新興區', '前金區', '苓雅區', '鹽埕區', '鼓山區', '旗津區', '前鎮區', '三民區', '楠梓區', '小港區']
        };
        
        citySelect?.addEventListener('change', () => {
            const selectedCity = citySelect.value;
            districtSelect.innerHTML = '<option value="">選擇區域</option>';
            postalCodeInput.value = '';
            
            if (selectedCity && districts[selectedCity]) {
                districts[selectedCity].forEach(district => {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    districtSelect.appendChild(option);
                });
            }
        });
        
        // Auto-fill postal code (simplified)
        districtSelect?.addEventListener('change', () => {
            const city = citySelect.value;
            const district = districtSelect.value;
            
            // This is a simplified implementation
            if (city === '台北市' && district === '中正區') {
                postalCodeInput.value = '100';
            } else if (city === '台北市' && district === '大安區') {
                postalCodeInput.value = '106';
            }
            // Add more mappings as needed
        });
    }

    async loadCheckoutItems() {
        this.showLoading();
        
        try {
            // Get selected items from sessionStorage
            const selectedItemIds = JSON.parse(sessionStorage.getItem('checkoutItems') || '[]');
            
            if (selectedItemIds.length === 0) {
                this.showError('沒有選擇任何商品進行結帳');
                return;
            }
            
            // Get cart data
            const cartResponse = await apiClient.getCart();
            if (!cartResponse.data || !cartResponse.data.items) {
                this.showError('無法載入購物車資料');
                return;
            }
            
            // Filter selected items
            this.checkoutItems = cartResponse.data.items.filter(item => 
                selectedItemIds.includes(item.id)
            );
            
            if (this.checkoutItems.length === 0) {
                this.showError('選擇的商品已不存在');
                return;
            }
            
            this.renderCheckoutItems();
            this.calculateOrderSummary();
            this.hideLoading();
            
        } catch (error) {
            console.error('載入結帳商品失敗:', error);
            this.showError('載入結帳商品失敗');
        }
    }

    showLoading() {
        this.loadingElement.style.display = 'block';
        this.itemsContainer.style.display = 'none';
    }

    hideLoading() {
        this.loadingElement.style.display = 'none';
        this.itemsContainer.style.display = 'block';
    }

    showError(message) {
        this.loadingElement.style.display = 'none';
        this.itemsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                <h4 class="mt-3">${message}</h4>
                <a href="/cart" class="btn btn-primary mt-3">返回購物車</a>
            </div>
        `;
    }

    renderCheckoutItems() {
        this.itemsContainer.innerHTML = '';
        
        this.checkoutItems.forEach(item => {
            const itemElement = this.createCheckoutItemElement(item);
            this.itemsContainer.appendChild(itemElement);
        });
    }

    createCheckoutItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'border-bottom pb-3 mb-3';
        
        const product = item.productVariant.product;
        const variant = item.productVariant;
        const imageUrl = UIUtils.getProductImageUrl(product);
        
        const totalPrice = item.quantity * item.unitPrice;
        
        itemDiv.innerHTML = `
            <div class="row align-items-center">
                <div class="col-auto">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         class="rounded" 
                         style="width: 60px; height: 60px; object-fit: cover;"
                         onerror="this.src='/images/placeholder.svg'">
                </div>
                <div class="col">
                    <h6 class="mb-1">${product.name}</h6>
                    <small class="text-muted">規格: ${variant.name}</small>
                    <div class="mt-1">
                        <span class="text-primary">NT$ ${item.unitPrice}</span>
                        <span class="text-muted ms-2">x ${item.quantity}</span>
                    </div>
                </div>
                <div class="col-auto text-end">
                    <div class="fw-bold text-primary">NT$ ${totalPrice}</div>
                </div>
            </div>
        `;
        
        return itemDiv;
    }

    calculateOrderSummary() {
        this.orderData.subtotal = this.checkoutItems.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0
        );
        
        // Calculate fees
        this.orderData.shipping = 0; // Free shipping
        this.orderData.discount = 0; // No discount for now
        this.orderData.serviceFee = 0; // No service fee
        
        this.orderData.total = this.orderData.subtotal + this.orderData.shipping + this.orderData.serviceFee - this.orderData.discount;
        
        this.updateOrderSummary();
    }

    updateOrderSummary() {
        this.subtotalElement.textContent = `NT$ ${this.orderData.subtotal}`;
        this.shippingElement.textContent = this.orderData.shipping === 0 ? '免費' : `NT$ ${this.orderData.shipping}`;
        this.discountElement.textContent = `-NT$ ${this.orderData.discount}`;
        this.serviceFeeElement.textContent = `NT$ ${this.orderData.serviceFee}`;
        this.totalElement.textContent = `NT$ ${this.orderData.total}`;
    }

    validateForm() {
        const requiredFields = [
            'recipientName', 'recipientPhone', 'city', 'district', 'postalCode', 'address'
        ];
        
        const isValid = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });
        
        const paymentSelected = document.querySelector('input[name="paymentMethod"]:checked');
        const termsAccepted = this.agreeTermsCheckbox?.checked;
        
        return isValid && paymentSelected && termsAccepted;
    }

    updatePlaceOrderButton() {
        this.placeOrderBtn.disabled = !this.validateForm();
    }

    async placeOrder() {
        if (!this.validateForm()) {
            UIUtils.showToast('請填寫完整資訊並同意條款', 'warning');
            return;
        }
        
        try {
            // Show loading state
            this.placeOrderBtn.disabled = true;
            this.placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>處理中...';
            
            // Prepare order data
            const orderData = {
                cartItemIds: this.checkoutItems.map(item => item.id),
                shippingAddress: {
                    recipientName: document.getElementById('recipientName').value,
                    recipientPhone: document.getElementById('recipientPhone').value,
                    city: document.getElementById('city').value,
                    district: document.getElementById('district').value,
                    postalCode: document.getElementById('postalCode').value,
                    address: document.getElementById('address').value,
                    notes: document.getElementById('notes').value || ''
                },
                paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value
            };
            
            console.log('提交訂單:', orderData);
            
            // Submit order
            const response = await apiClient.checkout(orderData);
            
            if (response.data && response.data.length > 0) {
                // Clear sessionStorage
                sessionStorage.removeItem('checkoutItems');
                
                // Show success and redirect
                UIUtils.showToast('訂單建立成功！', 'success');
                
                // Redirect to orders list page since multiple orders might be created
                setTimeout(() => {
                    if (response.data.length === 1) {
                        // Single order - redirect to order detail
                        window.location.href = `/orders/${response.data[0].id}`;
                    } else {
                        // Multiple orders - redirect to orders list
                        window.location.href = '/orders';
                    }
                }, 1500);
                
                // Trigger cart update event
                window.dispatchEvent(new CustomEvent('cartUpdated'));
            }
            
        } catch (error) {
            console.error('下單失敗:', error);
            UIUtils.showToast('下單失敗，請稍後再試', 'danger');
            
            // Reset button state
            this.placeOrderBtn.disabled = false;
            this.placeOrderBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>確認下單';
        }
    }
} 
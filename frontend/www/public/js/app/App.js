import { Config } from '../services/Config.js';
import { UIUtils } from '../services/utils.js';
import authManager from '../services/auth-manager.js';
import apiClient from '../services/api-client.js';
import { Header } from '../components/header.js';
import { Footer } from '../components/footer.js';
import { IndexPage } from '../pages/index.js';
import { LoginPage } from '../pages/login.js';
import { RegisterPage } from '../pages/register.js';
import { ProductsPage } from '../pages/products.js';
import { ProductDetailPage } from '../pages/product-detail.js';
import { CartPage } from '../pages/cart.js';
import { CheckoutPage } from '../pages/checkout.js';
import { ProfilePage } from '../pages/profile.js';

class App {
    constructor() {
        this.config = new Config();
        window.AppConfig = this.config; // Expose for global access if needed
        window.apiClient = apiClient; // Expose apiClient globally for non-module scripts
        window.Config = Config; // Expose Config class globally
        window.UIUtils = UIUtils; // Expose UIUtils globally for non-module scripts
        console.log('AppConfig initialized:', this.config);
    }

    async init() {
        // First, validate the user's session
        await authManager.validateSession();

        // Redirect logged-in users from auth pages
        this.handleAuthRedirect();

        // Then, initialize components and page-specific logic
        this.initComponents();
        this.initPageSpecificLogic();
        
        // Mark as initialized and fire event
        this.initialized = true;
        this.authManager = authManager; // 暴露認證管理器
        window.App = this;
        
        // Fire appInitialized event for other scripts to listen
        const event = new CustomEvent('appInitialized');
        window.dispatchEvent(event);
        
        console.log("Zipperoo frontend initialized.");
    }

    handleAuthRedirect() {
        const isAuthenticated = authManager.isAuthenticated();
        const currentPage = window.location.pathname;

        if (isAuthenticated && (currentPage === '/login' || currentPage === '/login.html' || currentPage === '/register' || currentPage === '/register.html')) {
            console.log("User is authenticated, redirecting from auth page to home.");
            window.location.href = '/';
        }
    }

    initComponents() {
        const header = new Header();
        header.init();
        
        // Expose header instance globally for other components to access
        window.header = header;

        const footer = new Footer();
        footer.init();

        // Mobile menu toggle logic could be moved into the Header class
        // but for now, we leave it here for simplicity.
        const menuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Here we can initialize other components based on the page
        // For example:
        // if (document.querySelector('.products-page')) {
        //     const productsPage = new ProductsPage();
        //     productsPage.init();
        // }
    }

    initPageSpecificLogic() {
        // Simple router based on a unique element on the page
        if (document.getElementById('hot-products-container')) {
            const indexPage = new IndexPage();
            indexPage.init();
        } else if (document.getElementById('loginForm')) {
            const loginPage = new LoginPage();
            loginPage.init();
        } else if (document.getElementById('register-form')) {
            const registerPage = new RegisterPage();
            registerPage.init();
        } else if (document.getElementById('products-container')) {
            const productsPage = new ProductsPage();
            productsPage.init();
        } else if (document.getElementById('product-content')) {
            const productDetailPage = new ProductDetailPage();
            productDetailPage.init();
            window.productDetailPage = productDetailPage; // 設為全域變數以供HTML中的onclick使用
        } else if (document.getElementById('cart-items-container')) {
            // 購物車頁面
            const cartPage = new CartPage();
            cartPage.init();
        } else if (document.getElementById('checkout-items-container')) {
            // 結帳頁面
            const checkoutPage = new CheckoutPage();
            checkoutPage.init();
        } else if (document.getElementById('profile-card')) {
            // 個人資料頁面
            const profilePage = new ProfilePage();
            profilePage.init();
        } else if (document.getElementById('orders-list')) {
            // 訂單列表頁面已在orders.js中自動初始化
            console.log('Orders page detected');
        } else if (document.getElementById('order-items')) {
            // 訂單詳情頁面已在order-detail.js中自動初始化
            console.log('Order detail page detected');
        } else if (document.getElementById('total-users') && document.getElementById('total-products') && document.getElementById('total-orders') && document.getElementById('total-logs')) {
            // Admin dashboard 頁面檢測 - 有四個統計卡片
            console.log('Admin dashboard page detected');
        } else if (document.getElementById('total-products')) {
            // Seller dashboard 頁面檢測
            console.log('Seller dashboard page detected');
        } else if (document.getElementById('products-tbody')) {
            // Seller products 頁面檢測
            console.log('Seller products page detected');
        } else if (document.getElementById('orders-tbody')) {
            // Seller orders 頁面檢測
            console.log('Seller orders page detected');
        } else if (document.getElementById('chat-sidebar')) {
            // Chat 頁面檢測
            console.log('Chat page detected');
        }
        // ... and so on for other pages
    }

    showAlert(message, type = 'info', duration = 5000) {
        // 創建 alert 元素
        const alertId = 'alert-' + Date.now();
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const alertHtml = `
            <div id="${alertId}" class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // 插入到 body 中
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // 自動移除
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, duration);
    }
}

export default new App(); 
/**
 * 登入頁面邏輯
 */
import authManager from '../services/auth-manager.js';
import { UIUtils } from '../services/utils.js';

export class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.accountInput = document.getElementById('account');
    }

    init() {
        if (!this.form) return;
        this.setupEventListeners();
        this.loadRememberedAccount();
        UIUtils.checkURLForMessage();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }

        ['account', 'password'].forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        this.passwordInput.setAttribute('type', type);
        const icon = this.togglePasswordBtn.querySelector('i');
        icon.className = type === 'text' ? 'bi bi-eye-slash' : 'bi bi-eye';
    }

    loadRememberedAccount() {
        const rememberedAccount = localStorage.getItem('rememberedAccount');
        if (rememberedAccount && this.accountInput) {
            this.accountInput.value = rememberedAccount;
            if (this.rememberMeCheckbox) {
                this.rememberMeCheckbox.checked = true;
            }
        }
    }

    validateForm() {
        this.clearFieldError(this.accountInput);
        this.clearFieldError(this.passwordInput);

        const account = this.accountInput.value.trim();
        const password = this.passwordInput.value;

        if (!account || account.length < 3) {
            this.showFieldError(this.accountInput, '帳號最少需要 3 個字元');
            return false;
        }

        if (!password || password.length < 6) {
            this.showFieldError(this.passwordInput, '密碼最少需要 6 個字元');
            return false;
        }

        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!this.validateForm()) return;

        const account = this.accountInput.value.trim();
        const password = this.passwordInput.value;
        
        UIUtils.showLoading(this.submitBtn, '登入中...');

        try {
            const redirectUrl = await authManager.login(account, password);

            if (this.rememberMeCheckbox && this.rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedAccount', account);
            } else {
                localStorage.removeItem('rememberedAccount');
            }

            // Add a success message to the URL for the next page to display
            const successMessage = encodeURIComponent('登入成功！歡迎回來。');
            const separator = redirectUrl.includes('?') ? '&' : '?';
            window.location.href = `${redirectUrl}`;

        } catch (error) {
            console.error('Login failed:', error);
            UIUtils.showToast(error.message || '登入失敗，請檢查您的帳號和密碼。', 'danger');
            this.passwordInput.value = '';
            this.passwordInput.focus();
        } finally {
            UIUtils.hideLoading(this.submitBtn);
        }
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        let feedback = field.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
    }
} 
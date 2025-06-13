import apiClient from '../services/api-client.js';
import { UIUtils } from '../services/utils.js';

export class RegisterPage {
    constructor() {
        this.form = document.getElementById('register-form');
        this.submitBtn = document.getElementById('register-btn');
        this.accountTypeCards = document.querySelectorAll('.account-type-card');
        this.sellerFields = document.getElementById('seller-fields');
        this.roleInput = document.getElementById('role');
        this.selectedRole = 'BUYER'; // Default role
    }

    init() {
        if (!this.form) return;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        this.accountTypeCards.forEach(card => {
            card.addEventListener('click', () => this.selectAccountType(card));
        });

        this.setupPasswordToggle('password', 'togglePassword');
        this.setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

        this.form.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupPasswordToggle(inputId, buttonId) {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = document.getElementById(buttonId);
        if (passwordInput && toggleButton) {
            toggleButton.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                toggleButton.querySelector('i').className = `bi ${type === 'password' ? 'bi-eye' : 'bi-eye-slash'}`;
            });
        }
    }

    selectAccountType(selectedCard) {
        this.accountTypeCards.forEach(card => card.classList.remove('border-primary', 'shadow'));
        selectedCard.classList.add('border-primary', 'shadow');
        
        this.selectedRole = selectedCard.dataset.type;
        this.roleInput.value = this.selectedRole;

        const sellerInputs = this.sellerFields.querySelectorAll('input, textarea');
        if (this.selectedRole === 'SELLER') {
            this.sellerFields.classList.remove('d-none');
            sellerInputs.forEach(input => input.required = true);
        } else {
            this.sellerFields.classList.add('d-none');
            sellerInputs.forEach(input => input.required = false);
        }
    }

    validateForm(data) {
        // Simple validation logic, can be expanded
        if (data.password !== data.confirmPassword) {
            this.showFieldError('confirmPassword', '密碼不一致');
            return false;
        }
        // Check required fields based on form's own validation
        if (!this.form.checkValidity()) {
            // This will trigger native browser validation UI for empty required fields
            this.form.reportValidity();
            return false;
        }
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        if (!this.validateForm(data)) return;

        // Remove confirmPassword before sending to backend
        const { confirmPassword, ...registerData } = data;

        UIUtils.showLoading(this.submitBtn, '建立中...');
        
        try {
            await apiClient.register(registerData);
            UIUtils.showToast('註冊成功！', 'success');

            setTimeout(() => {
                const message = encodeURIComponent('註冊成功，請使用您的新帳號登入。');
                window.location.href = `/login?message=${message}&type=success`;
            }, 1500);

        } catch (error) {
            const errorMessage = error.message || '註冊失敗，請稍後再試。';
            UIUtils.showToast(errorMessage, 'danger');
            if (errorMessage.includes('帳號')) {
                this.showFieldError('account', '此帳號已被註冊');
            }
        } finally {
            UIUtils.hideLoading(this.submitBtn);
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback, .form-text');
            if (feedback) feedback.textContent = message;
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
    }
} 
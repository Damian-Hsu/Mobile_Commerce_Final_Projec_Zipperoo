export class ProfilePage {
    constructor() {
        this.profileLoading = document.getElementById('profile-loading');
        this.profileError = document.getElementById('profile-error');
        this.profileCard = document.getElementById('profile-card');
        
        // 個人資料元素
        this.profileUsername = document.getElementById('profile-username');
        this.profileRole = document.getElementById('profile-role');
        this.profileAccount = document.getElementById('profile-account');
        this.profileUsernameDisplay = document.getElementById('profile-username-display');
        this.profileEmail = document.getElementById('profile-email');
        this.profilePhone = document.getElementById('profile-phone');
        this.profileRoleDisplay = document.getElementById('profile-role-display');
        this.profileShopName = document.getElementById('profile-shop-name');
        this.profileCreatedAt = document.getElementById('profile-created-at');
        this.profileDescription = document.getElementById('profile-description');
        
        // 區塊元素
        this.shopNameSection = document.getElementById('shop-name-section');
        this.descriptionSection = document.getElementById('description-section');
    }

    async init() {
        try {
            // 檢查是否已登入
            if (!window.apiClient || !window.apiClient.isAuthenticated()) {
                window.location.href = '/login';
                return;
            }

            await this.loadProfile();
        } catch (error) {
            console.error('初始化個人資料頁面失敗:', error);
            this.showError();
        }
    }

    async loadProfile() {
        try {
            this.showLoading();

            // 等待 apiClient 準備就緒
            await this.waitForApiClient();

            const response = await window.apiClient.getProfile();
            
            if (response.statusCode === 200 && response.data) {
                this.displayProfile(response.data);
                this.showProfile();
            } else {
                throw new Error(response.message || '載入個人資料失敗');
            }
        } catch (error) {
            console.error('載入個人資料失敗:', error);
            this.showError();
        }
    }

    displayProfile(profile) {
        // 頁面標題中的用戶名稱和角色
        if (this.profileUsername) {
            this.profileUsername.textContent = profile.username || '未設定';
        }
        
        if (this.profileRole) {
            this.profileRole.textContent = this.getRoleText(profile.role);
            this.profileRole.className = `role-badge ${profile.role.toLowerCase()}`;
        }

        // 基本資訊
        if (this.profileAccount) {
            this.profileAccount.textContent = profile.account || '未設定';
        }

        if (this.profileUsernameDisplay) {
            this.profileUsernameDisplay.textContent = profile.username || '未設定';
        }

        if (this.profileEmail) {
            if (profile.email) {
                this.profileEmail.textContent = profile.email;
                this.profileEmail.classList.remove('empty');
            } else {
                this.profileEmail.textContent = '未設定';
                this.profileEmail.classList.add('empty');
            }
        }

        if (this.profilePhone) {
            if (profile.phone) {
                this.profilePhone.textContent = profile.phone;
                this.profilePhone.classList.remove('empty');
            } else {
                this.profilePhone.textContent = '未設定';
                this.profilePhone.classList.add('empty');
            }
        }

        if (this.profileRoleDisplay) {
            this.profileRoleDisplay.textContent = this.getRoleText(profile.role);
        }

        // 商店名稱（僅賣家顯示）
        if (profile.role === 'SELLER' && this.shopNameSection) {
            this.shopNameSection.style.display = 'block';
            if (this.profileShopName) {
                if (profile.shopName) {
                    this.profileShopName.textContent = profile.shopName;
                    this.profileShopName.classList.remove('empty');
                } else {
                    this.profileShopName.textContent = '無';
                    this.profileShopName.classList.add('empty');
                }
            }
        } else if (this.shopNameSection) {
            this.shopNameSection.style.display = 'none';
        }

        // 註冊時間
        if (this.profileCreatedAt && profile.createdAt) {
            this.profileCreatedAt.textContent = this.formatDate(profile.createdAt);
        }

        // 個人簡介
        if (profile.description && profile.description.trim()) {
            if (this.descriptionSection) {
                this.descriptionSection.style.display = 'block';
            }
            if (this.profileDescription) {
                this.profileDescription.textContent = profile.description;
            }
        } else {
            if (this.descriptionSection) {
                this.descriptionSection.style.display = 'none';
            }
        }
    }

    getRoleText(role) {
        switch (role) {
            case 'BUYER':
                return '買家';
            case 'SELLER':
                return '賣家';
            case 'ADMIN':
                return '管理員';
            default:
                return '未知';
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('日期格式化失敗:', error);
            return '無效日期';
        }
    }

    showLoading() {
        if (this.profileLoading) this.profileLoading.style.display = 'flex';
        if (this.profileError) this.profileError.style.display = 'none';
        if (this.profileCard) this.profileCard.style.display = 'none';
    }

    showError() {
        if (this.profileLoading) this.profileLoading.style.display = 'none';
        if (this.profileError) this.profileError.style.display = 'flex';
        if (this.profileCard) this.profileCard.style.display = 'none';
    }

    showProfile() {
        if (this.profileLoading) this.profileLoading.style.display = 'none';
        if (this.profileError) this.profileError.style.display = 'none';
        if (this.profileCard) this.profileCard.style.display = 'block';
    }

    async waitForApiClient() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            if (window.apiClient && typeof window.apiClient.getProfile === 'function') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('API客戶端載入超時');
    }
}

// 全局初始化
window.profilePage = new ProfilePage(); 
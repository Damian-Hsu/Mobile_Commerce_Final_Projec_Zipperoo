import apiClient from './api-client.js';

/**
 * AuthManager - 統一管理前端使用者認證狀態
 * 遵循原則：單一事實來源、啟動時驗證、事件驅動更新
 */
class AuthManager {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('accessToken');
    this.apiClient = apiClient;

    if (this.token) {
      this.apiClient.token = this.token;
    }
    
    console.log('🚀 AuthManager instance created.');
  }

  /**
   * Checks stored token against the backend to validate the session.
   * This should be called at application startup.
   */
  async validateSession() {
    // 檢查本地儲存的用戶資料
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        console.log('AuthManager: Found stored user data:', this.user.username);
      } catch (e) {
        console.warn('AuthManager: Invalid stored user data, clearing...');
        localStorage.removeItem('user');
      }
    }

    if (!this.token) {
      console.log('AuthManager: No token found, user is not authenticated.');
      this.user = null;
      this._notify();
      return;
    }

    try {
      const result = await this.apiClient.getProfile();
      if (result.data && result.data.id) {
        this.user = result.data;
        localStorage.setItem('user', JSON.stringify(this.user));
        console.log('AuthManager: Session validated for user:', this.user.username);
      } else {
        throw new Error('Could not retrieve a valid user profile.');
      }
    } catch (error) {
      console.warn('AuthManager: Token validation failed, logging out.', error.message);
      this.logout(false); // Token is invalid, perform a client-side logout
    } finally {
      this._notify();
    }
  }

  /**
   * Login
   * @param {string} account 
   * @param {string} password 
   * @returns {Promise<string>} Returns the redirect URL on successful login.
   */
  async login(account, password) {
    const result = await this.apiClient.login(account, password);
    if (result.data && result.data.accessToken) {
      this.token = result.data.accessToken;
      this.user = result.data.user;

      // Update apiClient instance's token
      this.apiClient.token = this.token;
      
      // Persist user data
      localStorage.setItem('accessToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));

      this._notify();

      // Determine redirect URL
      switch (this.user.role) {
        case 'SELLER':
          return '/seller/dashboard';
        case 'ADMIN':
          return '/admin/dashboard';
        default:
          return '/';
      }
    } else {
      throw new Error(result.message || 'An unknown error occurred during login.');
    }
  }

  /**
   * Logout
   * @param {boolean} notifyApi - Whether to call the logout endpoint on the backend.
   */
  async logout(notifyApi = true) {
    if (notifyApi) {
      try {
        await this.apiClient.logout();
      } catch (error) {
        console.warn('API logout call failed, but proceeding with client-side logout:', error);
      }
    }
    this.user = null;
    this.token = null;
    this.apiClient.clearAuth(); // This also clears localStorage
    this._notify();
  }

  /**
   * 檢查使用者是否已認證
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.user && !!this.token;
  }

  /**
   * 廣播認證狀態變更事件
   */
  _notify() {
    console.log('AuthManager: Firing authChange event. User:', this.user ? this.user.username : 'unauthenticated');
    const event = new CustomEvent('authChange', {
      detail: {
        user: this.user,
        isAuthenticated: this.isAuthenticated()
      }
    });
    window.dispatchEvent(event);
  }
}

export default new AuthManager(); 
export class Config {
    constructor() {
        this.isDevelopment = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        this.frontendDomain = this.getFrontendDomain();
        this.apiBaseUrl = this.getApiBaseUrl();
        this.apiUrl = `${this.apiBaseUrl}/api/v1`; // Standard API endpoint structure
    }

    getFrontendDomain() {
        return `${window.location.protocol}//${window.location.host}`;
    }

    getApiBaseUrl() {
        if (this.isDevelopment) {
            // 在開發環境中，強制使用正確的後端端口
            const result = 'http://localhost';
            console.log('Config Debug:');
            console.log('isDevelopment:', this.isDevelopment);
            console.log('window.__ENV__:', window.__ENV__);
            console.log('Forced API base URL:', result);
            return result;
        } else {
            // In production, NGINX will proxy requests from port 80 to the backend
            // so the frontend can just use its own origin.
            return window.location.origin;
        }
    }

    getImageBaseUrl() {
        if (this.isDevelopment) {
            return 'http://localhost';
        }
        return window.location.origin;
    }

    // 獲取環境變數的通用方法
    getEnvVariable(key) {
        // 方法1: 嘗試從全域變數獲取 (最簡單的方式)
        if (typeof window !== 'undefined' && window.__ENV__) {
            return window.__ENV__[key];
        }

        // 方法2: 嘗試從 process.env 獲取 (如果可用)
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key];
        }

        // 方法3: 嘗試從預設的環境變數配置獲取
        try {
            // 在開發環境中手動檢查一些常見的環境變數
            if (key === 'VITE_API_BASE') {
                // 可以在這裡添加一些邏輯來檢測或硬編碼環境變數值
                return this.getDefaultApiBase();
            }
        } catch (e) {
            console.warn('無法獲取環境變數:', key);
        }

        return undefined;
    }

    // 獲取預設的API基礎URL
    getDefaultApiBase() {
        // 根據當前環境返回適當的API基礎URL
        if (this.isDevelopment) {
            return 'http://localhost:3001';
        }
        return window.location.origin;
    }
} 
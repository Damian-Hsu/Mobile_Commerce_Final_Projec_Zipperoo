/**
 * 前端應用配置
 */
export class Config {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.frontendDomain = `http://${window.location.hostname}`;
        
        // 檢查是否有環境變數設定
        const envApiBase = window.__ENV__ && window.__ENV__.VITE_API_BASE;
        
        // 優先使用環境變數，否則根據當前主機名決定
        if (envApiBase && envApiBase !== "") {
            this.apiBaseUrl = envApiBase;
        } else {
            // 在 Docker + nginx 反向代理環境中，使用當前 origin
            // 這樣 /api 路徑會被 nginx 正確代理到後端
            this.apiBaseUrl = window.location.origin;
        }
        
        this.apiUrl = `${this.apiBaseUrl}/api/v1`;
        
        console.log('Config Debug:');
        console.log('isDevelopment:', this.isDevelopment);
        console.log('window.__ENV__:', window.__ENV__);
        console.log('envApiBase:', envApiBase);
        console.log('window.location.hostname:', window.location.hostname);
        console.log('window.location.origin:', window.location.origin);
        console.log('Final API base URL:', this.apiBaseUrl);
        console.log('Final API URL:', this.apiUrl);
    }

    getApiUrl() {
        return this.apiUrl;
    }

    getApiBaseUrl() {
        return this.apiBaseUrl;
    }

    getFrontendDomain() {
        return this.frontendDomain;
    }

    isDev() {
        return this.isDevelopment;
    }
}

// 創建全局配置實例
export const AppConfig = new Config(); 
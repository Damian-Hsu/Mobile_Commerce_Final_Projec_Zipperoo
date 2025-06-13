/**
 * 通用的 UI 工具函式
 */
export class UIUtils {
  /**
   * 顯示一個短暫的提示訊息 (Toast)
   * @param {string} message - 要顯示的訊息
   * @param {string} type - 訊息類型 ('success', 'danger', 'warning', 'info')
   */
  static showToast(message, type = 'info') {
    // 檢查 toast 容器是否存在，若無則創建
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = UIUtils.createToastContainer();
    }

    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    // eslint-disable-next-line no-undef
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    // 提示消失後從 DOM 中移除
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
  
  /**
   * 創建 Toast 容器
   * @returns {HTMLElement}
   */
  static createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
  }

  /**
   * 在按鈕或元素上顯示載入狀態
   * @param {HTMLElement} element - 目標元素
   * @param {string} text - 載入時顯示的文字
   */
  static showLoading(element, text = '載入中...') {
    if (!element) return;
    element.dataset.originalContent = element.innerHTML;
    element.disabled = true;
    element.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span class="ms-1">${text}</span>
    `;
  }

  /**
   * 隱藏元素的載入狀態
   * @param {HTMLElement} element - 目標元素
   */
  static hideLoading(element) {
    if (!element || typeof element.dataset.originalContent === 'undefined') return;
    element.innerHTML = element.dataset.originalContent;
    element.disabled = false;
    delete element.dataset.originalContent;
  }
  
  /**
   * 格式化價格
   * @param {number} price 
   * @returns {string}
   */
  static formatPrice(price) {
    if (typeof price !== 'number') return '';
    return `$${price.toLocaleString()}`;
  }

  /**
   * 格式化日期時間
   * @param {string} dateStr - ISO 格式的日期字串
   * @returns {string}
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * 防抖函式
   * @param {Function} func 
   * @param {number} wait 
   * @returns {Function}
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 檢查 URL 是否有 message 參數，若有則顯示 Toast
   */
  static checkURLForMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';

    if (message) {
      // 使用 setTimeout 確保 UI 已完全載入
      setTimeout(() => {
        UIUtils.showToast(decodeURIComponent(message), type);
        
        // 從 URL 中移除參數，避免重新整理時再次顯示
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);

      }, 200);
    }
  }

  /**
   * Generates HTML for rating stars.
   * @param {number} rating - The average rating.
   * @param {number} maxStars - The maximum number of stars.
   * @returns {string} - The HTML string for the stars.
   */
  static generateStars(rating, maxStars = 5) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
    }
    if (halfStar) {
      starsHtml += '<i class="bi bi-star-half text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="bi bi-star text-warning"></i>';
    }
    return starsHtml;
  }

  /**
   * 處理圖片URL，將相對路徑轉換為完整的API URL
   * @param {string} imageUrl - 圖片URL
   * @param {string} fallback - 如果圖片URL為空時的後備圖片
   * @returns {string} - 完整的圖片URL
   */
  static getImageUrl(imageUrl, fallback = '/images/placeholder.svg') {
    if (!imageUrl) return fallback;
    
    // 如果已經是完整的URL，直接返回
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // 如果是相對路徑，添加API基礎URL
    const config = new window.Config();
    return `${config.apiBaseUrl}${imageUrl}`;
  }

  /**
   * 從商品對象中獲取第一張圖片的URL
   * @param {Object} product - 商品對象
   * @returns {string} - 圖片URL
   */
  static getProductImageUrl(product) {
    if (product && product.images && product.images.length > 0 && product.images[0].url) {
      return UIUtils.getImageUrl(product.images[0].url);
    }
    return '/images/placeholder.svg';
  }
}

/**
 * 根據分類名稱獲取對應的 Bootstrap Icon
 * @param {string} categoryName - 分類名稱
 * @returns {string} Bootstrap Icon 類名
 */
export function getCategoryIcon(categoryName) {
    console.log(`getCategoryIcon called with: ${categoryName}`); // Debug log
    if (!categoryName) return 'bi-grid';
    
    const name = categoryName.toLowerCase();
    
    // 服裝類
    if (name.includes('女裝') || name.includes('女性') || name.includes('ladies') || name.includes('women')) {
        return 'bi-person-standing-dress';
    }
    if (name.includes('男裝') || name.includes('男性') || name.includes('men') || name.includes('gentleman')) {
        return 'bi-people';
    }
    if (name.includes('童裝') || name.includes('兒童') || name.includes('kids') || name.includes('baby')) {
        return 'bi-emoji-sunglasses-fill';
    }
    if (name.includes('內衣') || name.includes('underwear') || name.includes('睡衣') || name.includes('pajama')) {
        return 'bi-suit-heart';
    }
    
    // 鞋類
    if (name.includes('鞋') || name.includes('boots') || name.includes('sneakers') || name.includes('sandals')) {
        return 'bi-boot';
    }
    if (name.includes('運動鞋') || name.includes('球鞋') || name.includes('跑鞋')) {
        return 'bi-bicycle';
    }
    if (name.includes('高跟鞋') || name.includes('heels')) {
        return 'bi-emoji-heart-eyes';
    }
    
    // 配件類
    if (name.includes('包') || name.includes('背包') || name.includes('手提包') || name.includes('bag') || name.includes('handbag')) {
        return 'bi-bag';
    }
    if (name.includes('手錶') || name.includes('錶') || name.includes('watch') || name.includes('時計')) {
        return 'bi-watch';
    }
    if (name.includes('帽') || name.includes('cap') || name.includes('hat')) {
        return 'bi-cap';
    }
    if (name.includes('眼鏡') || name.includes('太陽眼鏡') || name.includes('glasses') || name.includes('sunglasses')) {
        return 'bi-eyeglasses';
    }
    if (name.includes('首飾') || name.includes('珠寶') || name.includes('jewelry') || name.includes('項鍊') || name.includes('戒指')) {
        return 'bi-gem';
    }
    if (name.includes('皮帶') || name.includes('腰帶') || name.includes('belt')) {
        return 'bi-rulers';
    }
    
    // 運動用品
    if (name.includes('運動') || name.includes('體育') || name.includes('sports') || name.includes('fitness')) {
        return 'bi-bicycle';
    }
    if (name.includes('健身') || name.includes('gym') || name.includes('workout')) {
        return 'bi-activity';
    }
    if (name.includes('瑜伽') || name.includes('yoga')) {
        return 'bi-heart-pulse';
    }
    
    // 美妝保養
    if (name.includes('美妝') || name.includes('化妝') || name.includes('彩妝') || name.includes('makeup') || name.includes('cosmetics')) {
        return 'bi-palette';
    }
    if (name.includes('保養') || name.includes('護膚') || name.includes('skincare') || name.includes('面膜')) {
        return 'bi-droplet';
    }
    if (name.includes('香水') || name.includes('perfume') || name.includes('fragrance')) {
        return 'bi-flower1';
    }
    
    // 3C電子
    if (name.includes('3c') || name.includes('電子') || name.includes('electronics') || name.includes('digital')) {
        return 'bi-laptop';
    }
    if (name.includes('手機') || name.includes('phone') || name.includes('mobile')) {
        return 'bi-phone';
    }
    if (name.includes('電腦') || name.includes('筆電') || name.includes('computer') || name.includes('laptop')) {
        return 'bi-laptop';
    }
    if (name.includes('相機') || name.includes('camera') || name.includes('攝影')) {
        return 'bi-camera';
    }
    if (name.includes('耳機') || name.includes('headphones') || name.includes('音響')) {
        return 'bi-headphones';
    }
    
    // 居家生活
    if (name.includes('居家') || name.includes('家居') || name.includes('home') || name.includes('living')) {
        return 'bi-house';
    }
    if (name.includes('廚具') || name.includes('廚房') || name.includes('kitchen') || name.includes('烹飪')) {
        return 'bi-cup-hot';
    }
    if (name.includes('寢具') || name.includes('床') || name.includes('bedding') || name.includes('pillow')) {
        return 'bi-moon';
    }
    if (name.includes('清潔') || name.includes('洗衣') || name.includes('cleaning')) {
        return 'bi-droplet-half';
    }
    
    // 書籍文具
    if (name.includes('書') || name.includes('圖書') || name.includes('book') || name.includes('reading')) {
        return 'bi-book';
    }
    if (name.includes('文具') || name.includes('筆') || name.includes('stationery') || name.includes('pen')) {
        return 'bi-pencil';
    }
    
    // 食品飲料
    if (name.includes('食品') || name.includes('零食') || name.includes('food') || name.includes('snack')) {
        return 'bi-cup-straw';
    }
    if (name.includes('飲料') || name.includes('茶') || name.includes('咖啡') || name.includes('drink') || name.includes('beverage')) {
        return 'bi-cup-hot';
    }
    
    // 汽車用品
    if (name.includes('汽車') || name.includes('車用') || name.includes('car') || name.includes('auto')) {
        return 'bi-car-front';
    }
    
    // 寵物用品
    if (name.includes('寵物') || name.includes('貓') || name.includes('狗') || name.includes('pet') || name.includes('cat') || name.includes('dog')) {
        return 'bi-heart';
    }
    
    // 嬰幼兒用品
    if (name.includes('嬰兒') || name.includes('幼兒') || name.includes('嬰幼兒') || name.includes('baby') || name.includes('infant')) {
        return 'bi-baby';
    }
    
    // 音樂樂器
    if (name.includes('音樂') || name.includes('樂器') || name.includes('music') || name.includes('instrument')) {
        return 'bi-music-note';
    }
    
    // 遊戲玩具
    if (name.includes('遊戲') || name.includes('玩具') || name.includes('game') || name.includes('toy')) {
        return 'bi-controller';
    }
    
    // 預設圖標
    return 'bi-grid';
} 
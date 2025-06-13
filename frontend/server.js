const express = require('express');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
// Point to the views directory
app.set('views', path.join(__dirname, 'www', 'views'));

// Serve static files from the 'public' directory inside 'www'
app.use(express.static(path.join(__dirname, 'www', 'public')));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to pass environment variables to frontend
app.use((req, res, next) => {
  // 調試：檢查環境變數
  console.log('Environment Variables Debug:');
  console.log('process.env.VITE_API_BASE:', process.env.VITE_API_BASE);
  console.log('All env vars starting with VITE_:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));
  
  // 將環境變數傳遞給所有模板
  res.locals.env = {
    VITE_API_BASE: process.env.VITE_API_BASE || 'http://localhost:3001'
  };
  
  // console.log('Passed to template:', res.locals.env);
  next();
});

// Middleware to simulate user session (for development)
app.use((req, res, next) => {
  // For now, simulate no user logged in
  // In a real app, you'd check JWT token or session
  res.locals.user = null;
  next();
});

// Route for the home page
app.get('/', (req, res) => {
  res.render('pages/index', { 
    title: 'Zipperoo - 打造您的獨特風格',
    description: 'Discover the latest trends and timeless classics to express your unique style.'
  });
});

// Route for products page
app.get('/products', (req, res) => {
  res.render('pages/products', { 
    title: '商品 - Zipperoo',
    description: 'Browse our collection of fashion items',
    query: req.query
  });
});

// Route for single product page
app.get('/products/:id', (req, res) => {
  res.render('pages/product-detail', { 
    title: '商品詳情 - Zipperoo',
    productId: req.params.id
  });
});

// Auth routes
app.get('/login', (req, res) => {
  res.render('pages/login', { 
    title: '登入 - Zipperoo',
    error: null
  });
});

app.get('/register', (req, res) => {
  res.render('pages/register', { 
    title: '註冊 - Zipperoo',
    error: null
  });
});

app.get('/logout', (req, res) => {
  // Clear any session data
  res.redirect('/');
});

// Cart and checkout routes
app.get('/cart', (req, res) => {
  res.render('pages/cart', { 
    title: '購物車 - Zipperoo'
  });
});

app.get('/checkout', (req, res) => {
  res.render('pages/checkout', { 
    title: '結帳 - Zipperoo'
  });
});

// User dashboard routes
app.get('/profile', (req, res) => {
  res.render('pages/profile', { 
    title: '個人資料 - Zipperoo'
  });
});

app.get('/orders', (req, res) => {
  res.render('pages/orders', { 
    title: '我的訂單 - Zipperoo'
  });
});

// Route for single order detail page
app.get('/orders/:id', (req, res) => {
  res.render('pages/order-detail', { 
    title: '訂單詳情 - Zipperoo',
    orderId: req.params.id
  });
});

// Chat route
app.get('/chat', (req, res) => {
  res.render('pages/chat', { 
    title: '聊天室 - Zipperoo'
  });
});

// Seller routes
app.get('/seller/dashboard', (req, res) => {
  res.render('pages/seller-dashboard', { 
    title: '賣家中心 - Zipperoo'
  });
});

app.get('/seller/products', (req, res) => {
  res.render('pages/seller-products', { 
    title: '我的商品 - Zipperoo'
  });
});

app.get('/seller/products/new', (req, res) => {
  res.render('pages/seller-product-new', { 
    title: '新增商品 - Zipperoo'
  });
});

app.get('/seller/products/:id/edit', (req, res) => {
  res.render('pages/seller-product-edit', { 
    title: '編輯商品 - Zipperoo',
    productId: req.params.id
  });
});

app.get('/seller/orders', (req, res) => {
  res.render('pages/seller-orders', { 
    title: '我的訂單 - Zipperoo'
  });
});

// Admin routes
app.get('/admin/dashboard', (req, res) => {
  res.render('pages/admin-dashboard', { 
    title: '管理後台 - Zipperoo'
  });
});

// Static pages
app.get('/about', (req, res) => {
  res.render('pages/about', { 
    title: '關於我們 - Zipperoo'
  });
});

app.get('/contact', (req, res) => {
  res.render('pages/contact', { 
    title: '聯絡我們 - Zipperoo'
  });
});

app.get('/help', (req, res) => {
  res.render('pages/help', { 
    title: '幫助中心 - Zipperoo'
  });
});

// Test routes for error pages (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/test/404', (req, res) => {
    res.status(404).render('pages/404', { 
      title: '頁面未找到 - Zipperoo'
    });
  });

  app.get('/test/500', (req, res) => {
    res.status(500).render('pages/500', { 
      title: '伺服器錯誤 - Zipperoo',
      error: '這是一個測試錯誤'
    });
  });

  app.get('/test/error', (req, res) => {
    throw new Error('這是一個測試錯誤，用於觸發 500 錯誤處理');
  });
}

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('pages/404', { 
    title: '頁面未找到 - Zipperoo'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/500', { 
    title: '伺服器錯誤 - Zipperoo',
    error: process.env.NODE_ENV === 'development' ? err.message : '發生未預期的錯誤'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 前端伺服器正在監聽 http://0.0.0.0:${port}`);
  console.log(`📱 本機訪問：http://localhost:${port}`);
  console.log(`🌐 網路訪問：http://192.168.68.105:${port}`);
  console.log(`🛍️  訪問商品頁：http://192.168.68.105:${port}/products`);
});

module.exports = app;

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
// -- 配置 --
const API_BASE_URL = `${process.env.API_URL || 'http://localhost'}/api/v1`;
const a = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: (status) => status < 500, // 不把 4xx 視為錯誤
});

// -- 輔助工具 --
const log = (message: string) => console.log(`[🌱 Seed] ${message}`);
const logError = (message: string, error?: any) => {
  console.error(`[❌ Seed Error] ${message}`);
  if (error?.isAxiosError && error.response?.data) {
    console.error('         └──', JSON.stringify(error.response.data));
  } else if (error?.message) {
    console.error('         └──', error.message);
  } else {
    console.error('         └──', 'An unknown error occurred', error);
  }
};

const registeredUsers: { [key: string]: { user: any; token: string } } = {};

/**
 * 註冊並登入使用者
 */
async function registerAndLogin(type: 'seller' | 'buyer') {
  const account = type;
  const password = 'cyut123456';
  const email = `${type}@example.com`;

  try {
    // 1. 嘗試註冊
    const registerPayload: any = { account, password, username: type, email, role: type.toUpperCase() };
    if (type === 'seller') {
      registerPayload.shopName = '時尚精品店';
    }
    const registerRes = await a.post('/auth/register', registerPayload);
    
    if (registerRes.status === 201) {
      // 註冊成功
      log(`註冊 ${type} 成功`);
      const registerData = (registerRes.data as any)?.data;
      if (registerData?.accessToken) {
        const { accessToken, user } = registerData;
        registeredUsers[type] = { user, token: accessToken };
        log(`${type} 登入成功 (Token: ${accessToken.slice(0, 10)}...)`);
        return true;
      }
    } else if (registerRes.status === 409) {
      // 用戶已存在，嘗試登入
      log(`${type} 用戶已存在，嘗試登入...`);
      const loginRes = await a.post('/auth/login', { account, password });
      
      if (loginRes.status === 200) {
        const loginData = (loginRes.data as any)?.data;
        if (loginData?.accessToken) {
          const { accessToken, user } = loginData;
          registeredUsers[type] = { user, token: accessToken };
          log(`${type} 登入成功 (Token: ${accessToken.slice(0, 10)}...)`);
          return true;
        }
      }
    }
    
    throw new Error(`註冊/登入失敗。狀態: ${registerRes.status}`);
    
  } catch (e) {
    logError(`處理 ${type} 時發生錯誤`, e);
    return false;
  }
}

/**
 * 創建分類
 */
async function createCategories(sellerToken: string) {
  const categories = [
    { name: '外套/針織衫'},
    { name: 'T恤/休閒' },
    { name: '襯衫/設計上衣' },
    { name: '洋裝/裙子' },
    { name: '下身類(褲子)' }
  ];

  // 首先獲取現有類別
  try {
    const existingRes = await a.get('/categories');
    const existingCategories = (existingRes.data as any)?.data || [];
    log(`找到 ${existingCategories.length} 個現有分類`);
    
    if (existingCategories.length > 0) {
      log('使用現有分類而非創建新的');
      return existingCategories;
    }
  } catch (e) {
    log('無法獲取現有分類，將嘗試創建新的');
  }

  const createdCategories: any[] = [];

  for (const category of categories) {
    try {
      const res = await a.post('/categories', category, { 
        headers: { Authorization: `Bearer ${sellerToken}` } 
      });
      const newCategory = (res.data as any)?.data;
      if (newCategory?.id) {
        createdCategories.push(newCategory);
        log(`成功創建分類: ${category.name} (ID: ${newCategory.id})`);
      }
    } catch (e) {
      // 檢查是否為重複名稱錯誤
      if (e?.response?.status === 500 && e?.response?.data?.message?.includes?.('constraint')) {
        log(`分類 ${category.name} 已存在，跳過創建`);
      } else {
        logError(`創建分類 ${category.name} 失敗`, e);
      }
    }
  }

  // 如果沒有成功創建任何類別，再次嘗試獲取現有類別
  if (createdCategories.length === 0) {
    try {
      const existingRes = await a.get('/categories');
      const existingCategories = (existingRes.data as any)?.data || [];
      log(`使用 ${existingCategories.length} 個現有分類`);
      return existingCategories;
    } catch (e) {
      logError('無法獲取現有分類', e);
    }
  }

  return createdCategories;
}

/**
 * 創建商品
 */
async function createProducts(sellerToken: string, categories: any[]) {
  const TshirtCategory = categories.find(cat => cat.name === 'T恤/休閒');
  const ShirtCategory = categories.find(cat => cat.name === '襯衫/設計上衣');
  const DressCategory = categories.find(cat => cat.name === '洋裝/裙子');
  const PantsCategory = categories.find(cat => cat.name === '下身類(褲子)');
  const OuterwearCategory = categories.find(cat => cat.name === '外套/針織衫');

  const products = [
    // 男裝商品
    {
      name: 'UNIQLO 男裝 HEATTECH CREW NECK 長袖T恤',
      description: '採用HEATTECH科技纖維，輕薄保暖，親膚舒適。適合日常穿搭和運動休閒。',
      categoryId: TshirtCategory?.id,
      variants: [
        { name: '黑色 / M', price: 590, stock: 25 },
        { name: '黑色 / L', price: 590, stock: 30 },
        { name: '白色 / L', price: 590, stock: 20 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'ZARA 男士修身牛仔褲',
      description: '經典修身版型，優質丹寧面料，百搭時尚。適合各種場合穿著。',
      categoryId: PantsCategory?.id,
      variants: [
        { name: '深藍色 / 30', price: 1290, stock: 15 },
        { name: '深藍色 / 32', price: 1290, stock: 20 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'H&M 男士連帽衛衣',
      description: '舒適純棉材質，寬鬆版型，經典連帽設計。休閒百搭必備單品。',
      categoryId: ShirtCategory?.id,
      variants: [
        { name: '灰色 / M', price: 799, stock: 35 },
        { name: '灰色 / L', price: 799, stock: 40 },
        { name: '黑色 / L', price: 799, stock: 25 }
      ],
      imageUrls: ['https://image.hm.com/assets/hm/01/68/01689eebce40d3bd664e49c84681d64b02dfa6e4.jpg?imwidth=1536']
    },
    // 女裝商品
    {
      name: 'ZARA 女士波點雪紡上衣',
      description: '輕盈雪紡面料，復古波點印花，優雅氣質。適合約會和辦公場合。',
      categoryId: ShirtCategory?.id,
      variants: [
        { name: '黑白波點 / S', price: 990, stock: 18 },
        { name: '黑白波點 / M', price: 990, stock: 22 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'UNIQLO 女裝 Ultra Light Down 羽絨外套',
      description: '超輕量羽絨外套，攜帶方便，保暖效果佳。時尚設計，多色可選。',
      categoryId: OuterwearCategory?.id,
      variants: [
        { name: '粉紅色 / M', price: 1990, stock: 12 },
        { name: '海軍藍 / M', price: 1990, stock: 15 },
        { name: '海軍藍 / L', price: 1990, stock: 10 }
      ],
      imageUrls: ['https://down-tw.img.susercontent.com/file/tw-11134207-7rash-m6bci6p38rdi19.webp']
    }
  ];

  const createdProducts: any[] = [];

  for (const product of products) {
    try {
      const res = await a.post('/seller/products', product, { 
        headers: { Authorization: `Bearer ${sellerToken}` } 
      });
      const newProduct = (res.data as any)?.data;
      if (newProduct?.id) {
        createdProducts.push(newProduct);
        log(`成功創建商品: ${product.name} (ID: ${newProduct.id})`);
      }
    } catch (e) {
      logError(`創建商品 ${product.name} 失敗`, e);
    }
  }

  return createdProducts;
}

/**
 * 主程序
 */
async function main() {
  log('🚀 開始 API 數據填充...');
  const prisma = new PrismaClient();
  try {
    // 0. 直接建立 Admin 帳號
    log('正在檢查並建立 Admin 帳號...');
    const existingAdmin = await prisma.user.findUnique({ where: { account: 'admin' } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('s11114020', 10);
      await prisma.user.create({
        data: {
          account: 'admin',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
          phone: '0900000000',
          passwordHash,
        },
      });
      log('✅ Admin 帳號建立成功。');
    } else {
      log('ℹ️ Admin 帳號已存在，跳過建立。');
    }
  } catch(e) {
    logError('建立 Admin 帳號失敗', e);
  } finally {
    await prisma.$disconnect();
  }

  // 1. 註冊並登入所有使用者
  if (!(await registerAndLogin('seller')) || !(await registerAndLogin('buyer'))) {
    logError('使用者註冊/登入失敗，終止腳本。');
    return;
  }
  const { user: seller, token: sellerToken } = registeredUsers.seller;
  const { user: buyer, token: buyerToken } = registeredUsers.buyer;
  
  // 2. 創建分類
  log('正在創建商品分類...');
  const categories = await createCategories(sellerToken);
  if (categories.length === 0) {
    logError('創建分類失敗，終止腳本。');
    return;
  }

  // 3. 創建商品
  log('正在創建商品...');
  const createdProducts = await createProducts(sellerToken, categories);
  if (createdProducts.length === 0) {
    logError('創建商品失敗，終止腳本。');
    return;
  }
  
  const productToBuy = createdProducts[0];
  const variantToBuy = productToBuy.variants[0];

  // 4. 買家將商品加入購物車
  try {
    await a.post('/buyers/me/cart/items', 
      { productVariantId: variantToBuy.id, quantity: 1 },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    log(`買家 (ID: ${buyer.id}) 將款式 (ID: ${variantToBuy.id}) 加入購物車`);
  } catch (e) {
    logError('加入購物車失敗', e);
    return;
  }


  log('✅ API 數據填充完成！');
  log('\n📋 測試賬號 (密碼均為: 123456):');
  log('-> 管理員 - 用戶名: admin');
  log('-> 賣家 - 用戶名: seller (時尚精品店)');
  log('-> 買家 - 用戶名: buyer');
  log('\n🏷️ 已創建分類:');
  log('-> 男裝');
  log('-> 女裝');
  log('\n👕 已創建商品:');
  log('-> UNIQLO 男裝 HEATTECH CREW NECK 長袖T恤 (3個變體)');
  log('-> ZARA 男士修身牛仔褲 (2個變體)');
  log('-> H&M 男士連帽衛衣 (3個變體)');
  log('-> ZARA 女士波點雪紡上衣 (2個變體)');
  log('-> UNIQLO 女裝 Ultra Light Down 羽絨外套 (3個變體)');
}

main().catch((e) => {
  logError('腳本執行時發生未預期的嚴重錯誤:', e);
  process.exit(1);
});

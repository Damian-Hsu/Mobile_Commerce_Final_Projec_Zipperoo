import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
// -- 配置 --
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
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
  const password = '123456';
  const email = `${type}@example.com`;

  try {
    // 1. 註冊並直接獲取 Token
    const registerPayload: any = { account, password, username: type, email, role: type.toUpperCase() };
    if (type === 'seller') {
      registerPayload.shopName = '時尚精品店';
    }
    const registerRes = await a.post('/auth/register', registerPayload);
    log(`註冊 ${type}...`);
    
    const registerData = (registerRes.data as any)?.data;
    if (registerRes.status >= 400 || !registerData?.accessToken) {
      throw new Error(`註冊或獲取 Token 失敗。狀態: ${registerRes.status}, 回應: ${JSON.stringify(registerRes.data)}`);
    }

    const { accessToken, user } = registerData;
    registeredUsers[type] = { user, token: accessToken };
    log(`註冊並登入 ${type} 成功 (Token: ${accessToken.slice(0, 10)}...)`);
    
    return true;
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
    { name: '男裝' },
    { name: '女裝' }
  ];

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
      logError(`創建分類 ${category.name} 失敗`, e);
    }
  }

  return createdCategories;
}

/**
 * 創建商品
 */
async function createProducts(sellerToken: string, categories: any[]) {
  const menCategory = categories.find(cat => cat.name === '男裝');
  const womenCategory = categories.find(cat => cat.name === '女裝');

  const products = [
    // 男裝商品
    {
      name: 'UNIQLO 男裝 HEATTECH CREW NECK 長袖T恤',
      description: '採用HEATTECH科技纖維，輕薄保暖，親膚舒適。適合日常穿搭和運動休閒。',
      categoryId: menCategory?.id,
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
      categoryId: menCategory?.id,
      variants: [
        { name: '深藍色 / 30', price: 1290, stock: 15 },
        { name: '深藍色 / 32', price: 1290, stock: 20 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'H&M 男士連帽衛衣',
      description: '舒適純棉材質，寬鬆版型，經典連帽設計。休閒百搭必備單品。',
      categoryId: menCategory?.id,
      variants: [
        { name: '灰色 / M', price: 799, stock: 35 },
        { name: '灰色 / L', price: 799, stock: 40 },
        { name: '黑色 / L', price: 799, stock: 25 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
    },
    // 女裝商品
    {
      name: 'ZARA 女士波點雪紡上衣',
      description: '輕盈雪紡面料，復古波點印花，優雅氣質。適合約會和辦公場合。',
      categoryId: womenCategory?.id,
      variants: [
        { name: '黑白波點 / S', price: 990, stock: 18 },
        { name: '黑白波點 / M', price: 990, stock: 22 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
    },
    {
      name: 'UNIQLO 女裝 Ultra Light Down 羽絨外套',
      description: '超輕量羽絨外套，攜帶方便，保暖效果佳。時尚設計，多色可選。',
      categoryId: womenCategory?.id,
      variants: [
        { name: '粉紅色 / M', price: 1990, stock: 12 },
        { name: '海軍藍 / M', price: 1990, stock: 15 },
        { name: '海軍藍 / L', price: 1990, stock: 10 }
      ],
      imageUrls: ['https://images.unsplash.com/photo-1544966503-7cc61ac7d9e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80']
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
      const passwordHash = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          account: 'admin',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
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
      { productVariantId: variantToBuy.id, quantity: 2 },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    log(`買家 (ID: ${buyer.id}) 將款式 (ID: ${variantToBuy.id}) 加入購物車`);
  } catch (e) {
    logError('加入購物車失敗', e);
    return;
  }

  // 5. 買家結帳（使用新的結帳格式）
  let createdOrders: any[] = [];
  try {
    const checkoutData = {
      cartItemIds: [], // 使用所有選中的項目
      shippingAddress: {
        recipientName: '張小明',
        recipientPhone: '0912345678',
        city: '台北市',
        district: '大安區',
        postalCode: '106',
        address: '復興南路一段123號4樓',
        notes: '請在平日上班時間送達'
      },
      paymentMethod: 'COD'
    };
    
    const res = await a.post('/buyers/me/checkout', checkoutData, { headers: { Authorization: `Bearer ${buyerToken}` } });
    createdOrders = (res.data as any).data;
    if (!createdOrders || createdOrders.length === 0) throw new Error(`結帳失敗，回應: ${JSON.stringify(res.data)}`);
    log(`買家 (ID: ${buyer.id}) 結帳成功，建立訂單 (ID: ${createdOrders.map(o => o.id).join(', ')})`);
  } catch(e) {
    logError('結帳失敗', e);
    return;
  }

  // 6. 賣家將訂單標示為完成
  try {
    for (const order of createdOrders) {
      await a.patch(`/seller/orders/${order.id}/ship`, {}, { headers: { Authorization: `Bearer ${sellerToken}` } });
      log(`賣家 (ID: ${seller.id}) 將訂單 (ID: ${order.id}) 標示為已出貨`);
    }
  } catch(e) {
    logError('更新訂單狀態失敗', e);
  }
  
  // 7. 買家發表評論
  try {
    await a.post(`/products/${productToBuy.id}/reviews`, 
      { score: 5, comment: '質量很好，物流也很快！推薦購買！' },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    log(`買家 (ID: ${buyer.id}) 已對商品 (ID: ${productToBuy.id}) 發表評論`);
  } catch (e) {
    logError('發表評論失敗', e);
  }

  // 8. 買家與賣家開始聊天
  try {
    const chatRoomRes = await a.post('/chat/rooms', { sellerId: seller.id }, { headers: { Authorization: `Bearer ${buyerToken}` } });
    const roomId = (chatRoomRes.data as any).data.id;
    if (!roomId) throw new Error(`建立聊天室失敗，回應: ${JSON.stringify(chatRoomRes.data)}`);
    log(`買家 (ID: ${buyer.id}) 與賣家 (ID: ${seller.id}) 建立聊天室 (ID: ${roomId})`);
    
    await a.post(`/chat/rooms/${roomId}/messages`, { content: '您好，請問這件衣服的材質如何？' }, { headers: { Authorization: `Bearer ${buyerToken}` } });
    await a.post(`/chat/rooms/${roomId}/messages`, { content: '您好！這件衣服採用優質面料，穿起來很舒適，感謝您的詢問！' }, { headers: { Authorization: `Bearer ${sellerToken}` } });
    log('聊天訊息已發送');
  } catch (e) {
    logError('處理聊天功能失敗', e);
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

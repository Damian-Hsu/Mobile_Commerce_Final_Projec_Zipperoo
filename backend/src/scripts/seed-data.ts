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
      registerPayload.shopName = '種子商店';
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
  
  // 2. 賣家建立商品
  let createdProducts: any[] = [];
  try {
    const productPayload = {
      name: 'AI 生成的時尚T恤',
      description: '由種子腳本自動建立的商品',
      variants: [
        { name: '經典白 / S', price: 299, stock: 50 },
        { name: '經典白 / M', price: 299, stock: 50 },
        { name: '太空黑 / M', price: 350, stock: 30 },
      ],
      imageUrls: ['https://via.placeholder.com/300x300/CCCCCC/FFFFFF?text=Seeded+T-Shirt'],
    };
    const res = await a.post('/seller/products', productPayload, { headers: { Authorization: `Bearer ${sellerToken}` } });
    const newProduct = (res.data as any)?.data;
    if (!newProduct?.id) throw new Error(`建立商品失敗，回應: ${JSON.stringify(res.data)}`);
    createdProducts.push(newProduct);
    log(`賣家 (ID: ${seller.id}) 成功建立商品 (ID: ${newProduct.id})`);
  } catch(e) {
    logError('建立商品失敗', e);
    return;
  }
  
  const productToBuy = createdProducts[0];
  const variantToBuy = productToBuy.variants[0];

  // 3. 買家將商品加入購物車
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

  // 4. 買家結帳
  let createdOrders: any[] = [];
  try {
    const res = await a.post('/buyers/me/checkout', {}, { headers: { Authorization: `Bearer ${buyerToken}` } });
    createdOrders = (res.data as any).data;
    if (!createdOrders || createdOrders.length === 0) throw new Error(`結帳失敗，回應: ${JSON.stringify(res.data)}`);
    log(`買家 (ID: ${buyer.id}) 結帳成功，建立訂單 (ID: ${createdOrders.map(o => o.id).join(', ')})`);
  } catch(e) {
    logError('結帳失敗', e);
    return;
  }

  // 5. 賣家將訂單標示為完成
  try {
    for (const order of createdOrders) {
      await a.patch(`/seller/orders/${order.id}/ship`, {}, { headers: { Authorization: `Bearer ${sellerToken}` } });
      log(`賣家 (ID: ${seller.id}) 將訂單 (ID: ${order.id}) 標示為已出貨`);
    }
  } catch(e) {
    logError('更新訂單狀態失敗', e);
  }
  
  // 6. 買家發表評論
  try {
    await a.post(`/products/${productToBuy.id}/reviews`, 
      { orderId: createdOrders[0].id, score: 5, comment: 'API 種子評論：非常棒的商品！' },
      { headers: { Authorization: `Bearer ${buyerToken}` } }
    );
    log(`買家 (ID: ${buyer.id}) 已對商品 (ID: ${productToBuy.id}) 發表評論`);
  } catch (e) {
    logError('發表評論失敗', e);
  }

  // 7. 買家與賣家開始聊天
  try {
    const chatRoomRes = await a.post('/chat/rooms', { recipientId: seller.id }, { headers: { Authorization: `Bearer ${buyerToken}` } });
    const roomId = (chatRoomRes.data as any).data.id;
    if (!roomId) throw new Error(`建立聊天室失敗，回應: ${JSON.stringify(chatRoomRes.data)}`);
    log(`買家 (ID: ${buyer.id}) 與賣家 (ID: ${seller.id}) 建立聊天室 (ID: ${roomId})`);
    
    await a.post('/chat/messages', { roomId, content: '你好，我是從種子腳本來的買家！' }, { headers: { Authorization: `Bearer ${buyerToken}` } });
    await a.post('/chat/messages', { roomId, content: '你好，種子買家！我是種子賣家，很高興為您服務。' }, { headers: { Authorization: `Bearer ${sellerToken}` } });
    log('聊天訊息已發送');
  } catch (e) {
    logError('處理聊天功能失敗', e);
  }

  log('✅ API 數據填充完成！');
  log('\n📋 測試賬號 (密碼均為: 123456):');
  log('-> 管理員 - 用戶名: admin');
  log('-> 賣家 - 用戶名: seller');
  log('-> 買家 - 用戶名: buyer');
}

main().catch((e) => {
  logError('腳本執行時發生未預期的嚴重錯誤:', e);
  process.exit(1);
});

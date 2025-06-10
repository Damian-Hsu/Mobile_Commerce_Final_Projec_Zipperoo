import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Zipperoo E2E Tests', () => {
  let app: INestApplication;
  let buyerToken: string;
  let sellerToken: string;
  // let adminToken: string;
  let productId: number;
  let orderId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should register a buyer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          account: 'testbuyer',
          password: 'password123',
          username: 'Test Buyer',
          email: 'buyer@test.com',
          role: 'BUYER',
        })
        .expect(201);

      expect(response.body.data.accessToken).toBeDefined();
      buyerToken = response.body.data.accessToken;
    });

    it('should register a seller', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          account: 'testseller',
          password: 'password123',
          username: 'Test Seller',
          email: 'seller@test.com',
          role: 'SELLER',
          shopName: 'Test Shop',
          description: 'A test shop',
        })
        .expect(201);

      expect(response.body.data.accessToken).toBeDefined();
      sellerToken = response.body.data.accessToken;
    });

    it('should login buyer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          account: 'testbuyer',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
    });
  });

  describe('Product Management', () => {
    it('should create a product as seller', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Test Product',
          description: 'A test product',
          price: 1000, // $10.00 in cents
          stock: 100,
          imageUrls: ['https://example.com/image1.jpg'],
        })
        .expect(201);

      expect(response.body.data.name).toBe('Test Product');
      productId = response.body.data.id;
    });

    it('should get products list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should get product detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(response.body.data.name).toBe('Test Product');
    });
  });

  describe('Shopping Cart Flow', () => {
    it('should add item to cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/buyers/me/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId,
          quantity: 2,
        })
        .expect(201);

      expect(response.body.data.quantity).toBe(2);
    });

    it('should get cart', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/buyers/me/cart')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('Checkout Flow', () => {
    it('should checkout cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/buyers/me/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(201);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      orderId = response.body.data[0].id;
    });

    it('should get orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/buyers/me/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Order Management', () => {
    it('should complete order as seller', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/seller/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.message).toContain('完成');
    });
  });

  describe('Review System', () => {
    it('should create review for completed order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          score: 5,
          comment: 'Great product!',
        })
        .expect(201);

      expect(response.body.data.score).toBe(5);
    });

    it('should get product reviews', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews`)
        .expect(200);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });
}); 
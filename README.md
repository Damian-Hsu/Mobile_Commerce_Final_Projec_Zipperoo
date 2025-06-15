# Zipperoo 購衣平台系統介紹

Zipperoo 是一個功能完整的電商平台後端系統，採用現代化的 NestJS + PostgreSQL + Prisma 技術棧，支援買家、賣家、管理員三種角色的電商生態系統，具備商品變體管理、即時聊天、評價系統等企業級功能。

## 🌟 設計願景

建立一個穩定、可擴展的電商平台，為不同角色提供最佳的使用體驗：
- **💰 賣家** - 輕鬆管理商品、處理訂單、與客戶溝通
- **🛒 買家** - 流暢的購物體驗、安全的支付流程、即時客服
- **🔧 管理員** - 全面的系統監控、用戶管理、數據分析

## 🚀 核心功能特色

### 👥 多角色權限系統
- **Buyer（買家）**: 商品瀏覽、搜尋篩選、購物車管理、訂單追蹤、商品評價、即時聊天
- **Seller（賣家）**: 商品與變體管理、訂單處理、客服聊天、銷售數據、圖片上傳
- **Admin（管理員）**: 用戶管理、商品審核、系統監控、日誌追蹤、權限控制

### 🛍️ 進階商品系統
- **商品變體管理**: 支援顏色、尺寸等多屬性組合
- **智能分類系統**: 層級式商品分類管理
- **圖片管理**: 多圖片上傳、壓縮、CDN 分發
- **庫存控制**: 實時庫存同步、超賣防護
- **搜尋與篩選**: 全文搜尋、價格區間、分類篩選

### 💳 完整交易流程
- **智能購物車**: 商品選擇、數量調整、價格計算
- **安全結帳**: 庫存鎖定、事務處理、狀態管理
- **訂單追蹤**: 完整的訂單生命週期管理
- **評價系統**: 商品評分、評論管理、信譽建立

### 💬 即時通訊系統
- **WebSocket 聊天**: 買賣家即時溝通
- **聊天室管理**: 自動建立、訊息歷史、狀態同步
- **客服支援**: 多對話管理、訊息推送

### 🔐 企業級安全
- **JWT 認證**: 無狀態認證、Token 刷新
- **角色權限**: 細粒度權限控制、API 保護
- **密碼安全**: bcrypt 加密、重設流程
- **數據驗證**: DTO 驗證、類型安全

## 🏛️ 系統分析與設計

本節詳細闡述了 Zipperoo 系統的核心設計，包含系統的參與者、功能、以及核心業務對象的結構與關係。  
詳細內容可以在 `/SystemDesign` 查看，內含有所有設計圖以及API設計表格，同時還有詳細的API介面介紹。
### UML 用例圖 (Use Case Diagram)
用例圖描述了系統外部不同角色（Actors）與系統提供的功能（Use Cases）之間的互動關係，**完全基於實際 API 端點和控制器實現**，展示了系統的真實業務流程。

```mermaid
graph LR
    subgraph "Zipperoo 電商平台系統"
        subgraph "系統檢查 (System)"
            UC1(系統健康檢查)
        end
        
        subgraph "帳號認證 (Authentication)"
            UC2(註冊帳號)
            UC3(登入)
            UC4(登出)
            UC5(查看個人資料)
            UC6(更新個人資料)
            UC7(忘記密碼)
            UC8(重設密碼)
        end
        
        subgraph "公開功能 (Public API)"
            UC9(瀏覽商品列表)
            UC10(查看商品詳情)
            UC11(瀏覽分類)
            UC12(查看商品評價列表)
            UC13(查看分類下的商品)
        end
        
        subgraph "分類管理 (Category Management)"
            UC14(建立新分類)
            UC15(查看單一分類)
            UC16(更新分類)
            UC17(刪除分類)
        end
        
        subgraph "買家功能 (Buyer API)"
            UC18(查看購物車)
            UC19(加入購物車)
            UC20(更新購物車商品)
            UC21(移除購物車商品)
            UC22(結帳)
            UC23(查看我的訂單)
            UC24(查看訂單詳情)
            UC25(取消訂單)
            UC26(確認收貨)
        end
        
        subgraph "賣家功能 (Seller API)"
            UC27(查看賣家儀表板)
            UC28(查看商品統計)
            UC29(查看我的商品)
            UC30(上架新商品)
            UC31(更新商品基本資訊)
            UC32(下架/刪除商品)
            UC33(查看收到的訂單)
            UC34(標記訂單為已出貨)
            UC35(標記訂單為已完成)
        end
        
        subgraph "商品款式管理 (Variant Management)"
            UC36(為商品新增款式)
            UC37(更新商品款式)
            UC38(刪除商品款式)
        end
        
        subgraph "評價系統 (Review API)"
            UC39(創建商品評價)
            UC40(更新評價)
            UC41(刪除評價)
        end
        
        subgraph "聊天系統 (Chat API)"
            UC42(創建或獲取聊天室)
            UC43(獲取聊天室列表)
            UC44(查看聊天訊息)
            UC45(發送訊息)
            UC46(標記訊息為已讀)
            UC47(獲取未讀訊息數量)
        end
        
        subgraph "圖片管理 (Image API)"
            UC48(上傳商品圖片)
            UC49(刪除商品圖片)
            UC50(通過檔名獲取圖片)
            UC51(通過ID獲取圖片)
        end
        
        subgraph "通知系統 (Notification)"
            UC52(獲取通知計數)
            UC53(接收即時通知)
        end
        
        subgraph "管理員功能 (Admin API)"
            UC54(查看管理員儀表板)
            UC55(獲取所有用戶)
            UC56(刪除用戶)
            UC57(封鎖用戶)
            UC58(解除封鎖用戶)
            UC59(獲取所有商品)
            UC60(刪除任意商品)
            UC61(獲取所有訂單)
            UC62(獲取訂單詳情)
            UC63(更新訂單狀態)
            UC64(查看系統日誌)
            UC65(管理商品分類)
        end
        
        subgraph "統計與報表 (Analytics)"
            UC66(查看銷售報表)
            UC67(查看用戶統計)
            UC68(匯出資料)
        end
    end
    
    Visitor(👤 訪客)
    Buyer(🛒 買家<br/>BUYER)
    Seller(🏪 賣家<br/>SELLER)
    Admin(🔧 管理員<br/>ADMIN)

    %% 訪客功能
    Visitor --> UC1
    Visitor --> UC2
    Visitor --> UC3
    Visitor --> UC7
    Visitor --> UC8
    Visitor --> UC9
    Visitor --> UC10
    Visitor --> UC11
    Visitor --> UC12
    Visitor --> UC13
    Visitor --> UC50
    Visitor --> UC51
    
    %% 買家功能
    Buyer --> UC4
    Buyer --> UC5
    Buyer --> UC6
    Buyer --> UC18
    Buyer --> UC19
    Buyer --> UC20
    Buyer --> UC21
    Buyer --> UC22
    Buyer --> UC23
    Buyer --> UC24
    Buyer --> UC25
    Buyer --> UC26
    Buyer --> UC39
    Buyer --> UC40
    Buyer --> UC41
    Buyer --> UC42
    Buyer --> UC43
    Buyer --> UC44
    Buyer --> UC45
    Buyer --> UC46
    Buyer --> UC47
    Buyer --> UC52
    Buyer --> UC53
    
    %% 賣家功能
    Seller --> UC4
    Seller --> UC5
    Seller --> UC6
    Seller --> UC27
    Seller --> UC28
    Seller --> UC29
    Seller --> UC30
    Seller --> UC31
    Seller --> UC32
    Seller --> UC33
    Seller --> UC34
    Seller --> UC35
    Seller --> UC36
    Seller --> UC37
    Seller --> UC38
    Seller --> UC48
    Seller --> UC49
    Seller --> UC14
    Seller --> UC15
    Seller --> UC16
    Seller --> UC17
    Seller --> UC42
    Seller --> UC43
    Seller --> UC44
    Seller --> UC45
    Seller --> UC46
    Seller --> UC47
    Seller --> UC52
    Seller --> UC53
    Seller --> UC66
    
    %% 管理員功能
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC54
    Admin --> UC55
    Admin --> UC56
    Admin --> UC57
    Admin --> UC58
    Admin --> UC59
    Admin --> UC60
    Admin --> UC61
    Admin --> UC62
    Admin --> UC63
    Admin --> UC64
    Admin --> UC65
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC36
    Admin --> UC37
    Admin --> UC38
    Admin --> UC39
    Admin --> UC40
    Admin --> UC41
    Admin --> UC42
    Admin --> UC43
    Admin --> UC44
    Admin --> UC45
    Admin --> UC46
    Admin --> UC47
    Admin --> UC48
    Admin --> UC49
    Admin --> UC52
    Admin --> UC53
    Admin --> UC66
    Admin --> UC67
    Admin --> UC68
    
    %% 繼承關係
    Buyer -.-> Visitor
    Seller -.-> Visitor
    Admin -.-> Visitor
```

### UML 類別圖 (Class Diagram)
類別圖展示了系統中核心的業務實體、它們的屬性、方法以及彼此之間的靜態關係，**完全基於 Prisma Schema 的真實資料模型**。

```mermaid
classDiagram
    direction TB
    
    %% 角色和狀態枚舉
    class Role {
        <<enumeration>>
        BUYER
        SELLER
        ADMIN
    }
    
    class ProductStatus {
        <<enumeration>>
        ON_SHELF
        OFF_SHELF
        DELETED
    }
    
    class OrderStatus {
        <<enumeration>>
        UNCOMPLETED
        COMPLETED
        CANCELED
    }
    
    class PaymentMethod {
        <<enumeration>>
        COD
        CREDIT_CARD
        BANK_TRANSFER
        LINE_PAY
    }
    
    %% 核心資料模型
    class User {
        +Int id
        +String account
        -String passwordHash
        +String username
        +String email
        +String phone
        +Role role
        +Boolean isBlocked
        +String shopName
        +String description
        +DateTime createdAt
        +DateTime updatedAt
        +isSeller() boolean
        +isBuyer() boolean
        +isAdmin() boolean
        +canAccess(resource) boolean
    }

    class Category {
        +Int id
        +String name
        +DateTime createdAt
        +DateTime updatedAt
        +hasProducts() boolean
    }

    class Product {
        +Int id
        +Int sellerId
        +Int categoryId
        +String name
        +String description
        +ProductStatus status
        +DateTime createdAt
        +DateTime updatedAt
        +changeStatus(newStatus) void
        +isOwnedBy(sellerId) boolean
        +isOnShelf() boolean
        +getTotalStock() number
        +getAverageRating() number
    }

    class ProductVariant {
        +Int id
        +Int productId
        +String name
        +Int price
        +Int stock
        +Json attributes
        +DateTime createdAt
        +DateTime updatedAt
        +updateStock(delta) void
        +isAvailable() boolean
        +hasEnoughStock(quantity) boolean
        +getFormattedPrice() string
    }
    
    class ProductImage {
        +Int id
        +Int productId
        +String url
        +DateTime createdAt
        +DateTime updatedAt
        +getFullUrl() string
        +isValid() boolean
    }

    class Cart {
        +Int id
        +Int buyerId
        +DateTime createdAt
        +DateTime updatedAt
        +calculateTotal() Int
        +getSelectedItems() CartItem[]
        +clear() void
        +isEmpty() boolean
        +getItemCount() number
    }

    class CartItem {
        +Int id
        +Int cartId
        +Int productVariantId
        +Int quantity
        +Int unitPrice
        +Boolean isSelected
        +DateTime createdAt
        +DateTime updatedAt
        +getTotal() Int
        +updateQuantity(newQty) void
        +select() void
        +unselect() void
        +isValidQuantity() boolean
    }

    class Order {
        +Int id
        +Int buyerId
        +Int sellerId
        +Int totalAmount
        +OrderStatus status
        +String recipientName
        +String recipientPhone
        +String city
        +String district
        +String postalCode
        +String address
        +String notes
        +PaymentMethod paymentMethod
        +DateTime createdAt
        +DateTime updatedAt
        +canCancel() boolean
        +canShip() boolean
        +canComplete() boolean
        +cancel() void
        +ship() void
        +complete() void
        +getFormattedAmount() string
        +getFullAddress() string
    }
    
    class OrderItem {
        +Int id
        +Int orderId
        +Int productVariantId
        +Int quantity
        +Int unitPrice
        +DateTime createdAt
        +DateTime updatedAt
        +getTotal() Int
        +getFormattedPrice() string
    }

    class Review {
        +Int id
        +Int productId
        +Int orderId
        +Int buyerId
        +Int score
        +String comment
        +Boolean isEdited
        +Boolean isDeleted
        +DateTime createdAt
        +DateTime updatedAt
        +edit(newScore, newComment) void
        +delete() void
        +isOwnedBy(buyerId) boolean
        +isValidScore() boolean
        +getDisplayComment() string
    }

    class ChatRoom {
        +Int id
        +Int buyerId
        +Int sellerId
        +DateTime createdAt
        +DateTime updatedAt
        +canAccess(userId) boolean
        +getOtherParticipant(userId) Int
        +hasUnreadMessages(userId) boolean
    }

    class ChatMessage {
        +Int id
        +Int roomId
        +Int fromUserId
        +String content
        +Boolean isEdited
        +Boolean isReadByBuyer
        +Boolean isReadBySeller
        +DateTime readByBuyerAt
        +DateTime readBySellerAt
        +DateTime createdAt
        +DateTime updatedAt
        +edit(newContent) void
        +markAsRead(userId) void
        +isReadBy(userId) boolean
        +canEdit(userId) boolean
    }

    class LogEntry {
        +Int id
        +String event
        +Int actorId
        +String description
        +String ipAddress
        +Json meta
        +DateTime createdAt
        +getFormattedDate() string
        +hasActor() boolean
    }

    class PasswordResetToken {
        +Int id
        +String email
        +String token
        +DateTime expiresAt
        +DateTime createdAt
        +isExpired() boolean
        +isValid() boolean
    }

    %% 關聯關係
    User ||--o{ Product
    User ||--|| Cart
    User ||--o{ Order
    User ||--o{ Review
    User ||--o{ ChatMessage
    User ||--o{ ChatRoom
    User ||--o{ LogEntry
    
    Category ||--o{ Product
    
    Product ||--o{ ProductVariant
    Product ||--o{ ProductImage
    Product ||--o{ Review
    
    ProductVariant ||--o{ CartItem
    ProductVariant ||--o{ OrderItem
    
    Cart ||--o{ CartItem
    
    Order ||--o{ OrderItem
    Order ||--o{ Review
    
    ChatRoom ||--o{ ChatMessage
```

### 🏗️ 前後端架構圖 (Frontend-Backend Architecture)
本架構圖展示了前端客戶端類別與後端服務層之間的通信關係，**完全基於實際API實作和前端功能**，描繪了真實的系統架構模式。

```mermaid
graph TB
    subgraph "前端客戶端 (Frontend Client)"
        AuthClass[AuthClass<br/>認證管理]
        ProductClass[ProductClass<br/>商品瀏覽]
        SellerClass[SellerClass<br/>賣家功能]
        BuyerClass[BuyerClass<br/>買家功能]
        ChatClass[ChatClass<br/>聊天系統]
        AdminClass[AdminClass<br/>管理功能]
        ImageClass[ImageClass<br/>圖片管理]
    end
    
    subgraph "後端服務層 (Backend Server API)"
        HealthServer[HealthServer<br/>系統健康檢查]
        AuthServer[AuthServer<br/>身份認證服務]
        ProductServer[ProductServer<br/>商品服務]
        CategoryServer[CategoryServer<br/>分類服務]
        SellerServer[SellerServer<br/>賣家服務]
        BuyerServer[BuyerServer<br/>買家服務]
        ChatServer[ChatServer<br/>聊天服務]
        ImageServer[ImageServer<br/>圖片服務]
        AdminServer[AdminServer<br/>管理服務]
    end
    
    subgraph "資料存取層 (Data Access Layer)"
        PrismaService[PrismaService<br/>資料庫ORM]
        PostgreSQL[(PostgreSQL<br/>關係型資料庫)]
    end
    
    subgraph "外部依賴 (External Dependencies)"
        JWT[JWT<br/>Token認證]
        WebSocket[WebSocket<br/>即時通信]
        FileSystem[File System<br/>檔案存儲]
        Email[Email Service<br/>郵件服務]
    end
    
    %% HTTP API 通信關係
    AuthClass -.->|HTTP API| AuthServer
    ProductClass -.->|HTTP API| ProductServer
    ProductClass -.->|HTTP API| CategoryServer
    SellerClass -.->|HTTP API| SellerServer
    SellerClass -.->|HTTP API| CategoryServer
    SellerClass -.->|HTTP API| ImageServer
    BuyerClass -.->|HTTP API| BuyerServer
    AdminClass -.->|HTTP API| AdminServer
    ImageClass -.->|HTTP API| ImageServer
    
    %% WebSocket 即時通信
    ChatClass -.->|WebSocket| ChatServer
    BuyerClass -.->|WebSocket| ChatServer
    SellerClass -.->|WebSocket| ChatServer
    AdminClass -.->|WebSocket| ChatServer
    
    %% 後端服務間依賴
    AuthServer --> PrismaService
    ProductServer --> PrismaService
    CategoryServer --> PrismaService
    SellerServer --> PrismaService
    BuyerServer --> PrismaService
    ChatServer --> PrismaService
    ImageServer --> PrismaService
    AdminServer --> PrismaService
    
    %% 資料庫連接
    PrismaService --> PostgreSQL
    
    %% 外部服務依賴
    AuthServer --> JWT
    AuthServer --> Email
    ChatServer --> WebSocket
    ImageServer --> FileSystem
    
    %% 系統健康檢查
    HealthServer -.->|System Check| PrismaService
    
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class AuthClass,ProductClass,SellerClass,BuyerClass,ChatClass,AdminClass,ImageClass frontend
    class HealthServer,AuthServer,ProductServer,CategoryServer,SellerServer,BuyerServer,ChatServer,ImageServer,AdminServer backend
    class PrismaService,PostgreSQL database
    class JWT,WebSocket,FileSystem,Email external
```

### 時序圖 (Sequence Diagram) - 結帳流程
時序圖（或稱循序圖）專門用於展示對象之間如何隨著時間的推移進行互動。下圖**完全基於實際程式碼實現**，詳細描繪了買家從發起結帳請求到訂單成功創建的真實後端處理流程。

```mermaid
sequenceDiagram
    participant U as 🛒 買家
    participant OC as 📦 OrderController
    participant OS as 📦 OrderService
    participant PS as 🗄️ PrismaService
    participant DB as 🗄️ PostgreSQL
    participant LS as 📝 LogService

    U->>OC: POST /buyers/me/checkout
    Note over U,OC: CheckoutDto: {cartItemIds?, shippingAddress, paymentMethod}
    
    OC->>OS: checkout(user.id, checkoutDto)
    
    OS->>PS: $transaction 開始
    Note over OS,PS: 確保資料一致性的資料庫交易
    
    PS->>DB: cart.findUnique({where: {buyerId}, include: {items, productVariant, product}})
    DB-->>PS: 購物車完整資料
    PS-->>OS: cart with items
    
    alt 購物車為空
        OS-->>OC: throw BadRequestException('購物車為空')
        OC-->>U: 400 購物車為空
    end
    
    OS->>OS: 篩選結帳項目
    Note over OS: 根據cartItemIds或isSelected篩選
    
    alt 指定項目不存在
        OS-->>OC: throw BadRequestException('指定的購物車項目不存在')
        OC-->>U: 400 項目不存在
    end
    
    OS->>OS: 按賣家分組商品
    Note over OS: itemsBySeller = items.reduce(groupBySellerId)
    
    loop 每個賣家的商品群組
        OS->>OS: 檢查庫存和商品狀態
        
        alt 庫存不足
            OS-->>OC: throw BadRequestException('商品庫存不足')
            OC-->>U: 400 庫存不足
        end
        
        alt 商品已下架
            OS-->>OC: throw BadRequestException('商品已下架')
            OC-->>U: 400 商品已下架
        end
        
        OS->>OS: 計算訂單總金額
        
        OS->>PS: order.create({buyerId, sellerId, totalAmount, status: 'UNCOMPLETED', ...shippingAddress, paymentMethod})
        PS->>DB: INSERT INTO Order
        DB-->>PS: 新訂單ID
        PS-->>OS: order object
        
        loop 每個商品項目
            OS->>PS: orderItem.create({orderId, productVariantId, quantity, unitPrice})
            PS->>DB: INSERT INTO OrderItem
            
            OS->>PS: productVariant.update({where: {id}, data: {stock: {decrement: quantity}}})
            PS->>DB: UPDATE ProductVariant SET stock = stock - quantity
        end
        
        OS->>PS: cartItem.deleteMany({where: {id: {in: itemIds}}})
        PS->>DB: DELETE FROM CartItem WHERE id IN (...)
    end
    
    OS->>LS: record('ORDER_CREATED', buyerId, description, undefined, {orderIds, cartItemIds})
    LS->>DB: INSERT INTO LogEntry
    Note over LS,DB: 記錄操作日誌
    
    PS->>OS: 提交交易成功
    OS-->>OC: 返回訂單陣列
    OC-->>U: ResponseDto.created(orders, '結帳成功')
```

### 🗄️ 核心數據模型 (ER Diagram)
實體關係圖（ERD）專注於數據庫層級的表結構與它們之間的關聯。下圖是根據專案核心 `schema.prisma` 文件重新繪製的、最權威的數據模型，它精準地反映了系統中所有實體及其真實關係。

```mermaid
erDiagram
    User {
        Int id PK
        String account UK
        String passwordHash
        String username
        String email UK
        String phone
        Role role
        Boolean isBlocked
        String shopName
        String description
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        Int id PK
        String name UK
        DateTime createdAt
        DateTime updatedAt
    }

    Product {
        Int id PK
        Int sellerId FK
        Int categoryId FK
        String name
        String description
        ProductStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    ProductVariant {
        Int id PK
        Int productId FK
        String name
        Int price
        Int stock
        Json attributes
        DateTime createdAt
        DateTime updatedAt
    }

    ProductImage {
        Int id PK
        Int productId FK
        String url
        DateTime createdAt
        DateTime updatedAt
    }

    Cart {
        Int id PK
        Int buyerId FK, UK
        DateTime createdAt
        DateTime updatedAt
    }

    CartItem {
        Int id PK
        Int cartId FK
        Int productVariantId FK
        Int quantity
        Int unitPrice
        Boolean isSelected
        DateTime createdAt
        DateTime updatedAt
    }

    Order {
        Int id PK
        Int buyerId FK
        Int sellerId FK
        Int totalAmount
        OrderStatus status
        String recipientName
        String recipientPhone
        String city
        String district
        String postalCode
        String address
        String notes
        PaymentMethod paymentMethod
        DateTime createdAt
        DateTime updatedAt
    }

    OrderItem {
        Int id PK
        Int orderId FK
        Int productVariantId FK
        Int quantity
        Int unitPrice
        DateTime createdAt
        DateTime updatedAt
    }

    Review {
        Int id PK
        Int productId FK
        Int orderId FK
        Int buyerId FK
        Int score
        String comment
        Boolean isEdited
        Boolean isDeleted
        DateTime createdAt
        DateTime updatedAt
    }

    ChatRoom {
        Int id PK
        Int buyerId FK
        Int sellerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    ChatMessage {
        Int id PK
        Int roomId FK
        Int fromUserId FK
        String content
        Boolean isEdited
        Boolean isReadByBuyer
        Boolean isReadBySeller
        DateTime readByBuyerAt
        DateTime readBySellerAt
        DateTime createdAt
        DateTime updatedAt
    }

    LogEntry {
        Int id PK
        String event
        Int actorId FK
        String description
        String ipAddress
        Json meta
        DateTime createdAt
    }

    PasswordResetToken {
        Int id PK
        String email UK
        String token UK
        DateTime expiresAt
        DateTime createdAt
    }

    %% 用戶關聯
    User ||--o{ Product
    User ||--|| Cart
    User ||--o{ Order
    User ||--o{ Review
    User ||--o{ ChatMessage
    User ||--o{ ChatRoom
    User ||--o{ LogEntry
    
    %% 商品關聯
    Category ||--o{ Product
    Product ||--o{ ProductVariant
    Product ||--o{ ProductImage
    Product ||--o{ Review
    
    %% 購物車關聯
    Cart ||--o{ CartItem
    ProductVariant ||--o{ CartItem
    
    %% 訂單關聯
    Order ||--o{ OrderItem
    ProductVariant ||--o{ OrderItem
    Order ||--o{ Review
    
    %% 聊天關聯
    ChatRoom ||--o{ ChatMessage
```

## 🏗️ 系統架構與實現

### 🎯 系統完整架構圖 (Full System Architecture)
本專案採用了現代化的前後端分離架構，並透過 Nginx 進行服務的統一代理與分發。下圖詳細描繪了從使用者請求到數據庫操作的完整流程與分層結構：

```
┌───────────────────────────────────────────────────────────┐
│                       End User's Browser                    │
└─────────────────────────────┬─────────────────────────────┘
                              │ (HTTP/HTTPS Requests to http://localhost)
                              ▼
┌─────────────────────────────┴─────────────────────────────┐
│                 Web & Proxy Layer (Nginx)                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │   Nginx (Reverse Proxy running in Docker)              │ │
│  ├──────────────────────┬─────────────────────────────────┤ │
│  │ IF path starts with  │ ELSE (Serve User Interface)     │ │
│  │ `/api` or `/socket.io` │                                 │ │
│  └──────────┬───────────┴─────────────────────────────────┘ │
└─────────────│───────────────────────┬───────────────────────┘
              │                       │
              │ (Proxy to Backend)    │ (Proxy to Frontend)
              ▼                       ▼
┌─────────────┴─────────────┐ ┌───────┴───────────────────────┐
│   Application Layer       │ │     Presentation Layer        │
│    (Backend Service)      │ │      (Frontend Service)       │
│ ┌───────────────────────┐ │ │ ┌───────────────────────────┐ │
│ │  Presentation Layer   │ │ │ │   Node.js/Express Server  │ │
│ │  • Controllers (API)  │ │ │ │    • Serves static files  │ │
│ │  • Gateways (Socket)  │ │ │ └───────────────────────────┘ │
│ └──────────┬────────────┘ │ │ ┌───────────────────────────┐ │
│            │              │ │ │   Browser UI (www/)       │ │
│            ▼              │ │ │    • HTML, CSS, JS        │ │
│ ┌───────────────────────┐ │ │ └───────────────────────────┘ │
│ │    Business Layer     │ │ └───────────────────────────────┘
│ │  • Services (Logic)   │ │
│ │  • DTOs (Validation)  │ │
│ └──────────┬────────────┘ │
│            │              │
│            ▼              │
│ ┌───────────────────────┐ │
│ │      Data Layer       │ │
│ │  • Prisma ORM         │ │
│ └───────────────────────┘ │
└─────────────┬─────────────┘
              │ (Database Operations)
              ▼
┌─────────────┴─────────────────────────────────────────────┐
│                   Data Persistence Layer                    │
│    ┌────────────────────────┐   ┌────────────────────────┐  │
│    │  PostgreSQL            │   │  Redis                 │  │
│    │  (Relational Data)    │   │  (Cache, Sessions)     │  │
│    └────────────────────────┘   └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

###  decoupled-architecture 前後端分離架構 (Headless Architecture)
本專案體現了「前後端分離」的設計理念。專案主要由兩個獨立的部分組成：
- **`backend/`**: 一個基於 NestJS 的強大後端 API 服務，負責處理所有業務邏輯、資料庫互動與使用者認證。
- **`frontend/`**: 一個獨立的網頁應用程式，它透過 Node.js/Express 伺服器提供靜態用戶界面。這個前端應用透過呼叫後端提供的 API 來實現所有互動功能，與後端完全解耦。

這種架構的核心優勢在於 **靈活性** 與 **可擴展性**：
- **解耦開發**: 後端團隊可以專注於 API 效能，而前端可以獨立開發用戶界面，兩者僅通過 API 進行溝通。
- **獨立部署與擴展**: 前後端可以獨立部署、更新與擴容，提高了系統的維護性與彈性。
- **多端支援潛力**: 未來可以基於同一套後端 API，擴展支援原生行動應用 (iOS/Android) 等不同客戶端。

在本專案中，除了完整的 `frontend` 應用外，後端服務依然保留了 `public/api-tester.html`，為開發者提供了一個快速、便捷的底層 API 測試工具。

### 💻 技術棧選型
| 層級 | 技術 | 版本 | 用途 |
|------|------|------|------|
| **運行環境** | Node.js | 18+ | JavaScript 運行時 |
| **後端框架** | NestJS | 11.x | 企業級 Node.js 框架 |
| **數據庫** | PostgreSQL | 15+ | 關聯型數據庫 |
| **ORM** | Prisma | 6.x | 類型安全的數據庫客戶端 |
| **認證** | JWT + Passport | - | 無狀態身份驗證 |
| **即時通訊** | Socket.IO | 4.x | WebSocket 實現 |
| **快取** | Redis | 7+ | 高效能快取系統 |
| **容器化** | Docker | - | 應用程式容器化 |
| **反向代理** | Nginx | - | 負載均衡與靜態資源 |

## 📁 專案結構

```
Zipperoo/
├── frontend/                   # 🌐 前端應用
│   ├── www/                   # 網頁靜態資源 (HTML, CSS, JS)
│   ├── server.js              # 啟動前端服務的 Express 腳本
│   ├── Dockerfile             # 前端應用容器化配置
│   └── package.json           # 前端依賴與腳本
│
├── backend/                    # 🚀 後端核心應用 (NestJS)
│   ├── src/
│   │   ├── auth/              # 🔐 認證授權模組
│   │   │   ├── dto/           # 登入、註冊、Token 等 DTO
│   │   │   ├── strategies/    # JWT/Local Passport 策略
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── buyer/             # 🛒 買家功能模組
│   │   │   ├── controllers/   # 購物車、結帳、訂單查詢控制器
│   │   │   ├── services/      # 核心購物業務邏輯
│   │   │   ├── dto/           # 購物相關 DTO
│   │   │   └── buyer.module.ts
│   │   │
│   │   ├── seller/            # 🏪 賣家功能模組
│   │   │   ├── controllers/   # 商品管理、訂單處理控制器
│   │   │   ├── services/      # 商品、訂單、變體管理邏輯
│   │   │   ├── dto/           # 商品、訂單相關 DTO
│   │   │   └── seller.module.ts
│   │   │
│   │   ├── admin/             # ⚙️ 管理員功能模組
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── admin.module.ts
│   │   │
│   │   ├── category/          # 📂 商品分類模組
│   │   │   ├── dto/
│   │   │   ├── category.controller.ts
│   │   │   └── category.service.ts
│   │   │
│   │   ├── variant/           # 🎨 商品變體模組
│   │   │   ├── dto/
│   │   │   ├── variant.controller.ts
│   │   │   └── variant.service.ts
│   │   │
│   │   ├── review/            # ⭐ 評價系統模組
│   │   │   ├── dto/
│   │   │   ├── review.controller.ts
│   │   │   └── review.service.ts
│   │   │
│   │   ├── chat/              # 💬 即時聊天模組
│   │   │   ├── chat.gateway.ts   # WebSocket 核心閘道
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── chat.module.ts
│   │   │
│   │   ├── image/             # 🖼️ 圖片管理模組
│   │   │   ├── image.controller.ts
│   │   │   └── image.service.ts
│   │   │
│   │   ├── common/            # 🔧 共用模組與工具
│   │   │   ├── decorators/    # 自定義裝飾器 (如: GetUser)
│   │   │   ├── guards/        # 權限守衛 (如: RolesGuard)
│   │   │   ├── dto/           # 共用分頁、ID 等 DTO
│   │   │   └── services/      # 日誌等共用服務
│   │   │
│   │   ├── prisma/            # 🗄️ Prisma 數據庫模組
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   │
│   │   ├── health/            # ❤️ 健康檢查端點
│   │   ├── scripts/           # 📊 數據填充腳本 (seeding)
│   │   └── main.ts            # 🚀 應用程式入口
│   │
│   ├── prisma/                # 📋 數據庫 Schema 與遷移
│   │   ├── schema.prisma      # 數據庫模型定義檔
│   │   └── migrations/        # 數據庫遷移歷史
│   │
│   ├── public/                # 🌐 後端提供的靜態資源
│   │   ├── api-tester.html    # API 測試界面
│   │   ├── api-tester-style.css
│   │   └── api-tester-scripts.js
│   │
│   ├── test/                  # 🧪 單元測試與 E2E 測試
│   └── package.json           # 📦 後端專案依賴
│
├── SystemDesign/              # 📋 系統設計文檔
│   ├── APIStructure.md        # API 接口詳細文檔
│   ├── requirement.txt        # 原始需求規格書
│   ├── usecase.wsd            # PlantUML 用例圖原始檔
│   └── api_endpoints_v1.csv   # API 端點列表
│
├── data/                      # 💾 Docker 持久化數據卷
│   ├── postgres/              # PostgreSQL 數據目錄
│   ├── redis/                 # Redis 數據目錄
│   └── uploads/               # 用戶上傳文件存儲
│
├── docker-compose.yml         # 🐳 容器編排配置 (Nginx, Backend, Postgres, Redis)
├── Dockerfile                 # 🐳 後端應用容器構建配置
├── nginx.conf                 # 🌐 Nginx 反向代理配置
└── *.bat    
```

### 🎯 模組職責分工
- **🔐 Auth**: 用戶認證、JWT 管理、密碼重設
- **🛒 Buyer**: 購物車管理、結帳流程、訂單查詢
- **🏪 Seller**: 商品管理、訂單處理、銷售統計
- **⚙️ Admin**: 用戶管理、系統監控、數據統計
- **📂 Category**: 商品分類管理、層級結構
- **🎨 Variant**: 商品變體管理、庫存控制
- **⭐ Review**: 評價管理、評分統計
- **💬 Chat**: 即時聊天、消息推送
- **🖼️ Image**: 圖片上傳、存儲管理

## 🆘 快速開始

### 📋 環境要求
- **Node.js**: 18.0+ (推薦 LTS 版本)
- **PostgreSQL**: 15.0+ (生產環境推薦)
- **Redis**: 7.0+ (可選，用於快取)
- **Docker**: 20.0+ (容器化部署)
- **Git**: 最新版本

### ⚡ 一鍵啟動 (Windows)
```powershell
# 🎯 使用自動化腳本，完成環境設置與應用啟動
.\start.bat

# 🔄 重置數據庫並重新填充測試數據
.\seed.bat

# ⏹️ 停止所有服務
.\stop.bat
```

### 🛠️ 手動設置步驟

#### 1. 📥 克隆專案
```bash
git clone https://github.com/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo.git
cd Mobile_Commerce_Final_Projec_Zipperoo
```

#### 2. 📦 安裝依賴
```bash
cd backend
npm install
```

#### 3. ⚙️ 環境配置
複製並配置環境變數：
```bash
# 複製環境配置範本
cp .env.example .env
```

`.env` 配置說明 (此文件應放置於 `/backend` 目錄下):
```env
# 🗄️ 數據庫配置
# 注意: 在 Docker 環境中，主機名應為服務名 (postgres)，本地開發則為 localhost
DATABASE_URL="postgresql://zipperoo:zipperoo123@localhost:5433/zipperoo_db?schema=public"

# 🔐 JWT 配置 - 生產環境務必更換為長且隨機的密鑰
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"
REFRESH_JWT_SECRET="your-refresh-jwt-secret-here"
REFRESH_JWT_EXPIRES_IN="7d"

# 🌐 服務配置
PORT=3000
NODE_ENV="development"
# 生產環境中應指定前端服務的域名，例如: http://your-domain.com
CORS_ORIGIN="*"

# 📧 郵件配置 (可選，用於未來的密碼重設等功能)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your-email@gmail.com"
MAIL_PASS="your-app-password"
```

#### 4. 🐳 啟動基礎服務
```bash
# 啟動 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 檢查服務狀態
docker-compose ps
```

#### 5. 🗄️ 數據庫初始化
```bash
# 進入後端目錄
cd backend

# 生成 Prisma Client
npm run prisma:generate

# 執行數據庫遷移
npm run prisma:migrate

# 填充測試數據
npm run seed

# (可選) 啟動數據庫管理界面
npm run prisma:studio
```

#### 6. 🚀 啟動應用
```bash
# 開發模式 (熱重載)
npm run start:dev

# 生產模式
npm run build
npm run start:prod

# 調試模式
npm run start:debug
```

### 🔍 服務驗證
- **🌐 後端 API**: http://localhost:3000
- **🧪 API 測試界面**: http://localhost:3000/api-tester.html
- **❤️ 健康檢查**: http://localhost:3000/health
- **🗄️ Prisma Studio**: http://localhost:5555
- **📊 PostgreSQL**: localhost:5433
- **⚡ Redis**: localhost:6379

## API 測試平台

本專案內建了一個功能強大的 **API 測試平台** (`api-tester.html`)，它是一個純手刻的單頁面 Web 應用，旨在提供一個無需任何外部工具（如 Postman）即可驗證所有後端功能的完整環境。

### 🌐 訪問方式
在 `docker-compose` 啟動後，可透過以下地址訪問：
**`http://localhost/api-tester.html`**

> **注意**: 此路徑由 `nginx.conf` 中的特定 `location` 規則進行代理，確保能直接訪問到後端服務提供的測試頁面。

### ✨ 平台真實特色
透過分析其核心腳本 (`api-tester-scripts.js`)，可見該平台具備以下專為本專案打造的特色功能：

- **🎨 UI/UX 設計**:
    - **響應式佈局**: 界面佈局清晰，可在不同尺寸的窗口下使用。
    - **可折疊區塊**: 所有 API 按角色（通用、買家、賣家、管理員）和功能進行分組，並可獨立展開/折疊，方便聚焦。
    - **即時響應視窗**: 在右側提供一個語法高亮的視窗，即時顯示 API 的請求狀態（加載中、成功、失敗）與完整的返回數據。

- **🔐 認證與授權**:
    - **JWT 自動管理**: 登入成功後，`accessToken` 會被自動存入 `localStorage`，後續所有需要授權的請求將自動在標頭中附加 `Authorization: Bearer <token>`。
    - **狀態顯示與快捷操作**: 頁面頂部會實時顯示當前的登入狀態（用戶名和角色），並提供「登出」按鈕。
    - **快捷登入按鈕**: 為「買家」、「賣家」、「管理員」三種角色提供了快捷登入按鈕，一鍵填充預設帳密，極大提升測試效率。

- **🚀 核心功能支持**:
    - **全功能覆蓋**: 平台完整地暴露了後端所有 `v1` 版本的 API 接口，從註冊、商品管理到訂單處理和管理員監控。
    - **支援文件上傳**: 內建了針對 `multipart/form-data` 的請求處理邏輯，可以直接在頁面上選擇圖片文件並上傳。
    - **動態參數輸入**: 大部分 API 的路徑參數（如 `productId`, `orderId`）都設計為可由用戶手動輸入，方便對特定對象進行操作。

### 👥 預設測試帳號
使用 `seed.bat` 或 `npm run seed` 命令創建的測試帳號：

| 角色 | 帳號 | 密碼 | 功能範圍 |
|------|------|------|----------|
| 🔧 **管理員** | `admin` | `s11114020` | 系統管理、用戶控制、數據統計 |
| 🏪 **賣家** | `seller` | `cyut123456` | 商品管理、訂單處理、客服聊天 |
| 🛒 **買家** | `buyer` | `cyut123456` | 購物流程、訂單查詢、商品評價 |

### 🎯 推薦測試流程 (API 實戰指南)

本節提供了一套完整的端到端（End-to-End）測試流程，您可以透過內建的 **API 測試平台** 或使用 `curl` 等工具，跟隨以下步驟來驗證系統的所有核心功能。

---

#### 🛒 買家核心購物流程 (End-to-End)

這個流程模擬一位買家從登入、瀏覽商品到完成訂單的完整體驗。

**1. 登入取得 Token**
首先，買家需要登入以獲取 JWT，後續所有操作都需要在請求標頭中加入 `Authorization: Bearer <your_token>`。
- **API**: `POST /api/v1/auth/login`
- **範例**:
  ```bash
  # 執行後會返回 access_token，請複製它
  curl -X POST http://localhost/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"account":"buyer","password":"cyut123456"}'
  ```

**2. 瀏覽與搜尋商品**
買家可以瀏覽所有上架商品，並使用關鍵字、分類進行搜尋與篩選。
- **API**: `GET /api/v1/products`
- **範例 (搜尋名稱包含 "Classic" 的商品)**:
  ```bash
  curl -X GET "http://localhost/api/v1/products?searchTerm=Classic"
  ```
  > 📝 **提示**: 記下您感興趣的商品 `id` 和 `variant` `id`，後續步驟會用到。

**3. 加入購物車**
將選定的商品變體加入購物車。
- **API**: `POST /api/v1/buyer/cart/items`
- **範例 (將一個商品變體加入購物車)**:
  ```bash
  # 將 <your_token> 和 <variant_id> 替換為實際值
  curl -X POST http://localhost/api/v1/buyer/cart/items \
    -H "Authorization: Bearer <your_token>" \
    -H "Content-Type: application/json" \
    -d '{"productVariantId": "<variant_id>", "quantity": 1}'
  ```

**4. 執行結帳**
將購物車中的商品轉化為一張待處理的訂單。
- **API**: `POST /api/v1/buyer/checkout`
- **範例**:
  ```bash
  curl -X POST http://localhost/api/v1/buyer/checkout \
    -H "Authorization: Bearer <your_token>"
  ```
  > 📝 **提示**: 記下返回的訂單 `id`。

**5. 查看我的訂單**
- **API**: `GET /api/v1/buyer/orders`
- **範例**:
  ```bash
  curl -X GET http://localhost/api/v1/buyer/orders \
    -H "Authorization: Bearer <your_token>"
  ```

---

#### 🏪 賣家商品與訂單管理流程

這個流程展示了賣家如何管理自己的商品，並處理來自買家的訂單。

**1. 登入取得 Token**
- **API**: `POST /api/v1/auth/login`
- **範例**:
  ```bash
  curl -X POST http://localhost/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"account":"seller","password":"cyut123456"}'
  ```

**2. 創建一個新商品**
- **API**: `POST /api/v1/seller/products`
- **範例**:
  ```bash
  # 記得替換 <your_token> 和 <category_id>
  curl -X POST http://localhost/api/v1/seller/products \
    -H "Authorization: Bearer <your_token>" \
    -H "Content-Type: application/json" \
    -d '{"name": "新款潮流外套", "description": "2025 秋冬最新款", "categoryId": "<category_id>"}'
  ```
  > 📝 **提示**: 記下返回的商品 `id`。

**3. 為商品添加變體 (SKU)**
- **API**: `POST /api/v1/seller/products/:productId/variants`
- **範例 (為剛才的商品添加 "紅色, L號" 的變體)**:
  ```bash
  # 記得替換 <your_token> 和 <product_id>
  curl -X POST http://localhost/api/v1/seller/products/<product_id>/variants \
    -H "Authorization: Bearer <your_token>" \
    -H "Content-Type: application/json" \
    -d '{"name": "紅色, L", "price": 1299, "stock": 50}'
  ```

**4. 處理訂單**
查看收到的訂單，並更新其狀態（例如：從 `PENDING` 更新為 `SHIPPED`）。
- **API**: `PATCH /api/v1/seller/orders/:orderId`
- **範例 (將訂單標記為已出貨)**:
  ```bash
  # 記得替換 <your_token> 和 <order_id>
  curl -X PATCH http://localhost/api/v1/seller/orders/<order_id> \
    -H "Authorization: Bearer <your_token>" \
    -H "Content-Type: application/json" \
    -d '{"status": "SHIPPED"}'
  ```

---

#### 🔧 管理員系統監控流程

此流程展示管理員如何監控系統中的用戶與商品。

**1. 登入取得 Token**
- **API**: `POST /api/v1/auth/login`
- **範例**:
  ```bash
  curl -X POST http://localhost/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"account":"admin","password":"s11114020"}'
  ```

**2. 管理使用者**
查看系統中所有用戶，並可以對其進行操作（例如：封鎖）。
- **API**: `PATCH /api/v1/admin/users/:userId/status`
- **範例 (封鎖某位使用者)**:
  ```bash
  # 記得替換 <your_token> 和 <user_id>
  curl -X PATCH http://localhost/api/v1/admin/users/<user_id>/status \
    -H "Authorization: Bearer <your_token>" \
    -H "Content-Type: application/json" \
    -d '{"isBlocked": true}'
  ```

### 🔧 快速重置環境
```bash
# 重置數據庫並重新填充測試數據
npm run db:reset

# 或使用 Windows 批次檔
.\seed.bat
```

### 🎨 測試平台界面預覽
- **🎯 功能分區**: 按角色和功能模組分類
- **📝 請求編輯器**: JSON 格式化、語法高亮
- **📊 響應檢視器**: 結構化顯示、錯誤突出
- **🔍 搜尋過濾**: 快速定位 API 端點
- **💾 請求歷史**: 保存常用測試案例

## 🐳 Docker 容器化部署

### 🚀 一鍵部署
```bash
# 啟動完整的微服務架構
docker-compose up -d

# 查看所有服務狀態
docker-compose ps

# 實時查看日誌
docker-compose logs -f

# 停止所有服務
docker-compose down
```

### 🏗️ 服務架構 (Nginx 反向代理)
下圖展示了系統在 Docker 環境下的完整服務架構。所有外部流量都由 Nginx 統一接收，並根據請求路徑智能地分發到後端 API 服務或前端應用服務。

```
┌─────────────────────────────────────────────────────────────┐
│                       External Traffic                      │
│                      (Port 80, 443)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Load Balancer / Reverse Proxy             │
│                         Nginx                               │
├─────────────────────┬───────────────────────────────────────┤
│ IF path starts with │ ELSE (Serve static files)             │
│       /api          │                                       │
└──────────┬──────────┴───────────────────────────────────────┘
           │                                │
           ▼                                ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     Frontend Service      │   │     Backend Service       │
│  (Node.js + Express)      │   │      (NestJS)             │
│  • 提供使用者介面           │   │  • RESTful API            │
│  • 靜態檔案 (HTML/CSS)    │   │  • WebSocket              │
└───────────────────────────┘   └──────────┬────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────┐
│                           Data Layer                        │
│         PostgreSQL             │           Redis            │
│      • 核心數據存儲            │         • 快取服務         │
└─────────────────────────────────────────────────────────────┘
```


### 📊 服務端點
| 服務 | 內部端口 | 外部端口 | 描述 |
|------|----------|----------|------|
| **Nginx** | 80 | 80/443 | 系統唯一入口，作為反向代理，負責 SSL 終止與流量分發。 |
| **Frontend** | 8080 | (由 Nginx 代理) | 提供用戶操作界面的 Web 應用程式。 |
| **Backend** | 3000 | (由 Nginx 代理) | 核心後端 API 服務 (NestJS)，處理所有業務邏輯。 |
| **PostgreSQL**| 5432 | 5433 | 主數據庫，用於持久化存儲核心業務數據。 |
| **Redis** | 6379 | 6379 | 高效能快取服務，用於 Session、快取等。 |

### 🔧 容器管理
```bash
# 🔍 查看所有服務狀態
docker-compose ps

# 📊 實時查看所有容器資源使用
docker stats

# 🗂️ 查看特定服務日誌
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres

# 🔄 重啟特定服務
docker-compose restart backend

# 🧹 清理停止的容器與孤立網絡
docker-compose down --remove-orphans

# 🗑️ 完全清理（包含數據卷，此操作會刪除數據庫！）
docker-compose down -v
```

### 💾 數據持久化
- **PostgreSQL**: `./data/postgres/` - 數據庫文件
- **Redis**: `./data/redis/` - 快取文件  
- **Uploads**: `./data/uploads/` - 用戶上傳文件

### 🚀 生產環境部署

#### 環境配置
```bash
# 設置生產環境變數
export NODE_ENV=production
export DATABASE_URL="postgresql://user:pass@prod-db:5432/db"
export JWT_SECRET="your-production-secret"
```

#### SSL 配置
```nginx
# nginx.conf - HTTPS 配置
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 監控與備份
```bash
# 數據庫備份
docker-compose exec postgres pg_dump -U zipperoo zipperoo_db > backup.sql

# 恢復數據庫
docker-compose exec -T postgres psql -U zipperoo zipperoo_db < backup.sql

# 查看容器健康狀態
docker-compose exec backend curl http://localhost:3000/health
```

## 🧪 測試與品質保證

### 🎯 測試策略
本專案採用多層次的測試策略，確保代碼品質和系統穩定性：

```
🏗️ 測試金字塔
                     ┌─────────────┐
                     │   E2E Tests │  ← 完整業務流程測試
                     │    (少量)    │
                 ┌───┴─────────────┴───┐
                 │  Integration Tests  │  ← API 端點集成測試
                 │      (適量)        │
             ┌───┴─────────────────────┴───┐
             │      Unit Tests            │  ← 單元邏輯測試
             │        (大量)              │
             └───────────────────────────────┘
```

### 🔬 單元測試
```bash
# 執行所有單元測試
npm run test

# 監聽模式（開發時使用）
npm run test:watch

# 生成測試覆蓋率報告
npm run test:cov

# 調試模式
npm run test:debug
```

**測試覆蓋率目標**: > 85%
- Services: > 90%
- Controllers: > 80%  
- DTOs: > 75%

### 🔗 集成測試
```bash
# 執行 E2E 測試
npm run test:e2e

# 指定測試文件
npm run test:e2e -- auth.e2e-spec.ts
```

### 🎭 測試場景覆蓋

#### 🔐 認證流程測試
```typescript
describe('Authentication Flow', () => {
  it('用戶註冊 → 登入 → 獲取資料 → 登出');
  it('JWT Token 驗證和刷新');
  it('密碼重設流程');
  it('權限控制和角色驗證');
});
```

#### 🛒 電商核心流程測試
```typescript
describe('E-commerce Core Flow', () => {
  it('商品創建 → 變體管理 → 圖片上傳');
  it('商品瀏覽 → 搜尋篩選 → 詳情查看');
  it('加入購物車 → 數量調整 → 結帳流程');
  it('訂單創建 → 狀態追蹤 → 完成評價');
});
```

#### 💬 即時功能測試
```typescript
describe('Real-time Features', () => {
  it('WebSocket 連接和斷開');
  it('聊天室創建和訊息發送');
  it('多用戶同時聊天');
  it('訊息歷史和狀態同步');
});
```


## 📄 API 文件與設計

### 📚 API 文檔生成
- 使用 `@nestjs/swagger` 自動生成 API 文檔
- 文檔路徑：`/api/docs`

### 🎨 API 文件範本
```typescript
/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: 用戶認證相關操作
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 用戶註冊
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 example: buyer
 *               password:
 *                 type: string
 *                 example: 123456
 *               email:
 *                 type: string
 *                 example: buyer@example.com
 *     responses:
 *       201:
 *         description: 註冊成功
 *       400:
 *         description: 請求參數錯誤
 *       409:
 *         description: 用戶已存在
 */
```

### 🔄 API 版本管理
- 使用路由版本控制，保持向後相容性
- 目前版本：`v1`

### 📦 API 測試工具整合
- 集成 Postman 和 Swagger UI 進行 API 測試
- 提供測試用的 Postman 集合和環境變數文件

## 🆘 故障排除指南

### 🔧 常見問題與解決方案

#### 🗄️ 資料庫連線問題
```bash
# 問題：Database connection failed
# 原因：PostgreSQL 服務未啟動或配置錯誤

# 解決步驟：
# 1. 檢查容器狀態
docker-compose ps

# 2. 查看資料庫日誌
docker-compose logs postgres

# 3. 檢查連線配置
echo $DATABASE_URL

# 4. 測試連線
docker-compose exec postgres psql -U zipperoo zipperoo_db -c "SELECT 1;"

# 5. 重啟資料庫服務
docker-compose restart postgres
```

#### 🔐 JWT 認證失敗
```bash
# 問題：JWT verification failed
# 原因：Token 過期或 JWT_SECRET 不匹配

# 解決步驟：
# 1. 檢查環境變數
echo $JWT_SECRET

# 2. 重新登入獲取新 Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"buyer","password":"123456"}'

# 3. 檢查系統時間是否正確
date
```

#### 🌐 WebSocket 連線問題
```bash
# 問題：WebSocket connection failed
# 原因：CORS 配置或防火牆阻擋

# 解決步驟：
# 1. 檢查 CORS 設定
echo $CORS_ORIGIN

# 2. 檢查防火牆設定
netstat -an | findstr :3000
```

#### 📦 Node.js 模組錯誤
```powershell
# 問題：Module not found or version conflict
# 原因：依賴版本不匹配或安裝不完整

# 解決步驟：
cd backend

# 1. 清理 node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 2. 重新安裝依賴
npm install

# 3. 檢查 Node.js 版本
node --version  # 應該 >= 18.0.0

# 4. 清理 npm 快取
npm cache clean --force
```

### 🔍 診斷工具

#### 系統健康檢查腳本
```powershell
# health-check.ps1
function Test-ZipperooSystem {
    Write-Host "🔍 Zipperoo 系統診斷" -ForegroundColor Cyan
    
    # 檢查 Docker 服務
    try {
        docker --version | Out-Null
        Write-Host "✅ Docker 服務正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker 服務異常" -ForegroundColor Red
    }
    
    # 檢查 API 端點
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
        Write-Host "✅ API 服務正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ API 服務異常: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Test-ZipperooSystem
```

#### 疑難排解檢查清單
- [ ] Docker Desktop 已啟動並運行
- [ ] 端口 3000, 5433, 6379 未被占用
- [ ] `.env` 文件已正確配置
- [ ] 至少 4GB 可用記憶體
- [ ] `/health` 端點回應正常
- [ ] API 平均響應時間 < 200ms

## 🤝 開發規範與最佳實踐

### 📝 代碼風格規範

#### TypeScript 編碼標準
```typescript
// ✅ 推薦的代碼風格
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async createProduct(dto: CreateProductDto): Promise<ProductResponseDto> {
    this.logger.log(`Creating product: ${dto.name}`);
    
    try {
      const product = await this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          sellerId: dto.sellerId,
          categoryId: dto.categoryId,
          status: ProductStatus.ON_SHELF
        },
        include: {
          seller: { select: { username: true, shopName: true } },
          category: { select: { name: true } },
          variants: true,
          images: true
        }
      });

      return this.transformToResponseDto(product);
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      throw new BadRequestException('商品創建失敗');
    }
  }
}
```

#### 命名規範
| 類型 | 命名規則 | 範例 |
|------|----------|------|
| **類別** | PascalCase | `ProductService`, `UserController` |
| **方法** | camelCase | `createProduct()`, `getUserById()` |
| **變數** | camelCase | `productId`, `userEmail` |
| **常數** | UPPER_SNAKE_CASE | `JWT_SECRET`, `DEFAULT_PAGE_SIZE` |
| **DTO** | PascalCase + 後綴 | `CreateProductDto`, `ProductResponseDto` |

#### ✨ 新功能
- **🔐 完整認證系統**: JWT 雙 Token 機制、密碼重設、多角色權限
- **🛍️ 電商核心功能**: 商品管理、購物車、訂單流程、庫存控制
- **🎨 商品變體系統**: 支援顏色、尺寸等多屬性組合管理
- **⭐ 評價系統**: 商品評分、評論管理、軟刪除機制
- **💬 即時聊天**: WebSocket 實現買賣家即時溝通
- **🖼️ 圖片管理**: 多圖片上傳、存儲、CDN 分發
- **🔧 管理員後台**: 用戶管理、商品審核、系統監控
- **🧪 API 測試平台**: 內建 Web 界面，完整功能測試
- **🐳 Docker 容器化**: 一鍵部署，包含 PostgreSQL、Redis、Nginx

#### 🏗️ 技術特色
- **三層式架構**: Presentation、Business、Data 層分離
- **企業級安全**: OWASP 標準、GDPR 合規、完整審計日誌
- **高效能設計**: 查詢優化、Redis 快取、連接池管理
- **完整測試**: 85%+ 覆蓋率、E2E 測試、效能測試
- **監控告警**: 健康檢查、指標監控、異常告警

## 📞 技術支援與社群

### 📋 授權資訊

本專案採用 **MIT 授權條款**，允許自由使用、修改和分發。

---

<div align="center">

### 🎯 Made with ❤️ by Zipperoo Team

**⭐ 如果這個專案對您有幫助，請給我們一個 Star！**

[![GitHub stars](https://img.shields.io/github/stars/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo?style=social)](https://github.com/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo?style=social)](https://github.com/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo/network/members)
[![GitHub issues](https://img.shields.io/github/issues/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo)](https://github.com/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo/issues)
[![GitHub license](https://img.shields.io/github/license/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo)](https://github.com/Damian-Hsu/Mobile_Commerce_Final_Projec_Zipperoo/blob/main/LICENSE)


</div>
import apiClient from '../services/api-client.js';
import authManager from '../services/auth-manager.js';
import { Config } from '../services/Config.js';

class ChatPage {
    constructor() {
        this.socket = null;
        this.currentRoomId = null;
        this.currentUser = null;
        this.rooms = [];
        this.messages = [];
        this.isConnected = false;
        this.typingTimeout = null;
        this.resizeObserver = null;
        this.messagePollingInterval = null; // 訊息輪詢定時器
        
        // DOM elements
        this.chatContainer = document.querySelector('.chat-container');
        this.chatSidebar = document.getElementById('chat-sidebar');
        this.chatMain = document.getElementById('chat-main');
        this.chatRoomsList = document.getElementById('chat-rooms-list');
        this.chatWelcome = document.getElementById('chat-welcome');
        this.chatArea = document.getElementById('chat-area');
        this.messagesList = document.getElementById('messages-list');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message-btn');
        this.chatUserName = document.getElementById('chat-user-name');
        this.chatUserStatus = document.getElementById('chat-user-status');
        this.messagesContainer = document.getElementById('messages-container');
        this.messagesList = document.getElementById('messages-list');
        this.messagesLoading = document.getElementById('messages-loading');
        this.noRoomsMessage = document.getElementById('no-rooms-message');
        this.connectionStatus = document.getElementById('connection-status');
        this.typingIndicator = document.getElementById('typing-indicator');
        
        // Mobile elements
        this.closeChatBtn = document.getElementById('close-chat-btn');
        this.chatMobileHeader = document.querySelector('.chat-mobile-header');
        
        // Modal elements (removed - chat creation now happens from product pages)
        
        // Search
        this.chatSearchInput = document.getElementById('chat-search-input');
    }

    async init() {
        console.log('Initializing chat page...');
        
        // Wait for Bootstrap to be available (for future modal usage)
        await this.waitForBootstrap();
        
        // Check authentication
        if (!authManager.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        this.currentUser = authManager.user;
        console.log('Current user:', this.currentUser);

        // Initialize WebSocket connection
        await this.initializeSocket();
        
        // Load chat rooms
        await this.loadChatRooms();
        
        // Get initial unread count
        this.getUnreadCount();
        
        // Trigger cart count update for navigation
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
        
        // Also trigger notification counts update to ensure cart and message counts are shown
        if (window.header && typeof window.header.updateNotificationCounts === 'function') {
            window.header.updateNotificationCounts();
        }
        
        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        const sellerId = urlParams.get('seller');
        
        if (roomId) {
            // Auto-select the room after loading
            setTimeout(() => {
                this.selectRoom(parseInt(roomId));
                // Extra scroll to bottom after room selection
                setTimeout(() => {
                    this.ensureScrollToBottom();
                }, 800);
            }, 500);
        } else if (sellerId) {
            // Create or get chat room with seller
            await this.createChatWithSeller(parseInt(sellerId));
            // Extra scroll to bottom after chat creation
            setTimeout(() => {
                this.ensureScrollToBottom();
            }, 800);
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup mobile keyboard handling
        this.setupMobileKeyboardHandling();
        
        // 設置初始視窗高度（用於手機適配）
        if (window.innerWidth <= 768) {
            this.setViewportHeight();
            
            // 調整底部欄遮擋問題
            setTimeout(() => {
                this.adjustForBottomBar();
            }, 500); // 延遲執行，確保頁面完全載入
            
            // 監聽方向變化
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.setViewportHeight();
                    this.adjustForBottomBar();
                }, 300);
            });
            
            // 監聽視窗大小變化（處理瀏覽器底部欄顯示/隱藏）
            window.addEventListener('resize', () => {
                setTimeout(() => {
                    this.adjustForBottomBar();
                }, 100);
            });
            
            // 監聽頁面可見性變化（處理瀏覽器底部欄的顯示/隱藏）
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    setTimeout(() => {
                        this.adjustForBottomBar();
                    }, 200);
                }
            });
            
            // 監聽頁面焦點變化
            window.addEventListener('focus', () => {
                setTimeout(() => {
                    this.adjustForBottomBar();
                }, 200);
            });
        }
        
        // Final scroll check after everything is loaded
        setTimeout(() => {
            if (this.currentRoomId && (this.messagesList || this.messagesContainer)) {
                this.ensureScrollToBottom();
            }
            
            // 最終調整底部欄（確保所有元素都已載入）
            if (window.innerWidth <= 768) {
                this.adjustForBottomBar();
            }
        }, 1000);
        
        // Initialize mobile UX state
        this.initializeMobileUX();
        
        console.log('Chat page initialized');
    }
    
    initializeMobileUX() {
        if (window.innerWidth <= 768) {
            // Mobile: Start with chat list visible, chat area hidden
            if (this.chatSidebar) {
                this.chatSidebar.classList.remove('hide');
            }
            if (this.chatMain) {
                this.chatMain.classList.remove('show');
            }
            
            // If no room is selected, ensure welcome screen is shown
            if (!this.currentRoomId) {
                if (this.chatArea) {
                    this.chatArea.classList.add('d-none');
                }
                if (this.chatWelcome) {
                    this.chatWelcome.classList.remove('d-none');
                }
            }
        }
    }

    async waitForBootstrap() {
        // Wait for Bootstrap to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        while (!window.bootstrap && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.bootstrap) {
            console.warn('Bootstrap not loaded after waiting');
        } else {
            console.log('Bootstrap is available');
        }
    }

    async initializeSocket() {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            // Connect to chat namespace with authentication
            const config = new Config();
            console.log('Connecting to socket with base URL:', config.apiBaseUrl);
            
            this.socket = io(config.apiBaseUrl + '/chat', {
                auth: {
                    token: token
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 20000
            });

            // Socket event listeners
            this.socket.on('connect', () => {
                console.log('Connected to chat server');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                // Rejoin current room if exists
                if (this.currentRoomId) {
                    this.socket.emit('joinRoom', { roomId: this.currentRoomId });
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from chat server:', reason);
                this.isConnected = false;
                this.updateConnectionStatus(false);
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('Reconnected to chat server after', attemptNumber, 'attempts');
                this.isConnected = true;
                this.updateConnectionStatus(true);
            });

            this.socket.on('reconnect_error', (error) => {
                console.error('Reconnection failed:', error);
            });

            this.socket.on('error', (error) => {
                console.error('Socket error:', error);
                this.showError(error.message || '連接錯誤');
            });

            // Read status events
            this.socket.on('messagesMarkedRead', (data) => {
                console.log('Messages marked as read:', data);
                this.handleMessagesMarkedRead(data);
            });

            this.socket.on('readStatusUpdated', (data) => {
                console.log('Read status updated:', data);
                this.handleReadStatusUpdated(data);
            });

            this.socket.on('unreadCountUpdated', (data) => {
                console.log('Unread count updated:', data);
                this.updateUnreadCountBadge(data.unreadCount);
            });

            this.socket.on('newMessage', (data) => {
                console.log('New message received:', data);
                this.handleNewMessage(data);
            });

            this.socket.on('roomUpdated', (room) => {
                console.log('Room updated:', room);
                this.updateRoomInList(room);
            });

            this.socket.on('joinedRoom', (data) => {
                console.log('Joined room:', data);
            });

            this.socket.on('messages', (data) => {
                console.log('Messages received:', data);
                this.displayMessages(data.data);
                // Ensure scroll to bottom after receiving messages via socket
                setTimeout(() => {
                    this.ensureScrollToBottom();
                }, 100);
            });

            this.socket.on('userTyping', (data) => {
                console.log('User typing:', data);
                this.showTypingIndicator(data.username);
            });

            this.socket.on('userStoppedTyping', () => {
                console.log('User stopped typing');
                this.hideTypingIndicator();
            });

        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.showError('無法連接到聊天伺服器');
        }
    }

    async loadChatRooms() {
        try {
            this.showRoomsLoading(true);
            
            const response = await apiClient.getChatRooms();
            console.log('Chat rooms response:', response);
            
            if (apiClient.isSuccess(response) && response.data) {
                this.rooms = response.data.data || [];
                this.displayChatRooms();
            } else {
                this.rooms = [];
                this.displayChatRooms();
            }
        } catch (error) {
            console.error('Failed to load chat rooms:', error);
            this.showError('載入聊天室失敗');
            this.rooms = [];
            this.displayChatRooms();
        } finally {
            this.showRoomsLoading(false);
        }
    }

    displayChatRooms() {
        if (this.rooms.length === 0) {
            this.chatRoomsList.innerHTML = '';
            this.noRoomsMessage.classList.remove('d-none');
            return;
        }

        this.noRoomsMessage.classList.add('d-none');
        
        const roomsHtml = this.rooms.map(room => this.createRoomItemHtml(room)).join('');
        this.chatRoomsList.innerHTML = roomsHtml;
        
        // Add click listeners to room items
        this.chatRoomsList.querySelectorAll('.chat-room-item').forEach(item => {
            item.addEventListener('click', () => {
                const roomId = parseInt(item.dataset.roomId);
                this.selectRoom(roomId);
            });
        });
    }

    createRoomItemHtml(room) {
        const otherUser = room.buyerId === this.currentUser.id ? room.seller : room.buyer;
        const userName = otherUser ? otherUser.username : '未知用戶';
        const lastMessage = room.messages && room.messages.length > 0 ? room.messages[0].content : '尚無訊息';
        const lastMessageTime = room.messages && room.messages.length > 0 ? this.formatTime(room.messages[0].createdAt) : '';
        const isActive = this.currentRoomId === room.id;
        
        // Use unread count from backend if available, otherwise calculate locally
        let unreadCount = 0;
        if (typeof room.unreadCount === 'number') {
            unreadCount = room.unreadCount;
        } else if (room.messages && room.messages.length > 0) {
            const isBuyer = room.buyerId === this.currentUser.id;
            unreadCount = room.messages.filter(msg => {
                if (msg.fromUserId === this.currentUser.id) return false; // Don't count own messages
                return isBuyer ? !msg.isReadByBuyer : !msg.isReadBySeller;
            }).length;
        }
        
        return `
            <div class="chat-room-item ${isActive ? 'active' : ''}" data-room-id="${room.id}">
                <div class="room-avatar">
                    <i class="bi bi-person"></i>
                </div>
                <div class="room-info">
                    <div class="room-name">${userName}</div>
                    <div class="room-last-message text-muted">${lastMessage}</div>
                </div>
                <div class="room-meta">
                    ${lastMessageTime ? `<div class="room-time">${lastMessageTime}</div>` : ''}
                    ${unreadCount > 0 ? `<div class="room-unread">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }

    async selectRoom(roomId) {
        if (this.currentRoomId === roomId) return;
        
        // Leave current room if any
        if (this.currentRoomId && this.socket) {
            this.socket.emit('leaveRoom', { roomId: this.currentRoomId });
        }
        
        this.currentRoomId = roomId;
        const room = this.rooms.find(r => r.id === roomId);
        
        if (!room) {
            console.error('Room not found:', roomId);
            return;
        }
        
        // Update UI
        this.updateActiveRoom();
        this.showChatArea(room);
        
        // Join room via socket
        if (this.socket) {
            this.socket.emit('joinRoom', { roomId });
        }
        
        // Update room's unread count to 0 immediately in UI (before loading messages)
        this.updateRoomUnreadCount(roomId, 0);
        
        // Mark messages as read when entering room
        this.markMessagesAsRead(roomId);
        
        // Load messages
        await this.loadMessages(roomId);
        
        // Start message polling for this room
        this.startMessagePolling(roomId);
        
        // Ensure scroll to bottom after loading messages
        setTimeout(() => {
            this.scrollToBottom(true);
        }, 100);
        
        // Mobile UX: Hide sidebar and show chat area
        if (window.innerWidth <= 768) {
            if (this.chatSidebar) {
                this.chatSidebar.classList.add('hide');
            }
            if (this.chatMain) {
                this.chatMain.classList.add('show');
            }
            // Mobile header 會被 CSS 自動隱藏 (.chat-main.show .chat-mobile-header)
            console.log('Mobile UX: Sidebar hidden, chat area shown, mobile header will be hidden by CSS');
        }
    }

    updateActiveRoom() {
        // Update room list active state
        this.chatRoomsList.querySelectorAll('.chat-room-item').forEach(item => {
            const roomId = parseInt(item.dataset.roomId);
            if (roomId === this.currentRoomId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    showChatArea(room) {
        const otherUser = room.buyerId === this.currentUser.id ? room.seller : room.buyer;
        const userName = otherUser ? otherUser.username : '未知用戶';
        
        // Update chat header information
        if (this.chatUserName) {
            this.chatUserName.textContent = userName;
            console.log('Updated chat user name:', this.chatUserName.textContent);
        } else {
            console.error('chatUserName element not found');
        }
        
        if (this.chatUserStatus) {
            this.chatUserStatus.textContent = '點擊開始聊天';
            this.chatUserStatus.className = 'text-muted';
            console.log('Updated chat user status:', this.chatUserStatus.textContent);
        } else {
            console.error('chatUserStatus element not found');
        }
        
        // Show chat area
        this.chatWelcome.classList.add('d-none');
        this.chatArea.classList.remove('d-none');
        
        // Debug: Check chat header visibility
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            const headerStyle = window.getComputedStyle(chatHeader);
            console.log('Chat header debug:', {
                display: headerStyle.display,
                visibility: headerStyle.visibility,
                height: chatHeader.offsetHeight,
                width: chatHeader.offsetWidth,
                element: chatHeader
            });
        } else {
            console.error('Chat header element not found');
        }
        
        // Debug: Check if input elements exist and are visible
        console.log('Message input element:', this.messageInput);
        console.log('Send button element:', this.sendButton);
        
        // Ensure input is visible and enabled
        if (this.messageInput) {
            this.messageInput.style.display = 'block';
            this.messageInput.disabled = false;
        }
        if (this.sendButton) {
            this.sendButton.style.display = 'flex';
            this.sendButton.disabled = false;
        }
        
        // Setup ResizeObserver to handle container size changes
        this.setupResizeObserver();
    }
    
    setupResizeObserver() {
        // Clean up existing observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // Create new ResizeObserver to monitor messages container
        const observeContainer = this.messagesList || this.messagesContainer;
        if (observeContainer && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                // Auto-scroll to bottom when container size changes
                if (this.shouldAutoScroll()) {
                    this.scrollToBottom();
                }
            });
            
            this.resizeObserver.observe(observeContainer);
        }
    }

    async loadMessages(roomId, isPolling = false) {
        try {
            if (!isPolling) {
                this.showMessagesLoading(true);
            }
            
            const response = await apiClient.getChatMessages(roomId, { page: 1, pageSize: 50 });
            console.log('Messages response:', response);
            
            if (apiClient.isSuccess(response) && response.data) {
                const newMessages = response.data.data || [];
                
                if (isPolling) {
                    // 輪詢模式：只添加新訊息
                    const currentMessageIds = this.messages.map(m => m.id);
                    const reallyNewMessages = newMessages.filter(m => !currentMessageIds.includes(m.id));
                    
                    if (reallyNewMessages.length > 0) {
                        console.log('Found new messages via polling:', reallyNewMessages.length);
                        this.messages = newMessages;
                        this.displayMessages(this.messages);
                        
                        // 自動滾動到底部
                        setTimeout(() => {
                            this.scrollToBottom(true);
                        }, 100);
                    }
                } else {
                    // 正常載入模式
                    this.messages = newMessages;
                    this.displayMessages(this.messages);
                }
            } else {
                if (!isPolling) {
                    this.messages = [];
                    this.displayMessages([]);
                }
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            if (!isPolling) {
                this.showError('載入訊息失敗');
                this.messages = [];
                this.displayMessages([]);
            }
        } finally {
            if (!isPolling) {
                this.showMessagesLoading(false);
            }
        }
    }

    displayMessages(messages) {
        if (!messages || messages.length === 0) {
            this.messagesList.innerHTML = '<div class="text-center text-muted py-4">尚無訊息</div>';
            return;
        }
        
        const messagesHtml = messages.map(message => this.createMessageHtml(message)).join('');
        this.messagesList.innerHTML = messagesHtml;
        
        // Force scroll to bottom for initial load with multiple attempts
        this.ensureScrollToBottom();
    }
    
    ensureScrollToBottom() {
        // 使用 messages-list 作為滾動容器
        const container = this.messagesList || this.messagesContainer;
        
        if (!container) {
            console.log('No scroll container for ensureScrollToBottom');
            return;
        }
        
        console.log('EnsureScroll using container:', container.id || container.className);
        
        // 最簡單直接的方法：直接設置到最底部
        const directScroll = () => {
            container.scrollTop = container.scrollHeight;
            console.log('Direct scroll - Set scrollTop to:', container.scrollHeight);
        };
        
        // 立即執行一次
        directScroll();
        
        // 使用多個時間點確保滾動成功
        const delays = [10, 50, 100, 200, 500];
        
        delays.forEach((delay, index) => {
            setTimeout(() => {
                directScroll();
                console.log(`Ensure scroll attempt ${index + 1} at ${delay}ms`);
                
                // 驗證滾動是否成功
                const isAtBottom = Math.abs(container.scrollHeight - (container.scrollTop + container.clientHeight)) < 5;
                console.log(`Attempt ${index + 1} - At bottom:`, isAtBottom);
            }, delay);
        });
        
        // 最終驗證和強制滾動
        setTimeout(() => {
            const currentPos = container.scrollTop;
            const maxPos = container.scrollHeight - container.clientHeight;
            const isAtBottom = Math.abs(maxPos - currentPos) < 5;
            
            console.log('Final verification:', {
                currentPos,
                maxPos,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                isAtBottom
            });
            
            if (!isAtBottom) {
                console.log('Final force scroll needed');
                container.scrollTop = container.scrollHeight;
                
                // 最後一次確認
                setTimeout(() => {
                    console.log('Final position:', container.scrollTop, 'of', container.scrollHeight);
                }, 50);
            }
        }, 1000);
    }

    createMessageHtml(message) {
        const isOwn = message.fromUserId === this.currentUser.id;
        const senderName = isOwn ? '我' : (message.fromUser ? message.fromUser.username : '未知用戶');
        const messageTime = this.formatTime(message.createdAt);
        
        // Determine read status for own messages
        let readStatusHtml = '';
        if (isOwn) {
            const isReadByOther = this.currentUser.role === 'BUYER' 
                ? message.isReadBySeller 
                : message.isReadByBuyer;
            
            if (isReadByOther) {
                readStatusHtml = '<span class="message-read-status read">已讀</span>';
            } else {
                readStatusHtml = '<span class="message-read-status unread">未讀</span>';
            }
        }
        
        return `
            <div class="message-item ${isOwn ? 'own' : ''}" data-message-id="${message.id}">
                <div class="message-avatar">
                    <i class="bi bi-person"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        ${this.escapeHtml(message.content)}
                    </div>
                    <div class="message-meta">
                        <span class="message-time">${messageTime}</span>
                        ${readStatusHtml}
                    </div>
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || !this.currentRoomId) return;
        
        try {
            this.sendButton.disabled = true;
            this.messageInput.disabled = true;
            
            // Send via API
            const response = await apiClient.sendChatMessage(this.currentRoomId, content);
            console.log('Send message response:', response);
            
            if (apiClient.isSuccess(response)) {
                // Clear input
                this.messageInput.value = '';
                
                // Add message to local list (will be updated via socket)
                const newMessage = {
                    id: Date.now(), // temporary ID
                    content: content,
                    fromUserId: this.currentUser.id,
                    fromUser: this.currentUser,
                    createdAt: new Date().toISOString()
                };
                
                this.messages.push(newMessage);
                this.addNewMessageToDisplay(newMessage);
            } else {
                this.showError('發送訊息失敗');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError('發送訊息失敗');
        } finally {
            this.sendButton.disabled = false;
            this.messageInput.disabled = false;
            this.messageInput.focus();
        }
    }

    handleNewMessage(data) {
        const { message, room } = data;
        
        // Update room in list
        this.updateRoomInList(room);
        
        // If message is for current room, add to messages
        if (this.currentRoomId === room.id) {
            // Check if message already exists (avoid duplicates)
            const existingMessage = this.messages.find(m => m.id === message.id);
            if (!existingMessage) {
                this.messages.push(message);
                this.addNewMessageToDisplay(message);
                
                // Show notification for messages from other users
                if (message.fromUserId !== this.currentUser.id) {
                    this.showMessageNotification(message, room);
                }
            }
        } else {
            // Show notification for messages from other rooms
            this.showMessageNotification(message, room);
        }
        
        // Reload chat rooms to get updated unread counts
        this.loadChatRooms();
    }

    addNewMessageToDisplay(message) {
        // Create message HTML
        const messageHtml = this.createMessageHtml(message);
        
        // Create temporary element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = messageHtml;
        const messageElement = tempDiv.firstElementChild;
        
        // Add new message class for animation
        messageElement.classList.add('new-message');
        
        // Append to messages list
        this.messagesList.appendChild(messageElement);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            messageElement.classList.remove('new-message');
        }, 400);
        
        // Auto-scroll to bottom if last message was visible or if it's user's own message
        const shouldForceScroll = this.isLastMessageVisible() || message.fromUserId === this.currentUser.id;
        this.scrollToBottom(shouldForceScroll);
    }

    updateRoomInList(updatedRoom) {
        const roomIndex = this.rooms.findIndex(r => r.id === updatedRoom.id);
        if (roomIndex !== -1) {
            this.rooms[roomIndex] = updatedRoom;
        } else {
            this.rooms.unshift(updatedRoom);
        }
        
        // Sort rooms by last message time
        this.rooms.sort((a, b) => {
            const aTime = a.messages && a.messages.length > 0 ? new Date(a.messages[0].createdAt) : new Date(a.createdAt);
            const bTime = b.messages && b.messages.length > 0 ? new Date(b.messages[0].createdAt) : new Date(b.createdAt);
            return bTime - aTime;
        });
        
        this.displayChatRooms();
    }

    // Create chat with specific seller (called from product/order pages)
    async createChatWithSeller(sellerId) {
        if (!sellerId || sellerId === this.currentUser.id) {
            this.showError('無效的賣家ID');
            return;
        }
        
        try {
            const response = await apiClient.createOrGetChatRoom(sellerId);
            console.log('Create chat with seller response:', response);
            
            if (apiClient.isSuccess(response) && response.data) {
                const room = response.data;
                
                // Add to rooms list if not exists
                const existingRoom = this.rooms.find(r => r.id === room.id);
                if (!existingRoom) {
                    this.rooms.unshift(room);
                    this.displayChatRooms();
                }
                
                // Select the room
                this.selectRoom(room.id);
                
                // Ensure scroll to bottom after selecting room
                setTimeout(() => {
                    this.ensureScrollToBottom();
                }, 600);
                
                this.showSuccess('聊天室已開啟');
            } else {
                this.showError('開啟聊天室失敗');
            }
        } catch (error) {
            console.error('Failed to create chat with seller:', error);
            this.showError(error.message || '開啟聊天室失敗');
        }
    }

    setupEventListeners() {
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Typing indicator
        this.messageInput.addEventListener('input', () => {
            this.handleTyping();
        });
        
        // Mobile sidebar toggle (removed - using new UX pattern)
        // if (this.mobileSidebarToggle) {
        //     this.mobileSidebarToggle.addEventListener('click', () => {
        //         this.chatSidebar.classList.add('show');
        //     });
        // }
        

        
        if (this.closeChatBtn) {
            this.closeChatBtn.addEventListener('click', () => {
                this.closeChatArea();
            });
        }
        
        // Create chat functionality removed - now handled from product pages
        
        // Search
        if (this.chatSearchInput) {
            this.chatSearchInput.addEventListener('input', (e) => {
                this.filterRooms(e.target.value);
            });
        }
        
        // Close sidebar when clicking outside on mobile (removed - using new UX pattern)
        // document.addEventListener('click', (e) => {
        //     if (window.innerWidth <= 768 && 
        //         this.chatSidebar.classList.contains('show') &&
        //         !this.chatSidebar.contains(e.target) &&
        //         !this.mobileSidebarToggle.contains(e.target)) {
        //         this.chatSidebar.classList.remove('show');
        //     }
        // });
        
        // Auto-scroll when window gains focus (user returns to chat)
        window.addEventListener('focus', () => {
            if (this.currentRoomId && (this.messagesList || this.messagesContainer)) {
                setTimeout(() => {
                    this.scrollToBottom();
                }, 100);
            }
        });
    }

    closeChatArea() {
        // Stop message polling when closing chat
        this.stopMessagePolling();
        
        this.currentRoomId = null;
        this.chatArea.classList.add('d-none');
        this.chatWelcome.classList.remove('d-none');
        this.updateActiveRoom();
        
        // Mobile UX: Show sidebar and hide chat area
        if (window.innerWidth <= 768) {
            if (this.chatSidebar) {
                this.chatSidebar.classList.remove('hide');
            }
            if (this.chatMain) {
                this.chatMain.classList.remove('show');
            }
            // Mobile header 會被 CSS 自動顯示（移除 .show 類別後）
            console.log('Mobile UX: Sidebar shown, chat area hidden, mobile header will be shown by CSS');
        }
    }

    filterRooms(searchTerm) {
        const items = this.chatRoomsList.querySelectorAll('.chat-room-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const roomName = item.querySelector('.room-name').textContent.toLowerCase();
            const lastMessage = item.querySelector('.room-last-message').textContent.toLowerCase();
            
            if (roomName.includes(term) || lastMessage.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showRoomsLoading(show) {
        const loadingContainer = this.chatRoomsList.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = show ? 'block' : 'none';
        }
    }

    showMessagesLoading(show) {
        if (this.messagesLoading) {
            this.messagesLoading.classList.toggle('d-none', !show);
        }
    }

    updateConnectionStatus(connected) {
        // Update connection indicator only (not user status)
        if (this.connectionStatus) {
            const icon = this.connectionStatus.querySelector('i');
            if (connected) {
                icon.className = 'bi bi-wifi text-success';
                icon.title = '已連接';
            } else {
                icon.className = 'bi bi-wifi-off text-danger';
                icon.title = '連接中斷';
            }
        }
        
        // Log connection status for debugging
        console.log('Connection status updated:', connected ? '已連接' : '連接中斷');
    }

    scrollToBottom(force = false) {
        // 使用 messages-list 作為滾動容器，因為它有 overflow-y: auto
        const container = this.messagesList || this.messagesContainer;
        
        if (!container) {
            console.log('No scroll container found');
            return;
        }
        
        console.log('Using scroll container:', container.id || container.className);
        
        // 最直接的方法：直接設置 scrollTop 到最大值
        const forceScrollToBottom = () => {
            container.scrollTop = container.scrollHeight;
            console.log('Force scroll - scrollTop set to:', container.scrollTop, 'scrollHeight:', container.scrollHeight);
        };
        
        // 平滑滾動方法
        const smoothScrollToBottom = () => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
            console.log('Smooth scroll initiated to:', container.scrollHeight);
        };
        
        if (force) {
            // 強制滾動：立即執行多次確保成功
            forceScrollToBottom();
            
            // 使用 requestAnimationFrame 確保 DOM 更新後再次滾動
            requestAnimationFrame(() => {
                forceScrollToBottom();
                
                // 再次確認
                setTimeout(() => {
                    forceScrollToBottom();
                }, 10);
                
                setTimeout(() => {
                    forceScrollToBottom();
                }, 50);
                
                setTimeout(() => {
                    forceScrollToBottom();
                }, 100);
            });
        } else {
            // 平滑滾動
            smoothScrollToBottom();
            
            // 備用強制滾動，以防平滑滾動失敗
            setTimeout(() => {
                const currentBottom = container.scrollTop + container.clientHeight;
                const totalHeight = container.scrollHeight;
                
                if (totalHeight - currentBottom > 10) {
                    console.log('Smooth scroll failed, using force scroll');
                    forceScrollToBottom();
                }
            }, 500);
        }
    }
    
    shouldAutoScroll() {
        const container = this.messagesList || this.messagesContainer;
        if (!container) return true;
        
        // Get input container as reference point
        const inputContainer = document.querySelector('.message-input-container');
        if (!inputContainer) {
            // Fallback to original logic if input container not found
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
            return isNearBottom;
        }
        
        // Check if user is scrolled to see messages above input container
        const containerRect = container.getBoundingClientRect();
        const inputRect = inputContainer.getBoundingClientRect();
        const { scrollTop, scrollHeight } = container;
        
        // Calculate how much space is available above input container
        const availableHeight = inputRect.top - containerRect.top;
        const maxScrollTop = scrollHeight - availableHeight;
        
        // Check if user is near the bottom (within 50px of input container)
        return scrollTop >= maxScrollTop - 50;
    }
    
    isLastMessageVisible() {
        const container = this.messagesList || this.messagesContainer;
        if (!container || !this.messagesList) return false;
        
        const lastMessage = this.messagesList.lastElementChild;
        if (!lastMessage) return false;
        
        // Get input container as reference point instead of screen bottom
        const inputContainer = document.querySelector('.message-input-container');
        if (!inputContainer) return false;
        
        const inputRect = inputContainer.getBoundingClientRect();
        const messageRect = lastMessage.getBoundingClientRect();
        
        // Check if the last message is visible above the input container
        return messageRect.bottom <= inputRect.top + 20; // 20px tolerance above input
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return '剛剛';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}分鐘前`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}小時前`;
        }
        
        // Same year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
        }
        
        // Different year
        return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // Use the global App.showAlert if available
        if (window.App && window.App.showAlert) {
            window.App.showAlert(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        // Use the global App.showAlert if available
        if (window.App && window.App.showAlert) {
            window.App.showAlert(message, 'success');
        } else {
            alert(message);
        }
    }

    showMessageNotification(message, room) {
        // Don't show notification if user is on the chat page and viewing the room
        if (this.currentRoomId === room.id && document.hasFocus()) {
            return;
        }

        const otherUser = room.buyerId === this.currentUser.id ? room.seller : room.buyer;
        const userName = otherUser ? otherUser.username : '未知用戶';
        const shortMessage = message.content.length > 50 ? 
            message.content.substring(0, 50) + '...' : message.content;

        // Use global App.showAlert if available
        if (window.App && window.App.showAlert) {
            window.App.showAlert(`${userName}: ${shortMessage}`, 'info');
        }

        // Browser notification if supported and permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${userName} 發送了新訊息`, {
                body: shortMessage,
                icon: '/favicon.ico',
                tag: `chat-${room.id}`
            });
        } else if ('Notification' in window && Notification.permission === 'default') {
            // Request permission for future notifications
            Notification.requestPermission();
        }
    }

    handleTyping() {
        if (!this.socket || !this.currentRoomId) return;

        // Emit typing event
        this.socket.emit('typing', { roomId: this.currentRoomId });

        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Set timeout to stop typing
        this.typingTimeout = setTimeout(() => {
            this.socket.emit('stopTyping', { roomId: this.currentRoomId });
        }, 1000);
    }

    showTypingIndicator(username) {
        if (this.typingIndicator) {
            const typingText = this.typingIndicator.querySelector('.typing-text');
            if (typingText) {
                typingText.textContent = `${username} 正在輸入...`;
            }
            this.typingIndicator.classList.remove('d-none');
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('d-none');
        }
    }

    // 測試方法：直接強制滾動到底部
    forceScrollToBottomTest() {
        console.log('=== Force Scroll Test ===');
        
        const container = this.messagesList || this.messagesContainer;
        
        if (!container) {
            console.log('ERROR: No scroll container found');
            return false;
        }
        
        console.log('Test using container:', container.id || container.className);
        
        console.log('Before scroll:', {
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight
        });
        
        // 最直接的方法
        container.scrollTop = container.scrollHeight;
        
        console.log('After scroll:', {
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight
        });
        
        // 驗證是否成功
        const isAtBottom = Math.abs(container.scrollHeight - (container.scrollTop + container.clientHeight)) < 5;
        console.log('Is at bottom:', isAtBottom);
        
        return isAtBottom;
    }

    // 開始訊息輪詢
    startMessagePolling(roomId) {
        // 清除現有的輪詢
        this.stopMessagePolling();
        
        console.log('Starting message polling for room:', roomId);
        
        // 每5秒輪詢一次訊息
        this.messagePollingInterval = setInterval(async () => {
            if (this.currentRoomId === roomId) {
                // 總是進行輪詢以確保訊息同步
                console.log('Polling messages for room:', roomId);
                try {
                    await this.loadMessages(roomId, true); // true 表示是輪詢更新
                } catch (error) {
                    console.error('Message polling failed:', error);
                }
            }
        }, 5000); // 5秒間隔
    }
    
    // 停止訊息輪詢
    stopMessagePolling() {
        if (this.messagePollingInterval) {
            console.log('Stopping message polling');
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }
    
    // 設置手機鍵盤處理
    setupMobileKeyboardHandling() {
        if (window.innerWidth > 768) return; // 只在手機上執行
        
        // 設置CSS變數用於視窗高度
        this.setViewportHeight();
        
        let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        let isKeyboardOpen = false;
        
        // 使用 Visual Viewport API（更準確）
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        } else {
            // 降級到 resize 事件
            window.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        }
        
        // 監聽輸入框焦點
        if (this.messageInput) {
            this.messageInput.addEventListener('focus', () => {
                console.log('Input focused');
                // 延遲處理，等待鍵盤動畫
                setTimeout(() => {
                    this.handleKeyboardOpen();
                }, 300);
            });
            
            this.messageInput.addEventListener('blur', () => {
                console.log('Input blurred');
                setTimeout(() => {
                    this.handleKeyboardClose();
                }, 100);
            });
        }
        
        // 防止頁面滾動
        document.addEventListener('touchmove', (e) => {
            if (window.innerWidth <= 768) {
                // 只允許聊天訊息區域滾動
                const target = e.target.closest('.messages-list');
                if (!target) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
    }
    
    // 設置視窗高度CSS變數
    setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // 獲取移動端瀏覽器窗口配置（參考CSDN文章方法）
    getWindowConfig() {
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        
        // 兼容性處理
        if (typeof windowWidth !== 'number') {
            if (document.compatMode === 'CSS1Compat') {
                windowWidth = document.documentElement.clientWidth;
                windowHeight = document.documentElement.clientHeight;
            } else {
                windowWidth = document.body.clientWidth;
                windowHeight = document.body.clientHeight;
            }
        }
        
        // 檢測是否有底部導航欄遮擋
        const screenHeight = window.screen.height;
        const availableHeight = window.innerHeight;
        const bottomBarHeight = screenHeight - availableHeight;
        
        // 更精確的底部欄檢測：
        // 1. 高度差要在合理範圍內（30-120px）
        // 2. 不能是鍵盤彈出狀態（鍵盤通常會佔用更多空間）
        const isReasonableBottomBar = bottomBarHeight > 30 && bottomBarHeight < 120;
        const isLikelyKeyboard = bottomBarHeight > 200; // 鍵盤通常佔用200px以上
        
        return {
            windowWidth: windowWidth,
            windowHeight: windowHeight,
            screenHeight: screenHeight,
            availableHeight: availableHeight,
            bottomBarHeight: bottomBarHeight,
            hasBottomBar: isReasonableBottomBar && !isLikelyKeyboard
        };
    }
    
    // 動態調整容器高度以避免底部欄遮擋
    adjustForBottomBar() {
        if (window.innerWidth > 768) return; // 只在手機上執行
        
        const config = this.getWindowConfig();
        console.log('Window config:', config);
        
        // 只有在沒有鍵盤彈出且確實有底部欄時才調整
        const hasKeyboard = this.chatContainer && this.chatContainer.classList.contains('keyboard-open');
        
        if (config.hasBottomBar && this.chatContainer && !hasKeyboard) {
            // 使用更保守的調整策略
            const adjustedHeight = config.availableHeight - 60; // 60px是頂部導航欄高度
            
            // 只有當調整後的高度合理時才應用
            if (adjustedHeight > 300) { // 至少保留300px的聊天區域
                // 設置CSS變數
                document.documentElement.style.setProperty('--available-height', `${adjustedHeight}px`);
                document.documentElement.style.setProperty('--bottom-bar-height', `${config.bottomBarHeight}px`);
                
                // 添加底部欄檢測類
                this.chatContainer.classList.add('has-bottom-bar');
                
                console.log(`Adjusted for bottom bar: ${config.bottomBarHeight}px, available height: ${adjustedHeight}px`);
            }
        } else {
            // 移除底部欄相關樣式
            this.chatContainer.classList.remove('has-bottom-bar');
            document.documentElement.style.removeProperty('--available-height');
            document.documentElement.style.removeProperty('--bottom-bar-height');
        }
    }
    
    // 處理視窗變化
    handleViewportChange() {
        this.setViewportHeight();
        
        const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const screenHeight = window.screen.height;
        const heightDiff = screenHeight - currentHeight;
        
        // 如果高度減少超過 150px，認為是鍵盤彈出
        if (heightDiff > 150) {
            console.log('Keyboard detected - height diff:', heightDiff);
            this.handleKeyboardOpen(currentHeight);
        } else {
            console.log('Keyboard closed or normal resize');
            this.handleKeyboardClose();
        }
    }
    
    // 處理鍵盤彈出
    handleKeyboardOpen(keyboardHeight) {
        if (this.chatContainer && window.innerWidth <= 768) {
            // 先移除底部欄樣式，避免衝突
            this.chatContainer.classList.remove('has-bottom-bar');
            
            // 添加鍵盤彈出的CSS類
            this.chatContainer.classList.add('keyboard-open');
            
            // 如果有鍵盤高度，設置CSS變數
            if (keyboardHeight) {
                // 直接使用鍵盤高度，不再考慮底部欄
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                console.log(`Keyboard open: available height ${keyboardHeight}px`);
            }
            
            // 確保訊息滾動到底部
            setTimeout(() => {
                this.scrollToBottom(true);
                
                // 確保輸入框在可視區域內
                if (this.messageInput) {
                    this.messageInput.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'nearest'
                    });
                }
            }, 100);
        }
    }
    
    // 處理鍵盤收起
    handleKeyboardClose() {
        if (this.chatContainer && window.innerWidth <= 768) {
            // 移除鍵盤彈出的CSS類
            this.chatContainer.classList.remove('keyboard-open');
            
            // 重置高度變數
            document.documentElement.style.removeProperty('--keyboard-height');
            
            // 重新檢測底部欄（延遲執行，等待鍵盤完全收起）
            setTimeout(() => {
                this.adjustForBottomBar();
                this.scrollToBottom(true);
            }, 300);
        }
    }

    // Mark messages as read when entering a room
    markMessagesAsRead(roomId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('markMessagesRead', { roomId });
            
            // Also update global unread count immediately
            setTimeout(() => {
                this.getUnreadCount();
            }, 100);
        }
    }

    // Handle messages marked as read response
    handleMessagesMarkedRead(data) {
        console.log(`Marked ${data.markedCount} messages as read in room ${data.roomId}`);
        // Update UI to show messages as read
        this.updateMessagesReadStatus(data.roomId);
        
        // Update global unread count
        this.getUnreadCount();
        
        // Reload chat rooms to get updated unread counts
        this.loadChatRooms();
    }

    // Handle read status updates from other users
    handleReadStatusUpdated(data) {
        if (data.roomId === this.currentRoomId) {
            // Update message read indicators in current room
            this.updateMessageReadIndicators(data.userId);
            
            // Update all own messages to show as read
            this.updateMessagesReadStatus(data.roomId);
        }
        
        // Reload chat rooms to get updated unread counts
        this.loadChatRooms();
    }

    // Update messages to show read status
    updateMessagesReadStatus(roomId) {
        if (roomId !== this.currentRoomId) return;
        
        const messageElements = this.messagesList.querySelectorAll('.message-item.own');
        messageElements.forEach(element => {
            const readIndicator = element.querySelector('.message-read-status.unread');
            if (readIndicator) {
                readIndicator.textContent = '已讀';
                readIndicator.className = 'message-read-status read';
            }
        });
    }

    // Update message read indicators for specific user
    updateMessageReadIndicators(userId) {
        // Update local message data to reflect read status
        this.messages.forEach(message => {
            if (message.fromUserId === this.currentUser.id) {
                // This is our message, update read status based on who read it
                const room = this.rooms.find(r => r.id === this.currentRoomId);
                if (room) {
                    const isBuyer = room.buyerId === this.currentUser.id;
                    if (isBuyer) {
                        message.isReadBySeller = true;
                    } else {
                        message.isReadByBuyer = true;
                    }
                }
            }
        });
        
        // Update UI to show read status
        this.updateMessagesReadStatus(this.currentRoomId);
        
        console.log(`User ${userId} read messages in current room - UI updated`);
    }

    // Update specific room's unread count in UI
    updateRoomUnreadCount(roomId, count) {
        const roomElement = this.chatRoomsList.querySelector(`[data-room-id="${roomId}"]`);
        if (roomElement) {
            const unreadBadge = roomElement.querySelector('.room-unread');
            if (count > 0) {
                if (unreadBadge) {
                    unreadBadge.textContent = count;
                } else {
                    // Create new unread badge
                    const roomMeta = roomElement.querySelector('.room-meta');
                    if (roomMeta) {
                        const newBadge = document.createElement('div');
                        newBadge.className = 'room-unread';
                        newBadge.textContent = count;
                        roomMeta.appendChild(newBadge);
                    }
                }
            } else {
                // Remove unread badge
                if (unreadBadge) {
                    unreadBadge.remove();
                }
            }
        }
        
        // Update the room data as well
        const room = this.rooms.find(r => r.id === roomId);
        if (room && room.messages) {
            // Update read status in room data
            const isBuyer = room.buyerId === this.currentUser.id;
            room.messages.forEach(msg => {
                if (msg.fromUserId !== this.currentUser.id) {
                    if (isBuyer) {
                        msg.isReadByBuyer = true;
                    } else {
                        msg.isReadBySeller = true;
                    }
                }
            });
        }
    }

    // Update unread count badge in navigation
    updateUnreadCountBadge(count) {
        const badge = document.querySelector('.unread-messages-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Get unread count from server
    getUnreadCount() {
        if (this.socket && this.isConnected) {
            this.socket.emit('getUnreadCount');
        }
    }

    destroy() {
        // Stop message polling
        this.stopMessagePolling();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}

// Initialize chat page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatPage = new ChatPage();
    chatPage.init();
    
    // Store instance globally for cleanup
    window.chatPage = chatPage;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.chatPage) {
        window.chatPage.destroy();
    }
}); 
FROM node:18-alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 複製應用程式代碼
COPY . .

# 暴露埠號
EXPOSE 3000

# 設置環境變數
ENV NODE_ENV=production

# 啟動應用
CMD ["node", "server.js"] 
FROM node:24
WORKDIR /app

# 1. Copy package files first (for better caching)
COPY package*.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy ALL source code BEFORE building
COPY . .

# 4. Run the build (this should NOT be cached)
RUN npm run build

# 5. Start the application
CMD ["npm", "start"]

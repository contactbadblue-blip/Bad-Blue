FROM node:24

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build step (if your app has "build" script; otherwise delete this line)
RUN npm run build || echo "no build script, skipping"

# Start command – adjust if your package.json uses something else
CMD ["npm", "run", "start"]

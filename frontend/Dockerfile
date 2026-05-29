FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-workspace.yaml if it exists
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install

# Copy project files
COPY . .

# Expose Vite default port
EXPOSE 5173

# Start Vite server
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

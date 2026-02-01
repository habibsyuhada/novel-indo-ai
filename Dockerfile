# Gunakan image Node.js sebagai base image
FROM node:22.13.1

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Salin semua file aplikasi ke dalam container
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Jalankan aplikasi Next.js pada port 3000
EXPOSE 3000
CMD ["npm", "start"]

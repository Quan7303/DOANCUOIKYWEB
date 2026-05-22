FROM node:20-alpine

WORKDIR /app

# Cài đặt libc6-compat để tăng tính ổn định của các thư viện native trên Alpine Linux
RUN apk add --no-cache libc6-compat

COPY package*.json ./

# Cài đặt dependencies với legacy-peer-deps để tránh xung đột thư viện peer
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

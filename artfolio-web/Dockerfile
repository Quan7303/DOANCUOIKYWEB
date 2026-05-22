FROM node:20-alpine

WORKDIR /app

# Cài đặt libc6-compat để Next.js chạy ổn định trên Alpine Linux
RUN apk add --no-cache libc6-compat

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

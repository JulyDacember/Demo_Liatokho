
FROM node:20
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund

COPY . .
RUN mkdir -p /app/uploads

EXPOSE 4000
CMD ["npm","start"]

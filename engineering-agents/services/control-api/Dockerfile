FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY src ./src
USER node
EXPOSE 4310
CMD ["node", "src/server.js"]
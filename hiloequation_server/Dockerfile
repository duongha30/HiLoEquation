# Server runs TypeScript directly via tsx (tsx + dotenv are devDependencies),
# so install ALL dependencies. bcrypt is native → Debian slim has reliable prebuilds.
FROM node:24-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
EXPOSE 4056
CMD ["npm", "start"]

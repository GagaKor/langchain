FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NODE_ENV=development

EXPOSE 3300

CMD ["npm", "run", "start:dev"]

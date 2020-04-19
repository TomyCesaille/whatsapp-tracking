FROM schliflo/docker-puppeteer:3.0.0
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"] 

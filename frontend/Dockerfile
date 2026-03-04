FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 5173

# Setting the command to start Vite on all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

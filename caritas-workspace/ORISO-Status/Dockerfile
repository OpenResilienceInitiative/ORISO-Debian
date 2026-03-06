FROM node:20-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy frontend build (will be built before Docker build)
COPY frontend/dist ./frontend/dist

# Copy backend code
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 9200

CMD ["node", "server.js"]


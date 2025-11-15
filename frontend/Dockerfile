FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
# Note: We install rollup platform package explicitly to work around npm optional dependency bug
RUN npm install && \
    npm install @rollup/rollup-linux-x64-gnu --save-optional

# Copy application code
COPY . .

# Build arguments for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

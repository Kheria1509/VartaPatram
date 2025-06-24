# Use official Node.js LTS image as the build environment
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite app for production
RUN npm run build

# Use a lightweight web server to serve the built files
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# For development: mount source code as a volume for hot reloading
# (Uncomment the below lines when using docker-compose or docker run)
VOLUME [ "/app/node_modules" ]
VOLUME [ "/app" ]

# Use Node.js LTS as the base image
FROM node:18-alpine

# Install system dependencies for FFmpeg and other required packages
RUN apk add --no-cache --update \
    ffmpeg \
    python3 \
    make \
    g++ \
    git \
    wget

# Create app directory and set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm ci --only=production

# Copy application code
COPY . .


# Create necessary directories with appropriate permissions
RUN mkdir -p generated templates && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose the app port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]

# Use Node.js LTS as the base image
FROM node:18-alpine

# Install system dependencies for FFmpeg and other required packages
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./


# Install app dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Create necessary directories
RUN mkdir -p generated templates

# Expose the app port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]

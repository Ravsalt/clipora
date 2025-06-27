# Clipora 🎥

> AI-Powered Short-Form Video Generator API

Clipora is a powerful backend service that automatically generates engaging short-form videos by combining AI-generated speech with dynamic video templates. Perfect for creating YouTube Shorts, TikTok videos, and other social media content programmatically.

## ✨ Features

- 🎙️ AI-Generated Text-to-Speech with customizable voices
- 🎬 Automatic video generation with dynamic templates
- ⚡ Lightning-fast processing with FFmpeg
- 🌐 REST API for easy integration
- 🚀 Real-time progress tracking
- 🧹 Automatic cleanup of temporary files
- 🔧 Configurable prompts and templates
- 📦 Lightweight and container-ready

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 16+ and FFmpeg for local development

### Option 1: Using Docker (Recommended)

1. **Install Docker**
   - Make sure you have Docker and Docker Compose installed
   - Add your user to the docker group to avoid permission issues:
     ```bash
     sudo usermod -aG docker $USER
     newgrp docker
     ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/Ravsalt/clipora.git
   cd clipora
   ```

3. **Add video templates**
   - Place your video templates in the `templates` directory
   - Name them following the pattern `short_*.mp4` (e.g., `short_01.mp4`)

### 🐳 Docker Commands

#### Build the image
```bash
# Using docker-compose
docker-compose build

# Or using docker directly
docker build -t clipora .
```

#### Start the container
```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or using docker directly
docker run -d \
  --name clipora \
  -p 3000:3000 \
  -v $(pwd)/templates:/app/templates \
  -v $(pwd)/generated:/app/generated \
  clipora
```

#### View logs
```bash
# Using docker-compose
docker-compose logs -f

# Or using docker directly
docker logs -f clipora
```

#### Stop the container
```bash
# Using docker-compose
docker-compose down

# Or using docker directly
docker stop clipora
docker rm clipora
```

#### Common Issues

1. **Permission denied** when running docker commands:
   ```bash
   # Add your user to the docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Port already in use**: Make sure no other service is using port 3000
   ```bash
   # Find and stop the process using port 3000
   sudo lsof -i :3000
   kill <PID>
   ```

3. **Container fails to start**: Check the logs for errors
   ```bash
   docker logs clipora
   ```
   You should see the `clipora` container in the list of running containers.

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ravsalt/clipora.git
   cd clipora
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add video templates**
   - Place your video templates in the `templates` directory
   - Name them following the pattern `short_*.mp4` (e.g., `short_01.mp4`)

4. **Start the server**
   ```bash
   node server.js
   ```

## 🛠️ API Documentation

### Generate a Video

```http
POST /api/generate
Content-Type: application/json

{
  "topic": "quantum physics"
}
```

#### Response
- **Success**: Returns the generated video as binary data with `Content-Type: video/mp4`
- **Error**: Returns JSON with error details

### Health Check

```http
GET /health
```

## ⚙️ Configuration

Edit `config.js` to customize:

```javascript
{
  TEMPLATE_FOLDER: 'templates',  // Directory containing video templates
  OUTPUT_FOLDER: 'generated',     // Directory for temporary files
  GAMEPLAY_PATTERN: 'short_*.mp4',// Pattern to match template files
  TTS_API_URL: 'https://text.pollinations.ai',  // TTS service URL
  TTS_VOICE: 'onyx',             // TTS voice (e.g., alloy, echo, fable, onyx, nova, shimmer)
  TTS_MODEL: 'openai-audio',     // TTS model
}
```




## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FFmpeg](https://ffmpeg.org/) for powerful video processing
- [Pollinations AI](https://pollinations.ai/) for TTS capabilities
- [Express](https://expressjs.com/) for the web framework
- All the amazing open-source projects that made this possible

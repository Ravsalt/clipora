const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const stream = require('stream');
const app = express();
const PORT = process.env.PORT || 3000;


// Add this at the top of server.js
const os = require('os');

process.env.FFMPEG_PATH = '/usr/bin/ffmpeg';
// Import our existing functions
const { 
  generateShortTitle, 
  synthesizeSpeech, 
  processVideo 
} = require('./index');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'generated');

// Helper function to handle streaming output
const streamVideo = (videoPath, res) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(videoPath);
    
    readStream.on('open', () => {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline');
      readStream.pipe(res);
    });
    
    readStream.on('end', () => {
      resolve();
    });
    
    readStream.on('error', (err) => {
      reject(err);
    });
  });
};

// API endpoint to generate and stream video
app.post('/api/generate', async (req, res) => {
  let videoId;
  let audioPath;
  let outputPath;
  
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    videoId = uuidv4();
    audioPath = path.join(UPLOAD_DIR, `${videoId}.mp3`);
    outputPath = path.join(UPLOAD_DIR, `${videoId}.mp4`);
    
    console.log(`\n=== Generating video for: ${topic} ===`);
    
    // Generate speech
    const ttsSuccess = await synthesizeSpeech(topic, audioPath);
    if (!ttsSuccess) {
      throw new Error('Failed to generate speech');
    }
    
    // Process video
    await processVideo(audioPath, outputPath);
    
    // Create cleanup function
    const cleanup = async () => {
      try {
        // Remove audio and video files (suppress 'file not found' errors)
        if (audioPath) await fsp.unlink(audioPath).catch(() => {});
        if (outputPath) await fsp.unlink(outputPath).catch(() => {});
        
        // Remove directory if empty (suppress errors)
        try {
          const files = await fsp.readdir(UPLOAD_DIR).catch(() => []);
          if (files.length === 0) {
            await fsp.rmdir(UPLOAD_DIR).catch(() => {});
          }
        } catch (dirError) {
          // Suppress directory cleanup errors
        }
      } catch (cleanupError) {
        // Suppress any other cleanup errors
      }
    };

    // Stream the video and clean up when done
    try {
      await streamVideo(outputPath, res);
      await cleanup();
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
      throw streamError;
    }
    
  } catch (error) {
    console.error('Error in /api/generate:', error);
    
    // Only send error if headers not sent yet
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate video'
      });
    }
  } finally {
    // If we get here, there was an error before streaming started
    // Clean up any created files
    try {
      if (audioPath) await fsp.unlink(audioPath).catch(() => {});
      if (outputPath) await fsp.unlink(outputPath).catch(() => {});
    } catch (cleanupError) {
      // Suppress cleanup errors
    }
  }
});

// Simple redirect to the web interface
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


// Add this before starting the server
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app;

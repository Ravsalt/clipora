const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const { promisify } = require('util');
const prompts = require('prompts');
const sanitize = require('sanitize-filename');

const CONFIG = require('./config');
const generatePrompt = require('./prompt');


// Promisify ffmpeg operations
const ffprobe = promisify(ffmpeg.ffprobe);

// Clean script text
function cleanScript(text) {
  if (!text) return '';
  
  // Remove [directions], 'Voiceover', 'Narrator', etc.
  let cleaned = text
    .replace(/\[.*?\]/g, '') // Remove [directions]
    .replace(/^\s*(Voiceover|Narrator)?\s*\(?.*?\)?:?\s*/gim, '') // Remove voiceover/narrator
    .replace(/\*/g, '') // Remove asterisks
    .replace(/[^\x00-\x7F]/g, '') // Basic ASCII normalization
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
    
  return cleaned;
}

// Generate a short title from topic
function generateShortTitle(topic) {
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
  const words = topic.split(/\s+/)
    .filter(word => !stopWords.has(word.toLowerCase()))
    .slice(0, 3)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1));
    
  return words.join('_').substring(0, 30);
}

// Text-to-speech using Pollinations API
async function synthesizeSpeech(topic, outputPath) {

  const promptText = generatePrompt(topic);

  try {
    const encodedText = encodeURIComponent(promptText);
    const url = `${CONFIG.TTS_API_URL}/${encodedText}?model=${CONFIG.TTS_MODEL}&voice=${CONFIG.TTS_VOICE}`;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n=== TTS Request ===');
      console.log('Model:', CONFIG.TTS_MODEL);
      console.log('Voice:', CONFIG.TTS_VOICE);
    }
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'audio/mpeg',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Resolve only if the status code is less than 400
      }
    });

    console.log('\n=== TTS Response ===');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      const outputDir = path.dirname(outputPath);
      await fsp.mkdir(outputDir, { recursive: true });
      await fsp.writeFile(outputPath, response.data);
      console.log(`Audio size: ${(response.data.length / 1024).toFixed(2)} KB`);
      return true;
    } else {
      console.error('❌ Invalid TTS response - no data received');
      if (response.data) {
        console.error('Response data:', response.data.toString().substring(0, 200) + '...');
      }
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ TTS Error:', error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      if (error.response.data) {
        console.error('Error response data:', error.response.data.toString().substring(0, 200));
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error config:', error.config);
    }
    return false;
  }
}

// Get a random gameplay clip from GitHub
async function getRandomGameplayClip() {
  try {
    // Generate a random number between 1 and 10 (adjust range as needed)
    const randomNum = Math.floor(Math.random() * 42) + 1;
    const videoUrl = `https://github.com/Ravsalt/clipora/raw/refs/heads/main/templates/short_${randomNum}.mp4`;
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    await fsp.mkdir(tempDir, { recursive: true });
    
    // Download the video
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream'
    });
    
    // Save to temp file
    const tempFilePath = path.join(tempDir, `short_${randomNum}.mp4`);
    const writer = fs.createWriteStream(tempFilePath);
    
    response.data.pipe(writer);
    
    // Wait for download to complete
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`Downloaded gameplay clip: ${videoUrl} to ${tempFilePath}`);
    return tempFilePath;
    
  } catch (error) {
    console.error('Error downloading video:', error.message);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

// Get video duration using ffprobe
async function getVideoDuration(videoPath) {
  try {
    const metadata = await ffprobe(videoPath);
    return metadata.format.duration;
  } catch (error) {
    console.error(`Error getting video duration: ${error.message}`);
    throw error;
  }
}

// Get audio duration using ffprobe
async function getAudioDuration(audioPath) {
  try {
    const metadata = await ffprobe(audioPath);
    return metadata.format.duration;
  } catch (error) {
    console.error(`Error getting audio duration: ${error.message}`);
    throw error;
  }
}

// Process and combine video with audio
async function processVideo(audioPath, outputPath) {
  try {
    const audioDuration = await getAudioDuration(audioPath);
    console.log(`Audio duration: ${audioDuration.toFixed(2)}s`);
    
    let videoPath = await getRandomGameplayClip();
    const videoDuration = await getVideoDuration(videoPath);
    
    console.log(`Video duration: ${videoDuration.toFixed(2)}s`);
    console.log(`Using video: ${videoPath}`);
    
    // Create a temporary file for the processed audio
    const tempAudioPath = outputPath + '.temp.m4a';
    
    // First, normalize and process the audio
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(audioPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .audioChannels(2)
        .audioFrequency(44100)
        .outputOptions([
          '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', // Normalize audio
          '-y'
        ])
        .output(tempAudioPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Then combine with video
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(videoPath)
        .inputOptions([
          '-stream_loop -1'  // Loop the video if it's shorter than audio
        ])
        .input(tempAudioPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-pix_fmt yuv420p',
          '-shortest',
          '-map 0:v:0',  // Take video from first input
          '-map 1:a:0',  // Take audio from second input
          '-movflags +faststart',
          '-y'
        ])
        .output(outputPath);
      
      console.log('\nCombining video and audio...');
      
      let lastPercent = -1;
      command
        .on('stderr', (stderrLine) => {
          // Extract progress from ffmpeg stderr output
          const timeMatch = stderrLine.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
          if (timeMatch) {
            // Calculate percentage based on audio duration
            const currentTime = timeMatch[1].split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const percent = Math.min(99, Math.round((currentTime / (audioDuration || 30)) * 101));
            
            // Only update if percentage changed
            if (percent > lastPercent) {
              process.stdout.write(`Processing: ${percent}%\r`);
              lastPercent = percent;
            }
          }
        })
        .on('end', async () => {
          console.log('\n✅ Video processing finished');
          try {
            // Clean up temporary files
            await fs.unlink(tempAudioPath).catch(() => {});
            resolve(true);
          } catch (cleanupError) {
            console.warn('Warning: Could not clean up temporary files:', cleanupError.message);
            resolve(true);
          }
        })
        .on('error', (err) => {
          console.error('❌ Error processing video:', err.message);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    console.error('❌ Error in processVideo:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.OUTPUT_FOLDER, { recursive: true });
    
    // Get user input
    const response = await prompts.prompt({
      type: 'text',
      name: 'topic',
      message: '🎯 Enter topic for your short:'
    });
    
    if (!response.topic) {
      console.log('No topic provided. Exiting.');
      return;
    }
    
    const topic = response.topic.trim();
    const title = generateShortTitle(topic);
    const audioPath = path.join(CONFIG.OUTPUT_FOLDER, 'speech.mp3');
    const outputPath = path.join(CONFIG.OUTPUT_FOLDER, `${title}.mp4`);
    
    console.log('\nGenerating speech...');
    const ttsSuccess = await synthesizeSpeech(topic, audioPath);
    
    if (!ttsSuccess) {
      console.error('Failed to generate speech. Please try again.');
      return;
    }
    
    console.log('\nProcessing video...');
    await processVideo(audioPath, outputPath);
    
    console.log(`\n✅ DONE! Video saved as: ${outputPath}`);
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
  }
}

// Export functions for API use
module.exports = {
  cleanScript,
  generateShortTitle,
  synthesizeSpeech,
  getRandomGameplayClip,
  getVideoDuration,
  getAudioDuration,
  processVideo,
  CONFIG
};

// Only run main() if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

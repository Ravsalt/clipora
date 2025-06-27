
/**
 * You can customize the config to fit your needs.
 * Available options:
 * - TEMPLATE_FOLDER: folder path where short-form video templates are stored
 * - OUTPUT_FOLDER: folder path where generated videos are saved
 * - GAMEPLAY_PATTERN: glob pattern to find gameplays in TEMPLATE_FOLDER
 * - TTS_API_URL: URL for the TTS API used to generate speech
 * - TTS_VOICE: voice used for TTS e.g., alloy, echo, fable, onyx, nova, shimmer
 * - TTS_MODEL: model used for TTS e.g., 
 *
 */

// Configuration
const CONFIG = {
  TEMPLATE_FOLDER: 'templates',
  OUTPUT_FOLDER: 'generated',
  GAMEPLAY_PATTERN: 'short_*.mp4',
  TTS_API_URL: 'https://text.pollinations.ai',
  TTS_VOICE: 'onyx',
  TTS_MODEL: 'openai-audio'
};
  
module.exports = CONFIG;

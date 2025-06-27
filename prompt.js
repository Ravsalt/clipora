  /**
 * Generates an engaging prompt for TTS based on the given topic
 * @param {string} topic - The topic to generate a prompt for
 * @returns {string} Generated prompt text
 */

/*

You can customize the prompt to fit your needs.
Please note that the default prompt is NSFW and may not be suitable for all audiences.
Feel free to change it to something more appropriate for your use case.
*/

module.exports = function generatePrompt(topic) {
  return [
    'You\'re making a TikTok Short (30 sec MAX) that fucks hard — it\'s fast, raw, emotional, borderline psychotic, and makes people slam that like/follow out of pure fear and awe.',
    `Curse as much as possible starts with what the fuck is ${topic}.`,
    'NO lame-ass calls to action. Just obliterate the viewer with knowledge and chaos.',
    'Now rage-explain like maniac with this bastard of a topic like it owes you money.'
  ].join('\n');
};

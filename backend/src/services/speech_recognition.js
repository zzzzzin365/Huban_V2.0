const axios = require('axios');
const FormData = require('form-data');
class SpeechRecognitionService {
  constructor() {
    this.apiEndpoint = process.env.SPEECH_API_ENDPOINT;
    this.apiKey = process.env.SPEECH_API_KEY;
  }
  async recognizeSpeech(audioBuffer) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });
      formData.append('language', 'zh-CN');
      formData.append('model', 'LAS_Mandarin_PyTorch');
      const response = await axios.post(this.apiEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return {
        transcript: response.data.transcript,
        confidence: response.data.confidence
      };
    } catch (error) {
      throw new Error(`语音识别失败: ${error.message}`);
    }
  }
  async detectWakeWord(audioBuffer) {
    const result = await this.recognizeSpeech(audioBuffer);
    const wakeWords = ['小爱', '小爱助手', '你好小爱'];
    const containsWakeWord = wakeWords.some(word => 
      result.transcript.toLowerCase().includes(word.toLowerCase())
    );
    return {
      detected: containsWakeWord,
      transcript: result.transcript,
      confidence: result.confidence
    };
  }
}
module.exports = new SpeechRecognitionService(); 

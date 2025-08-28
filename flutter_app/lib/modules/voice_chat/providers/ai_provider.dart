class AIProvider with ChangeNotifier {
  
  List<TTSVoice> get ttsVoices => _ttsVoices;

  
  TTSVoice? get selectedVoice => _selectedVoice;

  
  int _ttsSpeed = 5;
  int _ttsPitch = 5;
  int _ttsVolume = 5;
  
  int get ttsSpeed => _ttsSpeed;
  int get ttsPitch => _ttsPitch;
  int get ttsVolume => _ttsVolume;

  
    try {
      _isLoading = true;
      notifyListeners();

      final voices = await AIService.getTTSVoices();
      _ttsVoices = voices;
      
      
      if (voices.isNotEmpty && _selectedVoice == null) {
        _selectedVoice = voices.first;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  
    _selectedVoice = voice;
    notifyListeners();
  }

  
  void updateTTSSettings({
    int? speed,
    int? pitch,
    int? volume,
  }) {
    if (speed != null) _ttsSpeed = speed;
    if (pitch != null) _ttsPitch = pitch;
    if (volume != null) _ttsVolume = volume;
    notifyListeners();
  }

  
    try {
      _isProcessing = true;
      notifyListeners();

      final response = await AIService.speechToText(audioData);
      
      if (response.success) {
        return response.text;
      } else {
        _error = response.message ?? '语音识别失败';
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    } finally {
      _isProcessing = false;
      notifyListeners();
    }
  }

  
    try {
      _isProcessing = true;
      notifyListeners();

      final response = await AIService.textToSpeech(
        text,
        voice: _selectedVoice?.id ?? '0',
        speed: _ttsSpeed,
        pitch: _ttsPitch,
        volume: _ttsVolume,
      );
      
      if (response.success) {
        return response.audioUrl;
      } else {
        _error = response.message ?? '语音合成失败';
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    } finally {
      _isProcessing = false;
      notifyListeners();
    }
  }
} 

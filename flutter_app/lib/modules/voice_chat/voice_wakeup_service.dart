import 'dart:async';
import 'dart:typed_data';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter/services.dart';

class VoiceWakeupService {
  static const MethodChannel _channel = MethodChannel('voice_wakeup');
  
  final SpeechToText _speech = SpeechToText();
  final List<String> _wakeWords = ['小爱', '小爱助手', '你好小爱'];
  
  bool _isListening = false;
  bool _isWakeWordDetected = false;
  StreamController<VoiceWakeupState>? _stateController;
  
  Stream<VoiceWakeupState> get stateStream => _stateController!.stream;
  
  Future<void> initialize() async {
    _stateController = StreamController<VoiceWakeupState>.broadcast();
    
    bool available = await _speech.initialize(
      onStatus: _onSpeechStatus,
      onError: _onSpeechError,
    );
    
    if (available) {
      await _startContinuousListening();
    }
  }
  
  Future<void> _startContinuousListening() async {
    if (_isListening) return;
    
    _isListening = true;
    _stateController?.add(VoiceWakeupState.listening);
    
    await _speech.listen(
      onResult: _onSpeechResult,
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      partialResults: true,
      localeId: 'zh_CN',
      cancelOnError: false,
    );
  }
  
  void _onSpeechResult(result) {
    String recognizedText = result.recognizedWords.toLowerCase();
    
    
    bool containsWakeWord = _wakeWords.any((word) => 
      recognizedText.contains(word.toLowerCase()));
    
    if (containsWakeWord && !_isWakeWordDetected) {
      _isWakeWordDetected = true;
      _stateController?.add(VoiceWakeupState.wakeWordDetected);
      _handleWakeWordDetected(recognizedText);
    }
    
    
        recognizedText.contains('�?) || 
        recognizedText.contains('不舒�?)) {
      _stateController?.add(VoiceWakeupState.emergencyDetected);
    }
  }
  
  void _handleWakeWordDetected(String text) async {
    
    
    
    _stateController?.add(VoiceWakeupState.aiActivated);
    
    
    Timer(const Duration(seconds: 30), () {
      _handleAISleep();
    });
  }
  
  Future<void> _playWakeupSound() async {
    try {
      await _channel.invokeMethod('playWakeupSound');
    } catch (e) {
      print('播放唤醒音失�? $e');
    }
  }
  
  void _handleAISleep() {
    _isWakeWordDetected = false;
    _stateController?.add(VoiceWakeupState.sleeping);
    _startContinuousListening();
  }
  
  void _onSpeechStatus(String status) {
    print('语音状�? $status');
  }
  
  void _onSpeechError(error) {
    print('语音错误: $error');
    
      _startContinuousListening();
    });
  }
  
  void dispose() {
    _stateController?.close();
    _speech.stop();
  }
}

enum VoiceWakeupState {
  sleeping,
  listening,
  wakeWordDetected,
  aiActivated,
  emergencyDetected,
}

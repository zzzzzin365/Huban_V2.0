import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:arcore_flutter_plugin/arcore_flutter_plugin.dart';
import '../../core/services/voice_wakeup_service.dart';
import '../../core/services/ai_chat_service.dart';
import '../../core/services/community_service.dart';

class VoiceChatScreen extends StatefulWidget {
  const VoiceChatScreen({Key? key}) : super(key: key);

  @override
  State<VoiceChatScreen> createState() => _VoiceChatScreenState();
}

class _VoiceChatScreenState extends State<VoiceChatScreen> {
  late VoiceWakeupService _voiceService;
  late AIChatService _aiService;
  late CommunityService _communityService;
  
  bool _isARMode = false;
  bool _showEmergencyButton = false;
  List<ChatMessage> _messages = [];
  ArCoreController? _arController;
  
  @override
  void initState() {
    super.initState();
    _initializeServices();
  }
  
  void _initializeServices() async {
    _voiceService = VoiceWakeupService();
    _aiService = AIChatService();
    _communityService = CommunityService();
    
    await _voiceService.initialize();
    await _aiService.initialize();
    
    
      _handleVoiceWakeupState(state);
    });
  }
  
  void _handleVoiceWakeupState(VoiceWakeupState state) {
    setState(() {
      switch (state) {
        case VoiceWakeupState.wakeWordDetected:
          _showAIActivation();
          break;
        case VoiceWakeupState.emergencyDetected:
          _showEmergencyButton = true;
          break;
        case VoiceWakeupState.aiActivated:
          _startAIChat();
          break;
        default:
          break;
      }
    });
  }
  
  void _showAIActivation() {
    
      context: context,
      builder: (context) => const AIActivationDialog(),
    );
  }
  
  void _startAIChat() async {
    
    
    
    
    
    String greeting = await _aiService.generateGreeting();
    _addMessage(ChatMessage(
      text: greeting,
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }
  
  void _addMessage(ChatMessage message) {
    setState(() {
      _messages.add(message);
    });
  }
  
  void _toggleARMode() {
    setState(() {
      _isARMode = !_isARMode;
    });
    
    if (_isARMode) {
      _initializeAR();
    } else {
      _disposeAR();
    }
  }
  
  void _initializeAR() {
    
    
  }
  
  void _disposeAR() {
    _arController?.dispose();
    _arController = null;
  }
  
  void _handleEmergencyCall() {
    
    setState(() {
      _showEmergencyButton = false;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI语音助手'),
        actions: [
          IconButton(
            icon: Icon(_isARMode ? Icons.camera_alt : Icons.camera_alt_outlined),
            onPressed: _toggleARMode,
          ),
        ],
      ),
      body: Stack(
        children: [
          
            children: [
              
              _buildAIAvatar(),
              
              
              Expanded(
                child: _buildMessageList(),
              ),
              
              
              _buildVoiceControlPanel(),
            ],
          ),
          
          
          
          
        ],
      ),
    );
  }
  
  Widget _buildAIAvatar() {
    return Container(
      height: 200,
      child: Center(
        child: StreamBuilder<VoiceWakeupState>(
          stream: _voiceService.stateStream,
          builder: (context, snapshot) {
            VoiceWakeupState state = snapshot.data ?? VoiceWakeupState.sleeping;
            
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _getAvatarColor(state),
              ),
              child: Center(
                child: Text(
                  _getAvatarEmoji(state),
                  style: const TextStyle(fontSize: 48),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
  
  Widget _buildMessageList() {
    return ListView.builder(
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        ChatMessage message = _messages[index];
        return _buildMessageBubble(message);
      },
    );
  }
  
  Widget _buildMessageBubble(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: message.isUser ? Colors.blue : Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: message.isUser ? Colors.white : Colors.black,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
  
  Widget _buildVoiceControlPanel() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          ElevatedButton.icon(
            onPressed: () => _voiceService._startContinuousListening(),
            icon: const Icon(Icons.mic),
            label: const Text('语音输入'),
          ),
          ElevatedButton.icon(
            onPressed: _toggleARMode,
            icon: Icon(_isARMode ? Icons.camera_alt : Icons.camera_alt_outlined),
            label: Text(_isARMode ? '关闭AR' : '开启AR'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAROverlay() {
    return Positioned.fill(
      child: ArCoreView(
        onArCoreViewCreated: (controller) {
          _arController = controller;
          _addARElements();
        },
        enableTapRecognizer: true,
      ),
    );
  }
  
  void _addARElements() {
    
      color: Colors.red,
      metallic: 0.0,
    );
    
    final sphere = ArCoreSphere(
      materials: [material],
      radius: 0.1,
    );
    
    final node = ArCoreNode(
      shape: sphere,
      position: vector.Vector3(0, 0, -1),
    );
    
    _arController?.addArCoreNode(node);
  }
  
  Widget _buildEmergencyButton() {
    return Positioned(
      bottom: 100,
      left: 0,
      right: 0,
      child: Center(
        child: ElevatedButton(
          onPressed: _handleEmergencyCall,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          ),
          child: const Text(
            '紧急呼�?,
            style: TextStyle(fontSize: 18, color: Colors.white),
          ),
        ),
      ),
    );
  }
  
  Color _getAvatarColor(VoiceWakeupState state) {
    switch (state) {
      case VoiceWakeupState.aiActivated:
        return Colors.green.shade200;
      case VoiceWakeupState.listening:
        return Colors.blue.shade200;
      case VoiceWakeupState.wakeWordDetected:
        return Colors.orange.shade200;
      default:
        return Colors.grey.shade200;
    }
  }
  
  String _getAvatarEmoji(VoiceWakeupState state) {
    switch (state) {
      case VoiceWakeupState.aiActivated:
        return '😊';
      case VoiceWakeupState.listening:
        return '👂';
      case VoiceWakeupState.wakeWordDetected:
        return '🤖';
      default:
        return '😴';
    }
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  
  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

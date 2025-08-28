import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/voice_chat_provider.dart';
import '../widgets/chat_message_widget.dart';
import '../widgets/voice_button.dart';
import '../widgets/emergency_button.dart';
import '../widgets/ar_mode_widget.dart';
import '../widgets/community_news_widget.dart';
import '../widgets/tts_settings_dialog.dart';

class VoiceChatScreen extends StatefulWidget {
  @override
  _VoiceChatScreenState createState() => _VoiceChatScreenState();
}

class _VoiceChatScreenState extends State<VoiceChatScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _fadeController;
  late ScrollController _scrollController;
  final TextEditingController _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    )..repeat();
    
    _fadeController = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );
    
    _scrollController = ScrollController();
    
    
    Future.delayed(Duration(milliseconds: 500), () {
      _fadeController.forward();
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _fadeController.dispose();
    _scrollController.dispose();
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<VoiceChatProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: Colors.grey[50],
          appBar: _buildAppBar(provider),
          body: _buildBody(provider),
          bottomNavigationBar: _buildBottomBar(provider),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(VoiceChatProvider provider) {
    return AppBar(
      title: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundImage: AssetImage('assets/images/ai_avatar.png'),
          ),
          SizedBox(width: 8),
          Text('小爱助手'),
          if (provider.isListening)
            Container(
              margin: EdgeInsets.only(left: 8),
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: Transform.scale(
                      scale: 1.0 + _pulseController.value * 0.5,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.3),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            provider.isARMode ? Icons.view_in_ar : Icons.view_in_ar_outlined,
            color: provider.isARMode ? Colors.blue : null,
          ),
          onPressed: provider.toggleARMode,
          tooltip: 'AR模式',
        ),
        IconButton(
          icon: Icon(Icons.info_outline),
          onPressed: () => _showCommunityNews(context, provider),
          tooltip: '社区资讯',
        ),
        PopupMenuButton<String>(
          onSelected: (value) => _handleMenuAction(value, provider),
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'clear',
              child: Row(
                children: [
                  Icon(Icons.clear_all),
                  SizedBox(width: 8),
                  Text('清除聊天'),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'settings',
              child: Row(
                children: [
                  Icon(Icons.settings),
                  SizedBox(width: 8),
                  Text('设置'),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'tts_settings',
              child: Row(
                children: [
                  Icon(Icons.record_voice_over),
                  SizedBox(width: 8),
                  Text('语音合成设置'),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBody(VoiceChatProvider provider) {
    if (provider.isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('正在初始�?..'),
          ],
        ),
      );
    }

    return Stack(
      children: [
        
        _buildChatList(provider),
        
        
        
        
          Positioned(
            top: 20,
            right: 20,
            child: EmergencyButton(
              message: provider.emergencyMessage,
              onPressed: provider.handleEmergency,
            ),
          ),
        
        
        if (provider.errorMessage != null)
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: _buildErrorBanner(provider),
          ),
      ],
    );
  }

  Widget _buildChatList(VoiceChatProvider provider) {
    return ListView.builder(
      controller: _scrollController,
      padding: EdgeInsets.all(16),
      itemCount: provider.messages.length,
      itemBuilder: (context, index) {
        final message = provider.messages[index];
        return FadeTransition(
          opacity: _fadeController,
          child: ChatMessageWidget(
            message: message,
            onAudioPlay: (audioUrl) => provider.playAudio(audioUrl),
            onAudioStop: () => provider.stopAudio(),
            isPlaying: provider.isPlayingAudio && 
                      provider.currentAudioUrl == message.audioUrl,
          ),
        );
      },
    );
  }

  Widget _buildErrorBanner(VoiceChatProvider provider) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red[300]!),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red[700]),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              provider.errorMessage!,
              style: TextStyle(color: Colors.red[700]),
            ),
          ),
          IconButton(
            icon: Icon(Icons.close, color: Colors.red[700]),
            onPressed: provider.clearError,
            padding: EdgeInsets.zero,
            constraints: BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(VoiceChatProvider provider) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _textController,
                  decoration: InputDecoration(
                    hintText: '输入消息...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (text) {
                    if (text.trim().isNotEmpty) {
                      provider.sendTextMessage(text);
                      _textController.clear();
                      _scrollToBottom();
                    }
                  },
                ),
              ),
            ),
            SizedBox(width: 12),
            
            
            VoiceButton(
              isListening: provider.isListening,
              onPressed: () {
                if (provider.isListening) {
                  provider.stopListening();
                } else {
                  provider.startListening();
                  _scrollToBottom();
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showCommunityNews(BuildContext context, VoiceChatProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommunityNewsWidget(
        news: provider.communityNews,
        isLoading: provider.isLoadingNews,
        onRefresh: provider.loadCommunityNews,
      ),
    );
  }

  void _handleMenuAction(String action, VoiceChatProvider provider) {
    switch (action) {
      case 'clear':
        _showClearChatDialog(provider);
        break;
      case 'settings':
        _showSettingsDialog(provider);
        break;
      case 'tts_settings':
        _showTTSSettingsDialog();
        break;
    }
  }

  void _showClearChatDialog(VoiceChatProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('清除聊天记录'),
        content: Text('确定要清除所有聊天记录吗？此操作不可撤销�?),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('取消'),
          ),
          TextButton(
            onPressed: () {
              provider.clearChat();
              Navigator.of(context).pop();
            },
            child: Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showSettingsDialog(VoiceChatProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('设置'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SwitchListTile(
              title: Text('AR模式'),
              subtitle: Text('启用增强现实交互'),
              value: provider.isARMode,
              onChanged: (value) {
                provider.toggleARMode();
                Navigator.of(context).pop();
              },
            ),
            SwitchListTile(
              title: Text('紧急检�?),
              subtitle: Text('自动检测紧急关键词'),
              value: provider.agentConfig.enableEmergencyDetection,
              onChanged: (value) {
                
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('关闭'),
          ),
        ],
      ),
    );
  }

  void _showTTSSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => const TTSSettingsDialog(),
    );
  }
} 

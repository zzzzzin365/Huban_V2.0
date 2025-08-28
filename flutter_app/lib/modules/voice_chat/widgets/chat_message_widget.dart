import 'package:flutter/material.dart';
import '../models/chat_message.dart';

class ChatMessageWidget extends StatelessWidget {
  final ChatMessage message;
  final Function(String)? onAudioPlay;
  final VoidCallback? onAudioStop;
  final bool isPlaying;

  const ChatMessageWidget({
    Key? key,
    required this.message,
    this.onAudioPlay,
    this.onAudioStop,
    this.isPlaying = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (message.isUserMessage) ...[
            Expanded(child: SizedBox()),
            _buildMessageBubble(context),
            _buildAvatar(context),
          ] else ...[
            _buildAvatar(context),
            _buildMessageBubble(context),
            Expanded(child: SizedBox()),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      margin: EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: message.isUserMessage ? Colors.blue : Colors.green,
        image: message.isUserMessage ? null : DecorationImage(
          image: AssetImage('assets/images/ai_avatar.png'),
          fit: BoxFit.cover,
        ),
      ),
      child: message.isUserMessage
          ? Icon(Icons.person, color: Colors.white, size: 20)
          : null,
    );
  }

  Widget _buildMessageBubble(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.7,
      ),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _getMessageColor(),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          
          _buildMessageContent(context),
          
          
          SizedBox(height: 4),
          _buildMessageTime(context),
          
          
            SizedBox(height: 8),
            _buildAudioPlayer(context),
          ],
          
          
            SizedBox(height: 8),
            _buildEmergencyIndicator(context),
          ],
        ],
      ),
    );
  }

  Widget _buildMessageContent(BuildContext context) {
    if (message.isImageMessage && message.imageUrl != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          message.imageUrl!,
          width: 200,
          height: 150,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: 200,
              height: 150,
              color: Colors.grey[300],
              child: Icon(Icons.image_not_supported, color: Colors.grey[600]),
            );
          },
        ),
      );
    }

    return Text(
      message.content,
      style: TextStyle(
        color: _getTextColor(),
        fontSize: 16,
        height: 1.4,
      ),
    );
  }

  Widget _buildMessageTime(BuildContext context) {
    return Text(
      message.shortTime,
      style: TextStyle(
        color: _getTimeColor(),
        fontSize: 12,
      ),
    );
  }

  Widget _buildAudioPlayer(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () {
              if (isPlaying) {
                onAudioStop?.call();
              } else if (message.audioUrl != null) {
                onAudioPlay?.call(message.audioUrl!);
              }
            },
            child: Icon(
              isPlaying ? Icons.pause : Icons.play_arrow,
              color: _getTextColor(),
              size: 20,
            ),
          ),
          SizedBox(width: 8),
          Container(
            width: 100,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
            child: LinearProgressIndicator(
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation<Color>(_getTextColor()),
              value: isPlaying ? 0.5 : 0.0, 
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyIndicator(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.emergency,
            color: Colors.red,
            size: 16,
          ),
          SizedBox(width: 4),
          Text(
            '紧�?,
            style: TextStyle(
              color: Colors.red,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getMessageColor() {
    if (message.isEmergencyMessage) {
      return Colors.red[100]!;
    }
    
    if (message.isUserMessage) {
      return Colors.blue[500]!;
    } else if (message.isSystemMessage) {
      return Colors.grey[300]!;
    } else {
      return Colors.green[500]!;
    }
  }

  Color _getTextColor() {
    if (message.isUserMessage) {
      return Colors.white;
    } else if (message.isEmergencyMessage) {
      return Colors.red[800]!;
    } else {
      return Colors.white;
    }
  }

  Color _getTimeColor() {
    if (message.isUserMessage) {
      return Colors.white.withOpacity(0.7);
    } else {
      return Colors.white.withOpacity(0.7);
    }
  }
}


  final Function(String) onSendMessage;
  final VoidCallback onVoiceButtonPressed;
  final bool isListening;

  const MessageInputWidget({
    Key? key,
    required this.onSendMessage,
    required this.onVoiceButtonPressed,
    required this.isListening,
  }) : super(key: key);

  @override
  _MessageInputWidgetState createState() => _MessageInputWidgetState();
}

class _MessageInputWidgetState extends State<MessageInputWidget> {
  final TextEditingController _controller = TextEditingController();
  bool _isComposing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleSubmitted(String text) {
    if (text.trim().isNotEmpty) {
      widget.onSendMessage(text);
      _controller.clear();
      setState(() {
        _isComposing = false;
      });
    }
  }

  void _handleChanged(String text) {
    setState(() {
      _isComposing = text.isNotEmpty;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
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
                  controller: _controller,
                  onChanged: _handleChanged,
                  onSubmitted: _isComposing ? _handleSubmitted : null,
                  decoration: InputDecoration(
                    hintText: '输入消息...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    suffixIcon: _isComposing
                        ? IconButton(
                            icon: Icon(Icons.send),
                            onPressed: () => _handleSubmitted(_controller.text),
                          )
                        : null,
                  ),
                ),
              ),
            ),
            SizedBox(width: 12),
            
            
            GestureDetector(
              onTapDown: (_) {
                if (!widget.isListening) {
                  widget.onVoiceButtonPressed();
                }
              },
              onTapUp: (_) {
                if (widget.isListening) {
                  widget.onVoiceButtonPressed();
                }
              },
              onTapCancel: () {
                if (widget.isListening) {
                  widget.onVoiceButtonPressed();
                }
              },
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.isListening ? Colors.red : Colors.blue,
                ),
                child: Icon(
                  widget.isListening ? Icons.mic : Icons.mic_none,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
} 

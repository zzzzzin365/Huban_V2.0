import 'package:flutter/material.dart';

class VoiceButton extends StatefulWidget {
  final bool isListening;
  final VoidCallback onPressed;

  const VoiceButton({
    Key? key,
    required this.isListening,
    required this.onPressed,
  }) : super(key: key);

  @override
  _VoiceButtonState createState() => _VoiceButtonState();
}

class _VoiceButtonState extends State<VoiceButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: Duration(milliseconds: 1500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _pulseAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void didUpdateWidget(VoiceButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isListening != oldWidget.isListening) {
      if (widget.isListening) {
        _animationController.repeat(reverse: true);
      } else {
        _animationController.stop();
        _animationController.reset();
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        if (!widget.isListening) {
          widget.onPressed();
        }
      },
      onTapUp: (_) {
        if (widget.isListening) {
          widget.onPressed();
        }
      },
      onTapCancel: () {
        if (widget.isListening) {
          widget.onPressed();
        }
      },
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.isListening ? Colors.red : Colors.blue,
              boxShadow: [
                BoxShadow(
                  color: (widget.isListening ? Colors.red : Colors.blue)
                      .withOpacity(0.3),
                  blurRadius: widget.isListening ? 20 : 8,
                  spreadRadius: widget.isListening ? 5 : 2,
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                
                if (widget.isListening)
                  Transform.scale(
                    scale: 1.0 + _pulseAnimation.value * 0.5,
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.red.withOpacity(0.2),
                      ),
                    ),
                  ),
                
                
                  scale: widget.isListening ? _scaleAnimation.value : 1.0,
                  child: Container(
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
          );
        },
      ),
    );
  }
} 

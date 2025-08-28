import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ARModeWidget extends StatefulWidget {
  @override
  _ARModeWidgetState createState() => _ARModeWidgetState();
}

class _ARModeWidgetState extends State<ARModeWidget>
    with TickerProviderStateMixin {
  late AnimationController _arrowController;
  late AnimationController _pulseController;
  late Animation<double> _arrowAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    
    _arrowController = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );
    
    _pulseController = AnimationController(
      duration: Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _arrowAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _arrowController,
      curve: Curves.easeInOut,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _arrowController.repeat(reverse: true);
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _arrowController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.transparent,
      child: Stack(
        children: [
          
          _buildARBackground(),
          
          
          _buildAIVirtualAvatar(),
          
          
          _buildDirectionArrow(),
          
          
          _buildARControlPanel(),
          
          
          _buildEnvironmentInfo(),
        ],
      ),
    );
  }

  Widget _buildARBackground() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.blue.withOpacity(0.1),
            Colors.purple.withOpacity(0.1),
          ],
        ),
      ),
    );
  }

  Widget _buildAIVirtualAvatar() {
    return Positioned(
      top: MediaQuery.of(context).size.height * 0.2,
      left: MediaQuery.of(context).size.width * 0.5 - 50,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: 1.0 + _pulseAnimation.value * 0.1,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.green.withOpacity(0.8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withOpacity(0.3),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Icon(
                Icons.face,
                color: Colors.white,
                size: 60,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDirectionArrow() {
    return Positioned(
      top: MediaQuery.of(context).size.height * 0.4,
      left: MediaQuery.of(context).size.width * 0.5 - 25,
      child: AnimatedBuilder(
        animation: _arrowAnimation,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, _arrowAnimation.value * 10),
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.8),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.keyboard_arrow_up,
                color: Colors.white,
                size: 30,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildARControlPanel() {
    return Positioned(
      bottom: 100,
      left: 20,
      right: 20,
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.7),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildARButton(
              icon: Icons.view_in_ar,
              label: 'AR视图',
              onPressed: () {
                HapticFeedback.lightImpact();
                
              },
            ),
            _buildARButton(
              icon: Icons.location_on,
              label: '定位',
              onPressed: () {
                HapticFeedback.lightImpact();
                
              },
            ),
            _buildARButton(
              icon: Icons.settings,
              label: '设置',
              onPressed: () {
                HapticFeedback.lightImpact();
                
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildARButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnvironmentInfo() {
    return Positioned(
      top: 50,
      left: 20,
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.7),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.white, size: 16),
                SizedBox(width: 4),
                Text(
                  '当前位置',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            SizedBox(height: 4),
            Text(
              '社区活动中心',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.access_time, color: Colors.white, size: 16),
                SizedBox(width: 4),
                Text(
                  '14:30',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


  @override
  _ARSettingsDialogState createState() => _ARSettingsDialogState();
}

class _ARSettingsDialogState extends State<ARSettingsDialog> {
  bool _enableHapticFeedback = true;
  bool _showDirectionArrows = true;
  bool _showEnvironmentInfo = true;
  double _avatarSize = 1.0;
  double _arrowSensitivity = 0.5;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('AR设置'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SwitchListTile(
              title: Text('触觉反馈'),
              subtitle: Text('启用AR交互的触觉反�?),
              value: _enableHapticFeedback,
              onChanged: (value) {
                setState(() {
                  _enableHapticFeedback = value;
                });
              },
            ),
            SwitchListTile(
              title: Text('方向箭头'),
              subtitle: Text('显示AR方向指示箭头'),
              value: _showDirectionArrows,
              onChanged: (value) {
                setState(() {
                  _showDirectionArrows = value;
                });
              },
            ),
            SwitchListTile(
              title: Text('环境信息'),
              subtitle: Text('显示位置和时间信�?),
              value: _showEnvironmentInfo,
              onChanged: (value) {
                setState(() {
                  _showEnvironmentInfo = value;
                });
              },
            ),
            ListTile(
              title: Text('AI形象大小'),
              subtitle: Slider(
                value: _avatarSize,
                min: 0.5,
                max: 2.0,
                divisions: 15,
                label: _avatarSize.toStringAsFixed(1),
                onChanged: (value) {
                  setState(() {
                    _avatarSize = value;
                  });
                },
              ),
            ),
            ListTile(
              title: Text('箭头灵敏�?),
              subtitle: Slider(
                value: _arrowSensitivity,
                min: 0.1,
                max: 1.0,
                divisions: 9,
                label: _arrowSensitivity.toStringAsFixed(1),
                onChanged: (value) {
                  setState(() {
                    _arrowSensitivity = value;
                  });
                },
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text('取消'),
        ),
        ElevatedButton(
          onPressed: () {
            
            Navigator.of(context).pop();
          },
          child: Text('保存'),
        ),
      ],
    );
  }
}


class ARCalibrationWidget extends StatefulWidget {
  @override
  _ARCalibrationWidgetState createState() => _ARCalibrationWidgetState();
}

class _ARCalibrationWidgetState extends State<ARCalibrationWidget>
    with TickerProviderStateMixin {
  late AnimationController _calibrationController;
  late Animation<double> _calibrationAnimation;
  int _currentStep = 0;
  final List<String> _calibrationSteps = [
    '请将手机保持水平',
    '缓慢旋转手机360�?,
    '将手机对准地�?,
    '校准完成',
  ];

  @override
  void initState() {
    super.initState();
    _calibrationController = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );
    _calibrationAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(_calibrationController);
    _calibrationController.repeat();
  }

  @override
  void dispose() {
    _calibrationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.9),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _calibrationAnimation,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _calibrationAnimation.value * 2 * 3.14159,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.blue, width: 3),
                      borderRadius: BorderRadius.circular(50),
                    ),
                    child: Icon(
                      Icons.compass_calibration,
                      color: Colors.blue,
                      size: 50,
                    ),
                  ),
                );
              },
            ),
            SizedBox(height: 32),
            Text(
              _calibrationSteps[_currentStep],
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16),
            LinearProgressIndicator(
              value: (_currentStep + 1) / _calibrationSteps.length,
              backgroundColor: Colors.grey[600],
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
            ),
            SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _currentStep > 0 ? _previousStep : null,
                  child: Text('上一�?),
                ),
                ElevatedButton(
                  onPressed: _currentStep < _calibrationSteps.length - 1
                      ? _nextStep
                      : _finishCalibration,
                  child: Text(_currentStep < _calibrationSteps.length - 1
                      ? '下一�?
                      : '完成'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _nextStep() {
    if (_currentStep < _calibrationSteps.length - 1) {
      setState(() {
        _currentStep++;
      });
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    }
  }

  void _finishCalibration() {
    Navigator.of(context).pop();
  }
} 

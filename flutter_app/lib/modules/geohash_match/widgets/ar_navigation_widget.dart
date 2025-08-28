import 'package:flutter/material.dart';
import 'package:ar_flutter_plugin/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin/datatypes/node_types.dart';
import 'package:ar_flutter_plugin/managers/ar_location_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_session_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_anchor_manager.dart';
import 'package:vector_math/vector_math_64.dart';
import '../../arkit/services/ar_navigation_service.dart';
import '../../amap/services/amap_service.dart';

class ARNavigationWidget extends StatefulWidget {
  final double targetLatitude;
  final double targetLongitude;
  final String volunteerName;

  const ARNavigationWidget({
    super.key,
    required this.targetLatitude,
    required this.targetLongitude,
    required this.volunteerName,
  });

  @override
  State<ARNavigationWidget> createState() => _ARNavigationWidgetState();
}

class _ARNavigationWidgetState extends State<ARNavigationWidget> {
  late ARSessionManager _arSessionManager;
  late ARObjectManager _arObjectManager;
  late ARAnchorManager _arAnchorManager;
  late ARLocationManager _arLocationManager;
  
  final ARNavigationService _arNavigationService = ARNavigationService();
  final AmapService _amapService = AmapService();
  
  bool _isARSessionInitialized = false;
  bool _isNavigating = false;
  String _currentDistance = '';
  String _estimatedTime = '';
  String _currentInstruction = '';

  @override
  void initState() {
    super.initState();
    _initializeAR();
  }

  
  Future<void> _initializeAR() async {
    try {
      
      _arSessionManager = ARSessionManager();
      _arObjectManager = ARObjectManager();
      _arAnchorManager = ARAnchorManager();
      _arLocationManager = ARLocationManager();

      
      _arNavigationService.initializeAR(
        sessionManager: _arSessionManager,
        objectManager: _arObjectManager,
        anchorManager: _arAnchorManager,
        locationManager: _arLocationManager,
      );

      
      await _arNavigationService.setTargetLocation(
        widget.targetLatitude,
        widget.targetLongitude,
      );

      setState(() {
        _isARSessionInitialized = true;
      });

      
      
    } catch (e) {
      print('AR初始化失�? $e');
      _showErrorDialog('AR初始化失�? $e');
    }
  }

  
    setState(() {
      _isNavigating = true;
    });

    
    await _getRouteInfo();
    
    
    _startNavigationUpdates();
  }

  
  Future<void> _getRouteInfo() async {
    try {
      
      final currentLng = 116.4074;

      
      final routeInfo = await _amapService.walkingRoute(
        currentLat,
        currentLng,
        widget.targetLatitude,
        widget.targetLongitude,
      );

      if (routeInfo != null) {
        setState(() {
          _currentDistance = AmapService.formatDistance(routeInfo['distance']);
          _estimatedTime = AmapService.formatDuration(routeInfo['duration']);
          
          final steps = routeInfo['steps'] as List;
          if (steps.isNotEmpty) {
            _currentInstruction = steps[0]['instruction'];
          }
        });
      }
    } catch (e) {
      print('获取路径信息失败: $e');
    }
  }

  
    
    Future.delayed(const Duration(seconds: 5), () {
      if (_isNavigating && mounted) {
        _arNavigationService.updateARNavigation();
        _startNavigationUpdates();
      }
    });
  }

  
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('错误'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  
  void _stopNavigation() {
    setState(() {
      _isNavigating = false;
    });
    _arNavigationService.clearARContent();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('AR导航 - ${widget.volunteerName}'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.stop),
            onPressed: _stopNavigation,
          ),
        ],
      ),
      body: Stack(
        children: [
          
          ARView(
            onARViewCreated: _onARViewCreated,
          ),
          
          
            top: 16,
            left: 16,
            right: 16,
            child: _buildNavigationInfoCard(),
          ),
          
          
          Positioned(
            bottom: 32,
            left: 16,
            right: 16,
            child: _buildControlButtons(),
          ),
          
          
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              ),
            ),
        ],
      ),
    );
  }

  
  void _onARViewCreated(
    ARSessionManager sessionManager,
    ARObjectManager objectManager,
    ARAnchorManager anchorManager,
    ARLocationManager locationManager,
  ) {
    _arSessionManager = sessionManager;
    _arObjectManager = objectManager;
    _arAnchorManager = anchorManager;
    _arLocationManager = locationManager;

    
    _arNavigationService.initializeAR(
      sessionManager: sessionManager,
      objectManager: objectManager,
      anchorManager: anchorManager,
      locationManager: locationManager,
    );

    
    _arNavigationService.setTargetLocation(
      widget.targetLatitude,
      widget.targetLongitude,
    );
  }

  
  Widget _buildNavigationInfoCard() {
    return Card(
      color: Colors.white.withOpacity(0.9),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  color: Colors.blue[600],
                  size: 24,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '前往 ${widget.volunteerName}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    icon: Icons.straighten,
                    label: '距离',
                    value: _currentDistance,
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    icon: Icons.access_time,
                    label: '预计时间',
                    value: _estimatedTime,
                  ),
                ),
              ],
            ),
            if (_currentInstruction.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.directions,
                    color: Colors.orange[600],
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _currentInstruction,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          color: Colors.grey[600],
          size: 20,
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  
  Widget _buildControlButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        FloatingActionButton(
          onPressed: () {
            
            _getRouteInfo();
          },
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
          child: const Icon(Icons.refresh),
        ),
        FloatingActionButton(
          onPressed: () {
            
            _showMapView();
          },
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          child: const Icon(Icons.map),
        ),
        FloatingActionButton(
          onPressed: () {
            
          },
          backgroundColor: Colors.orange,
          foregroundColor: Colors.white,
          child: const Icon(Icons.phone),
        ),
      ],
    );
  }

  
  void _showMapView() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              '地图导航',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Text('这里显示地图导航界面'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('联系志愿�?),
        content: Text('是否要联�?${widget.volunteerName}�?),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('正在拨打 ${widget.volunteerName} 的电�?..')),
              );
            },
            child: const Text('拨打电话'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _stopNavigation();
    super.dispose();
  }
} 

import 'dart:math';
import 'package:ar_flutter_plugin/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin/datatypes/node_types.dart';
import 'package:ar_flutter_plugin/managers/ar_location_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_session_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_anchor_manager.dart';
import 'package:vector_math/vector_math_64.dart';

class ARNavigationService {
  ARSessionManager? _arSessionManager;
  ARObjectManager? _arObjectManager;
  ARAnchorManager? _arAnchorManager;
  ARLocationManager? _arLocationManager;

  
  final Map<String, ARNode> _arNodes = {};
  final Map<String, ARAnchor> _arAnchors = {};

  
  Vector3? _targetPosition;
  ARNode? _directionArrow;
  ARNode? _distanceIndicator;

  
  void initializeAR({
    required ARSessionManager sessionManager,
    required ARObjectManager objectManager,
    required ARAnchorManager anchorManager,
    required ARLocationManager locationManager,
  }) {
    _arSessionManager = sessionManager;
    _arObjectManager = objectManager;
    _arAnchorManager = anchorManager;
    _arLocationManager = locationManager;
  }

  
  Future<void> setTargetLocation(double latitude, double longitude) async {
    if (_arLocationManager == null) return;

    try {
      
      final currentLocation = await _arLocationManager!.getCurrentLocation();
      if (currentLocation == null) return;

      
      final targetOffset = _calculateTargetOffset(
        currentLocation.latitude,
        currentLocation.longitude,
        latitude,
        longitude,
      );

      _targetPosition = Vector3(
        targetOffset['x'].toDouble(),
        0.0, 
        targetOffset['z'].toDouble(),
      );

      
      await _createDirectionArrow();
      
      
      
    } catch (e) {
      print('设置目标位置失败: $e');
    }
  }

  
  Map<String, double> _calculateTargetOffset(
    double currentLat,
    double currentLng,
    double targetLat,
    double targetLng,
  ) {
    const double earthRadius = 6371000; 
    
    double dLng = (targetLng - currentLng) * (pi / 180);
    
    
    double distance = sqrt(dLat * dLat + dLng * dLng) * earthRadius;
    
    
    
    
    double x = distance * sin(bearing);
    double z = distance * cos(bearing);
    
    return {
      'x': x,
      'z': z,
      'distance': distance,
      'bearing': bearing,
    };
  }

  
  Future<void> _createDirectionArrow() async {
    if (_arObjectManager == null || _targetPosition == null) return;

    try {
      
        await _arObjectManager!.removeNode(_directionArrow!);
        _directionArrow = null;
      }

      
      final arrowRotation = _calculateArrowRotation(_targetPosition!);
      
      
      _directionArrow = ARNode(
        type: NodeType.localGLTF2,
        uri: "assets/ar_assets/direction_arrow.glb", 
        scale: Vector3.all(0.5), 
        position: Vector3(0, 0.5, -2), 
      );

      await _arObjectManager!.addNode(_directionArrow!);
      _arNodes['direction_arrow'] = _directionArrow!;
      
    } catch (e) {
      print('创建方向箭头失败: $e');
    }
  }

  
  Vector4 _calculateArrowRotation(Vector3 targetPosition) {
    
    
    
    double angle = atan2(direction.x, direction.z);
    
    
  }

  
    if (_arObjectManager == null || _targetPosition == null) return;

    try {
      
      if (_distanceIndicator != null) {
        await _arObjectManager!.removeNode(_distanceIndicator!);
        _distanceIndicator = null;
      }

      
      double distance = _targetPosition!.length;
      String distanceText = _formatDistance(distance);
      
      
        type: NodeType.localGLTF2,
        uri: "assets/ar_assets/distance_indicator.glb", 
        scale: Vector3.all(0.3),
        position: Vector3(0, 1.0, -2), 

      await _arObjectManager!.addNode(_distanceIndicator!);
      _arNodes['distance_indicator'] = _distanceIndicator!;
      
    } catch (e) {
      print('创建距离指示器失�? $e');
    }
  }

  
    if (distance < 1000) {
      return '${distance.toInt()}�?;
    } else {
      return '${(distance / 1000).toStringAsFixed(1)}公里';
    }
  }

  
  Future<void> updateARNavigation() async {
    if (_arLocationManager == null) return;

    try {
      
      final currentLocation = await _arLocationManager!.getCurrentLocation();
      if (currentLocation == null) return;

      
      if (_targetPosition != null) {
        await _updateDirectionArrow();
        await _updateDistanceIndicator();
      }
      
    } catch (e) {
      print('更新AR导航失败: $e');
    }
  }

  
  Future<void> _updateDirectionArrow() async {
    if (_directionArrow == null || _targetPosition == null) return;

    try {
      final arrowRotation = _calculateArrowRotation(_targetPosition!);
      
      
      _directionArrow!.rotation = arrowRotation;
      await _arObjectManager!.updateNode(_directionArrow!);
      
    } catch (e) {
      print('更新方向箭头失败: $e');
    }
  }

  
    if (_distanceIndicator == null || _targetPosition == null) return;

    try {
      double distance = _targetPosition!.length;
      String distanceText = _formatDistance(distance);
      
      
      
      
    } catch (e) {
      print('更新距离指示器失�? $e');
    }
  }

  
  Future<ARAnchor?> createARAnchor(Vector3 position) async {
    if (_arAnchorManager == null) return null;

    try {
      final anchor = ARAnchor(
        type: AnchorType.plane,
        transformation: Matrix4.translation(position),
      );

      await _arAnchorManager!.addAnchor(anchor);
      _arAnchors['anchor_${DateTime.now().millisecondsSinceEpoch}'] = anchor;
      
      return anchor;
    } catch (e) {
      print('创建AR锚点失败: $e');
      return null;
    }
  }

  
  Future<void> addARMarker(
    String markerId,
    Vector3 position, {
    Vector3? scale,
    Vector4? rotation,
  }) async {
    if (_arObjectManager == null) return;

    try {
      final markerNode = ARNode(
        type: NodeType.localGLTF2,
        uri: "assets/ar_assets/marker.glb", 
        scale: scale ?? Vector3.all(0.3),
        position: position,
        rotation: rotation ?? Vector4.zero(),
      );

      await _arObjectManager!.addNode(markerNode);
      _arNodes[markerId] = markerNode;
      
    } catch (e) {
      print('添加AR标记失败: $e');
    }
  }

  
  Future<void> removeARMarker(String markerId) async {
    if (_arObjectManager == null) return;

    try {
      final node = _arNodes[markerId];
      if (node != null) {
        await _arObjectManager!.removeNode(node);
        _arNodes.remove(markerId);
      }
    } catch (e) {
      print('移除AR标记失败: $e');
    }
  }

  
  Future<void> clearARContent() async {
    if (_arObjectManager == null) return;

    try {
      
        await _arObjectManager!.removeNode(node);
      }
      _arNodes.clear();

      
        for (ARAnchor anchor in _arAnchors.values) {
          await _arAnchorManager!.removeAnchor(anchor);
        }
        _arAnchors.clear();
      }

      _directionArrow = null;
      _distanceIndicator = null;
      _targetPosition = null;
      
    } catch (e) {
      print('清除AR内容失败: $e');
    }
  }

  

  
  int get arNodeCount => _arNodes.length;

  
  int get arAnchorCount => _arAnchors.length;
} 

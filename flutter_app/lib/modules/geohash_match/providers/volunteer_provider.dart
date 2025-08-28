import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/volunteer.dart';
import '../models/help_request.dart';
import '../services/geohash_matching_service.dart';
import '../services/volunteer_service.dart';

class VolunteerProvider with ChangeNotifier {
  List<Volunteer> _volunteers = [];
  List<HelpRequest> _helpRequests = [];
  Position? _currentPosition;
  bool _isLoading = false;
  String? _error;
  
  final VolunteerService _volunteerService = VolunteerService();

  
  List<Volunteer> get volunteers => _volunteers;
  List<HelpRequest> get helpRequests => _helpRequests;
  Position? get currentPosition => _currentPosition;
  bool get isLoading => _isLoading;
  String? get error => _error;

  
    _setLoading(true);
    try {
      await _getCurrentLocation();
      await _loadMockData();
      await loadHelpRequests(); 
    } catch (e) {
      _setError('初始化失�? $e');
    } finally {
      _setLoading(false);
    }
  }

  
  Future<void> _getCurrentLocation() async {
    try {
      
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('位置权限被拒�?);
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('位置权限被永久拒�?);
      }

      
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      notifyListeners();
    } catch (e) {
      throw Exception('获取位置失败: $e');
    }
  }

  
  Future<void> _loadMockData() async {
    
      Volunteer(
        id: '1',
        name: '张三',
        phone: '13800138001',
        latitude: 39.9042,
        longitude: 116.4074,
        geohash: GeohashMatchingService.generateGeohash(39.9042, 116.4074),
        skills: ['医疗救助', '心理疏导', '翻译'],
        rating: 4.8,
        completedTasks: 15,
      ),
      Volunteer(
        id: '2',
        name: '李四',
        phone: '13800138002',
        latitude: 39.9142,
        longitude: 116.4174,
        geohash: GeohashMatchingService.generateGeohash(39.9142, 116.4174),
        skills: ['紧急救�?, '体力劳动'],
        rating: 4.5,
        completedTasks: 8,
      ),
      Volunteer(
        id: '3',
        name: '王五',
        phone: '13800138003',
        latitude: 39.8942,
        longitude: 116.3974,
        geohash: GeohashMatchingService.generateGeohash(39.8942, 116.3974),
        skills: ['技术支�?, '设备维修'],
        rating: 4.9,
        completedTasks: 22,
      ),
      Volunteer(
        id: '4',
        name: '赵六',
        phone: '13800138004',
        latitude: 39.9242,
        longitude: 116.4274,
        geohash: GeohashMatchingService.generateGeohash(39.9242, 116.4274),
        skills: ['医疗救助', '紧急救�?],
        rating: 4.7,
        completedTasks: 12,
      ),
    ];

    
    _helpRequests = [
      HelpRequest(
        id: '1',
        title: '老人摔倒需要帮�?,
        description: '在小区门口有一位老人摔倒，需要紧急医疗救�?,
        requesterId: 'user1',
        requesterName: '小区保安',
        requesterPhone: '13900139001',
        latitude: 39.9042,
        longitude: 116.4074,
        geohash: GeohashMatchingService.generateGeohash(39.9042, 116.4074),
        requiredSkills: ['医疗救助'],
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
        urgency: 5,
      ),
      HelpRequest(
        id: '2',
        title: '需要技术支�?,
        description: '电脑系统故障，需要技术人员帮助修�?,
        requesterId: 'user2',
        requesterName: '办公室职�?,
        requesterPhone: '13900139002',
        latitude: 39.9142,
        longitude: 116.4174,
        geohash: GeohashMatchingService.generateGeohash(39.9142, 116.4174),
        requiredSkills: ['技术支�?],
        createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
        urgency: 3,
      ),
    ];

    notifyListeners();
  }

  
  Future<void> createHelpRequest(HelpRequest request) async {
    _setLoading(true);
    try {
      
      final createdRequest = await _volunteerService.createHelpRequest(request);
      _helpRequests.add(createdRequest);
      notifyListeners();
      _setError(null);
    } catch (e) {
      _setError('创建求助请求失败: $e');
    } finally {
      _setLoading(false);
    }
  }

  
    if (_currentPosition == null) {
      return [];
    }
    
    try {
      
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        5.0, 
        maxResults: 10,
      );
    } catch (e) {
      print('查找附近志愿者失�? $e');
      
        request,
        _volunteers,
        maxDistance: 5000,
        maxResults: 10,
      );
    }
  }

  
  Future<void> matchVolunteerToRequest(String requestId, String volunteerId) async {
    _setLoading(true);
    try {
      
      
      
      if (requestIndex != -1) {
        _helpRequests[requestIndex] = _helpRequests[requestIndex].copyWith(
          status: 'matched',
          matchedVolunteerId: volunteerId,
        );
        notifyListeners();
      }
      _setError(null);
    } catch (e) {
      _setError('匹配志愿者失�? $e');
    } finally {
      _setLoading(false);
    }
  }

  
    _setLoading(true);
    try {
      
      
      
      if (volunteerIndex != -1) {
        _volunteers[volunteerIndex] = _volunteers[volunteerIndex].copyWith(
          isAvailable: isAvailable,
        );
        notifyListeners();
      }
      _setError(null);
    } catch (e) {
      _setError('更新志愿者状态失�? $e');
    } finally {
      _setLoading(false);
    }
  }

  
    try {
      return _volunteers.firstWhere((v) => v.id == id);
    } catch (e) {
      return null;
    }
  }

  
  HelpRequest? getHelpRequestById(String id) {
    try {
      return _helpRequests.firstWhere((r) => r.id == id);
    } catch (e) {
      return null;
    }
  }
  
  
  Future<void> loadHelpRequests({String? status}) async {
    _setLoading(true);
    try {
      final requests = await _volunteerService.getHelpRequests(status: status);
      _helpRequests = requests;
      notifyListeners();
      _setError(null);
    } catch (e) {
      _setError('加载求助请求失败: $e');
    } finally {
      _setLoading(false);
    }
  }

  
  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    return GeohashMatchingService.calculateDistance(lat1, lon1, lat2, lon2);
  }

  
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }
} 

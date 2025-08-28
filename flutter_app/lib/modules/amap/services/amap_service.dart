import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';

class AmapService {
  static const String _apiKey = 'YOUR_AMAP_API_KEY'; 
  static const String _baseUrl = 'https:
  
  final Dio _dio = Dio();

  
    try {
      final response = await _dio.get(
        '$_baseUrl/geocode/geo',
        queryParameters: {
          'key': _apiKey,
          'address': address,
          'output': 'json',
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        final geocodes = response.data['geocodes'] as List;
        if (geocodes.isNotEmpty) {
          final location = geocodes[0]['location'] as String;
          final coords = location.split(',');
          return {
            'latitude': double.parse(coords[1]),
            'longitude': double.parse(coords[0]),
            'formatted_address': geocodes[0]['formatted_address'],
            'province': geocodes[0]['province'],
            'city': geocodes[0]['city'],
            'district': geocodes[0]['district'],
          };
        }
      }
      return null;
    } catch (e) {
      print('地理编码失败: $e');
      return null;
    }
  }

  
  Future<Map<String, dynamic>?> reverseGeocode(double latitude, double longitude) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/geocode/regeo',
        queryParameters: {
          'key': _apiKey,
          'location': '$longitude,$latitude',
          'output': 'json',
          'extensions': 'all',
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        final regeocode = response.data['regeocode'];
        final addressComponent = regeocode['addressComponent'];
        
        return {
          'formatted_address': regeocode['formatted_address'],
          'province': addressComponent['province'],
          'city': addressComponent['city'],
          'district': addressComponent['district'],
          'street': addressComponent['street'],
          'street_number': addressComponent['streetNumber'],
          'poi': regeocode['pois'] ?? [],
        };
      }
      return null;
    } catch (e) {
      print('逆地理编码失�? $e');
      return null;
    }
  }

  
    double originLat,
    double originLng,
    double destLat,
    double destLng,
  ) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/direction/driving',
        queryParameters: {
          'key': _apiKey,
          'origin': '$originLng,$originLat',
          'destination': '$destLng,$destLat',
          'output': 'json',
          'strategy': '0', 
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        final route = response.data['route'];
        final paths = route['paths'] as List;
        
        if (paths.isNotEmpty) {
          final path = paths[0];
          return {
            'distance': int.parse(path['distance']),
            'duration': int.parse(path['duration']),
            'tolls': double.parse(path['tolls'] ?? '0'),
            'steps': _parseRouteSteps(path['steps']),
            'polyline': path['polyline'],
          };
        }
      }
      return null;
    } catch (e) {
      print('路径规划失败: $e');
      return null;
    }
  }

  
    double originLat,
    double originLng,
    double destLat,
    double destLng,
  ) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/direction/walking',
        queryParameters: {
          'key': _apiKey,
          'origin': '$originLng,$originLat',
          'destination': '$destLng,$destLat',
          'output': 'json',
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        final route = response.data['route'];
        final paths = route['paths'] as List;
        
        if (paths.isNotEmpty) {
          final path = paths[0];
          return {
            'distance': int.parse(path['distance']),
            'duration': int.parse(path['duration']),
            'steps': _parseRouteSteps(path['steps']),
            'polyline': path['polyline'],
          };
        }
      }
      return null;
    } catch (e) {
      print('步行路径规划失败: $e');
      return null;
    }
  }

  
  List<Map<String, dynamic>> _parseRouteSteps(List steps) {
    return steps.map<Map<String, dynamic>>((step) {
      return {
        'instruction': step['instruction'],
        'distance': int.parse(step['distance']),
        'duration': int.parse(step['duration']),
        'polyline': step['polyline'],
        'action': step['action'],
        'assistant_action': step['assistant_action'],
      };
    }).toList();
  }

  
  Future<List<Map<String, dynamic>>> searchNearbyPOI(
    double latitude,
    double longitude,
    String keywords, {
    int radius = 1000,
    String types = '',
  }) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/place/around',
        queryParameters: {
          'key': _apiKey,
          'location': '$longitude,$latitude',
          'keywords': keywords,
          'radius': radius,
          'types': types,
          'output': 'json',
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        final pois = response.data['pois'] as List;
        return pois.map<Map<String, dynamic>>((poi) {
          final location = poi['location'] as String;
          final coords = location.split(',');
          
          return {
            'id': poi['id'],
            'name': poi['name'],
            'type': poi['type'],
            'address': poi['address'],
            'distance': int.parse(poi['distance']),
            'latitude': double.parse(coords[1]),
            'longitude': double.parse(coords[0]),
            'tel': poi['tel'] ?? '',
            'rating': double.parse(poi['biz_ext']['rating'] ?? '0'),
          };
        }).toList();
      }
      return [];
    } catch (e) {
      print('搜索周边POI失败: $e');
      return [];
    }
  }

  
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/distance',
        queryParameters: {
          'key': _apiKey,
          'origins': '$lng1,$lat1',
          'destination': '$lng2,$lat2',
          'output': 'json',
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        final results = response.data['results'] as List;
        if (results.isNotEmpty) {
          return double.parse(results[0]['distance']);
        }
      }
      
      
    } catch (e) {
      print('计算距离失败: $e');
      
    }
  }

  
  Future<Map<String, dynamic>?> getTrafficInfo(
    double latitude,
    double longitude,
    int radius,
  ) async {
    try {
      final response = await _dio.get(
        '$_baseUrl/traffic/status/rectangle',
        queryParameters: {
          'key': _apiKey,
          'rectangle': '$longitude,$latitude;$longitude,$latitude',
          'level': '4',
        },
      );

      if (response.statusCode == 200 && response.data['status'] == '1') {
        return response.data;
      }
      return null;
    } catch (e) {
      print('获取路况信息失败: $e');
      return null;
    }
  }

  
    if (distance < 1000) {
      return '${distance}�?;
    } else {
      return '${(distance / 1000).toStringAsFixed(1)}公里';
    }
  }

  
    final minutes = duration ~/ 60;
    if (minutes < 60) {
      return '${minutes}分钟';
    } else {
      final hours = minutes ~/ 60;
      final remainingMinutes = minutes % 60;
      return '${hours}小时${remainingMinutes}分钟';
    }
  }
} 

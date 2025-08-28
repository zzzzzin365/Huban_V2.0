import 'dart:math';
import 'package:geolocator/geolocator.dart';
import '../models/volunteer.dart';
import '../models/help_request.dart';
import '../../../config/api_endpoints.dart';
import '../../../core/services/network_service.dart';

class VolunteerService {
  final NetworkService _networkService = NetworkService();
  
  
  String generateGeoHash(double lat, double lon, int precision) {
    const String base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    
    double latMin = -90.0, latMax = 90.0;
    double lonMin = -180.0, lonMax = 180.0;
    
    String geoHash = '';
    int idx = 0;
    int bit = 0;
    bool evenBit = true;
    
    while (geoHash.length < precision) {
      double mid;
      
      if (evenBit) {
        mid = (lonMin + lonMax) / 2;
        if (lon >= mid) {
          idx = (idx << 1) + 1;
          lonMin = mid;
        } else {
          idx = idx << 1;
          lonMax = mid;
        }
      } else {
        mid = (latMin + latMax) / 2;
        if (lat >= mid) {
          idx = (idx << 1) + 1;
          latMin = mid;
        } else {
          idx = idx << 1;
          latMax = mid;
        }
      }
      
      evenBit = !evenBit;
      
      if (++bit == 5) {
        geoHash += base32[idx];
        bit = 0;
        idx = 0;
      }
    }
    
    return geoHash;
  }
  
  
    double lat, 
    double lon, 
    double radiusKm, {
    List<String>? requiredSkills,
    int maxResults = 10,
  }) async {
    try {
      
      String userGeoHash = generateGeoHash(lat, lon, 7);
      
      
      Map<String, dynamic> queryParams = {
        'geohash': userGeoHash,
        'radius': radiusKm,
        'lat': lat,
        'lon': lon,
        'max_results': maxResults,
      };
      
      if (requiredSkills != null && requiredSkills.isNotEmpty) {
        queryParams['skills'] = requiredSkills.join(',');
      }
      
      
        ApiEndpoints.nearbyVolunteers,
        queryParameters: queryParams,
      );
      
      List<Volunteer> volunteers = (response.data['volunteers'] as List)
          .map((v) => Volunteer.fromJson(v))
          .toList();
      
      
        double distA = Geolocator.distanceBetween(lat, lon, a.latitude, a.longitude);
        double distB = Geolocator.distanceBetween(lat, lon, b.latitude, b.longitude);
        return distA.compareTo(distB);
      });
      
      return volunteers;
    } catch (e) {
      
      return [];
    }
  }
  
  
  Future<HelpRequest> createHelpRequest(HelpRequest request) async {
    try {
      var response = await _networkService.post(
        ApiEndpoints.helpRequests,
        data: request.toJson(),
      );
      
      return HelpRequest.fromJson(response.data);
    } catch (e) {
      throw Exception('创建求助请求失败: $e');
    }
  }
  
  
  Future<void> requestHelp(String volunteerId, String helpType) async {
    try {
      await _networkService.post(
        ApiEndpoints.helpRequests,
        data: {
          'volunteer_id': volunteerId,
          'help_type': helpType,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      throw Exception('请求帮助失败: $e');
    }
  }
  
  
    try {
      var response = await _networkService.get(ApiEndpoints.volunteerDetailsUrl(volunteerId));
      return Volunteer.fromJson(response.data);
    } catch (e) {
      print('获取志愿者详情失�? $e');
      return null;
    }
  }
  
  
    try {
      await _networkService.put(
        ApiEndpoints.volunteerStatusUrl(volunteerId),
        data: {
          'is_available': isAvailable,
          'updated_at': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      throw Exception('更新志愿者状态失�? $e');
    }
  }
  
  
  Future<List<HelpRequest>> getHelpRequests({
    String? status,
    String? volunteerId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      Map<String, dynamic> queryParams = {
        'page': page,
        'limit': limit,
      };
      
      if (status != null) {
        queryParams['status'] = status;
      }
      
      if (volunteerId != null) {
        queryParams['volunteer_id'] = volunteerId;
      }
      
      var response = await _networkService.get(
        ApiEndpoints.helpRequests,
        queryParameters: queryParams,
      );
      
      return (response.data['requests'] as List)
          .map((r) => HelpRequest.fromJson(r))
          .toList();
    } catch (e) {
      print('获取求助请求失败: $e');
      return [];
    }
  }
  
  
  Future<void> matchVolunteerToRequest(String requestId, String volunteerId) async {
    try {
      await _networkService.put(
        ApiEndpoints.helpRequestMatchUrl(requestId),
        data: {
          'volunteer_id': volunteerId,
          'matched_at': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      throw Exception('匹配志愿者失�? $e');
    }
  }
  
  
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }
  
  
  String getGeoHashPrefix(String geohash, int precision) {
    return geohash.substring(0, precision);
  }
  
  
  List<String> getNeighborGeohashes(String geohash) {
    
    
  }
  
  
  List<Volunteer> smartMatchVolunteers(
    HelpRequest request,
    List<Volunteer> allVolunteers, {
    double maxDistance = 5000,
    int maxResults = 10,
  }) {
    List<Volunteer> candidates = [];
    
    
      if (!volunteer.isAvailable) continue;
      
      double distance = calculateDistance(
        request.latitude,
        request.longitude,
        volunteer.latitude,
        volunteer.longitude,
      );
      
      if (distance <= maxDistance) {
        candidates.add(volunteer);
      }
    }
    
    
    
    for (Volunteer volunteer in candidates) {
      double distance = calculateDistance(
        request.latitude,
        request.longitude,
        volunteer.latitude,
        volunteer.longitude,
      );
      
      
      double skillScore = _calculateSkillMatch(request.requiredSkills, volunteer.skills);
      
      
      double distanceScore = 1.0 - (distance / maxDistance);
      double ratingScore = volunteer.rating / 5.0;
      
      double totalScore = distanceScore * 0.4 + skillScore * 0.4 + ratingScore * 0.2;
      
      scoredVolunteers.add(MapEntry(volunteer, totalScore));
    }
    
    
    scoredVolunteers.sort((a, b) => b.value.compareTo(a.value));
    
    return scoredVolunteers
        .take(maxResults)
        .map((entry) => entry.key)
        .toList();
  }
  
  
  double _calculateSkillMatch(List<String> requiredSkills, List<String> volunteerSkills) {
    if (requiredSkills.isEmpty) return 1.0;
    if (volunteerSkills.isEmpty) return 0.0;
    
    int matchedSkills = 0;
    for (String requiredSkill in requiredSkills) {
      if (volunteerSkills.contains(requiredSkill)) {
        matchedSkills++;
      }
    }
    
    return matchedSkills / requiredSkills.length;
  }
} 

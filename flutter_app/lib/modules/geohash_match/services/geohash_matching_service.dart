import 'dart:math';
import 'package:geohash/geohash.dart';
import '../models/volunteer.dart';
import '../models/help_request.dart';

class GeohashMatchingService {
  
    const double earthRadius = 6371000; 
    double dLat = _degreesToRadians(lat2 - lat1);
    double dLon = _degreesToRadians(lon2 - lon1);
    
    double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) * cos(_degreesToRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    return earthRadius * c;
  }

  static double _degreesToRadians(double degrees) {
    return degrees * (pi / 180);
  }

  
  static String generateGeohash(double latitude, double longitude, {int precision = 6}) {
    return Geohash.encode(latitude, longitude, codeLength: precision);
  }

  
  static String getGeohashPrefix(String geohash, int precision) {
    return geohash.substring(0, precision);
  }

  
  static List<String> getNeighborGeohashes(String geohash) {
    return Geohash.neighbors(geohash);
  }

  
    HelpRequest helpRequest,
    List<Volunteer> allVolunteers,
    {
      double maxDistance = 5000, 
      int maxResults = 10,
      int geohashPrecision = 4, 
    }
  ) {
    List<Volunteer> candidates = [];
    String requestGeohash = helpRequest.geohash;
    String requestPrefix = getGeohashPrefix(requestGeohash, geohashPrecision);

    
      if (!volunteer.isAvailable) continue;
      
      String volunteerPrefix = getGeohashPrefix(volunteer.geohash, geohashPrecision);
      
      
          getNeighborGeohashes(requestPrefix).contains(volunteerPrefix)) {
        candidates.add(volunteer);
      }
    }

    
    
    for (Volunteer volunteer in candidates) {
      double distance = calculateDistance(
        helpRequest.latitude,
        helpRequest.longitude,
        volunteer.latitude,
        volunteer.longitude,
      );
      
      if (distance <= maxDistance) {
        volunteersWithDistance.add(MapEntry(volunteer, distance));
      }
    }

    
    
    for (MapEntry<Volunteer, double> entry in volunteersWithDistance) {
      Volunteer volunteer = entry.key;
      double distance = entry.value;
      
      
      double skillScore = _calculateSkillMatch(helpRequest.requiredSkills, volunteer.skills);
      
      
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

  
  static double _calculateSkillMatch(List<String> requiredSkills, List<String> volunteerSkills) {
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

  
    try {
      List<double> coordinates = Geohash.decode(geohash);
      List<double> bbox = Geohash.bbox(geohash);
      
      return {
        'center': {
          'latitude': coordinates[0],
          'longitude': coordinates[1],
        },
        'bbox': {
          'minLat': bbox[0],
          'minLon': bbox[1],
          'maxLat': bbox[2],
          'maxLon': bbox[3],
        },
        'precision': geohash.length,
      };
    } catch (e) {
      return {};
    }
  }

  
  static int getOptimalGeohashPrecision(double distance) {
    if (distance <= 100) return 7;      
    if (distance <= 100000) return 4;   
    return 3;                           
  }
} 

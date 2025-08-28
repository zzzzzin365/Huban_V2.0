class ApiEndpoints {
  
  static const String baseUrl = 'https:
  
  
  static const String nearbyVolunteers = '/volunteers/nearby';
  static const String volunteerStatus = '/volunteers/{id}/status';
  static const String volunteerDetails = '/volunteers/{id}';
  
  
  static const String helpRequests = '/help-requests';
  static const String helpRequestMatch = '/help-requests/{id}/match';
  static const String helpRequestDetails = '/help-requests/{id}';
  
  
  static const String userProfile = '/users/profile';
  static const String userLocation = '/users/location';
  
  
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  
  
  static String volunteerStatusUrl(String volunteerId) {
    return volunteerStatus.replaceAll('{id}', volunteerId);
  }
  
  static String volunteerDetailsUrl(String volunteerId) {
    return volunteerDetails.replaceAll('{id}', volunteerId);
  }
  
  static String helpRequestMatchUrl(String requestId) {
    return helpRequestMatch.replaceAll('{id}', requestId);
  }
  
  static String helpRequestDetailsUrl(String requestId) {
    return helpRequestDetails.replaceAll('{id}', requestId);
  }
} 

import 'package:dio/dio.dart';
import '../../config/api_config.dart';

class NetworkService {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();

  late Dio _dio;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: 'https:
      connectTimeout: Duration(milliseconds: ApiConfig.requestTimeout),
      receiveTimeout: Duration(milliseconds: ApiConfig.requestTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    
      onRequest: (options, handler) {
        if (ApiConfig.enableDebugLogs) {
          print('🌐 请求: ${options.method} ${options.path}');
          print('📤 参数: ${options.data}');
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        if (ApiConfig.enableDebugLogs) {
          print('�?响应: ${response.statusCode} ${response.requestOptions.path}');
        }
        handler.next(response);
      },
      onError: (error, handler) {
        if (ApiConfig.enableDebugLogs) {
          print('�?错误: ${error.type} ${error.message}');
        }
        handler.next(error);
      },
    ));
  }

  Dio get dio => _dio;

  
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  
  Exception _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception(ApiConfig.networkError);
      
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['message'] ?? '请求失败';
        
        switch (statusCode) {
          case 400:
            return Exception('请求参数错误: $message');
          case 401:
            return Exception('未授权访�? $message');
          case 403:
            return Exception('访问被拒�? $message');
          case 404:
            return Exception('资源不存�? $message');
          case 500:
            return Exception('服务器内部错�? $message');
          default:
            return Exception('请求失败 (${statusCode}): $message');
        }
      
      case DioExceptionType.cancel:
        return Exception('请求被取�?);
      
      case DioExceptionType.connectionError:
        return Exception('网络连接失败，请检查网络设�?);
      
      case DioExceptionType.badCertificate:
        return Exception('证书验证失败');
      
      case DioExceptionType.unknown:
      default:
        return Exception('未知错误: ${error.message}');
    }
  }

  
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  
  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
} 

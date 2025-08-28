import Geolocation from 'react-native-geolocation-service';
import {Location} from '../types';
import {ApiConfig} from '../config/apiConfig';

class LocationService {
  private static instance: LocationService;
  private currentLocation: Location | null = null;
  private locationWatcher: number | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 获取当前位置
   */
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            geohash: this.encodeGeohash(
              position.coords.latitude,
              position.coords.longitude
            ),
            address: '位置信息获取中...',
            accuracy: position.coords.accuracy,
          };

          this.currentLocation = location;
          this.reverseGeocode(location).then(resolve).catch(() => resolve(location));
        },
        error => {
          console.error('获取位置失败:', error);
          reject(new Error('无法获取位置信息'));
        },
        {
          enableHighAccuracy: true,
          timeout: ApiConfig.location.timeout,
          maximumAge: ApiConfig.location.maximumAge,
        }
      );
    });
  }

  /**
   * 开始监听位置变化
   */
  startLocationWatching(
    onLocationChange: (location: Location) => void,
    onError?: (error: any) => void
  ): void {
    if (this.locationWatcher) {
      this.stopLocationWatching();
    }

    this.locationWatcher = Geolocation.watchPosition(
      position => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          geohash: this.encodeGeohash(
            position.coords.latitude,
            position.coords.longitude
          ),
          address: '位置信息获取中...',
          accuracy: position.coords.accuracy,
        };

        this.currentLocation = location;
        this.reverseGeocode(location).then(onLocationChange).catch(() => onLocationChange(location));
      },
      error => {
        console.error('位置监听失败:', error);
        onError?.(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: ApiConfig.location.distanceFilter,
        interval: 10000, // 10秒更新一次
      }
    );
  }

  /**
   * 停止监听位置变化
   */
  stopLocationWatching(): void {
    if (this.locationWatcher) {
      Geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
    }
  }

  /**
   * 获取当前位置（如果已有缓存）
   */
  getCurrentLocationCached(): Location | null {
    return this.currentLocation;
  }

  /**
   * 计算两点间距离（公里）
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 检查位置是否在指定范围内
   */
  isLocationInRange(
    centerLat: number,
    centerLon: number,
    targetLat: number,
    targetLon: number,
    rangeKm: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, targetLat, targetLon);
    return distance <= rangeKm;
  }

  /**
   * 编码Geohash
   */
  private encodeGeohash(latitude: number, longitude: number): string {
    // 简化的Geohash编码实现
    // 在实际应用中，建议使用专业的geohash库
    const lat = Math.floor((latitude + 90) * 1000000);
    const lon = Math.floor((longitude + 180) * 1000000);
    return `${lat.toString(36)}${lon.toString(36)}`;
  }

  /**
   * 反向地理编码（获取地址信息）
   */
  private async reverseGeocode(location: Location): Promise<Location> {
    try {
      // 这里应该调用高德地图或其他地图服务的反向地理编码API
      // 暂时返回模拟数据
      const address = await this.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      
      return {
        ...location,
        address: address || '未知地址',
      };
    } catch (error) {
      console.error('反向地理编码失败:', error);
      return location;
    }
  }

  /**
   * 从坐标获取地址（模拟实现）
   */
  private async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    // 这里应该调用实际的API
    // 暂时返回模拟数据
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`北京市朝阳区某某街道${Math.floor(Math.random() * 100)}号`);
      }, 1000);
    });
  }

  /**
   * 请求位置权限
   */
  async requestLocationPermission(): Promise<boolean> {
    // 这里应该实现实际的权限请求逻辑
    // 暂时返回true
    return true;
  }

  /**
   * 检查位置权限状态
   */
  async checkLocationPermission(): Promise<boolean> {
    // 这里应该实现实际的权限检查逻辑
    // 暂时返回true
    return true;
  }
}

export default LocationService.getInstance();

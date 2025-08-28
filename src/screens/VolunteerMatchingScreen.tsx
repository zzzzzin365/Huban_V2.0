import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useVolunteerStore} from '../stores/volunteerStore';
import {Volunteer, HelpRequest, Location} from '../types';
import VolunteerCard from '../components/VolunteerCard';
import HelpRequestCard from '../components/HelpRequestCard';
import LocationService from '../services/LocationService';
import VolunteerService from '../services/VolunteerService';

const VolunteerMatchingScreen: React.FC = () => {
  const {
    volunteers,
    helpRequests,
    currentLocation,
    isLoading,
    error,
    setVolunteers,
    setHelpRequests,
    setCurrentLocation,
    setLoading,
    setError,
    getNearbyVolunteers,
    getUrgentRequests,
  } = useVolunteerStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'volunteers' | 'requests'>('volunteers');

  useEffect(() => {
    initializeLocation();
    loadData();
  }, []);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (err) {
      setError('无法获取位置信息');
      Alert.alert('位置错误', '请检查位置权限设置');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [volunteersData, requestsData] = await Promise.all([
        VolunteerService.getVolunteers(),
        VolunteerService.getHelpRequests(),
      ]);
      setVolunteers(volunteersData);
      setHelpRequests(requestsData);
    } catch (err) {
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleVolunteerPress = (volunteer: Volunteer) => {
    Alert.alert(
      '联系志愿者',
      `是否要联系 ${volunteer.name}？`,
      [
        {text: '取消', style: 'cancel'},
        {text: '联系', onPress: () => contactVolunteer(volunteer)},
      ]
    );
  };

  const handleRequestPress = (request: HelpRequest) => {
    Alert.alert(
      '查看求助',
      request.title,
      [
        {text: '关闭', style: 'cancel'},
        {text: '接受', onPress: () => acceptRequest(request)},
      ]
    );
  };

  const contactVolunteer = (volunteer: Volunteer) => {
    // 实现联系志愿者的逻辑
    console.log('联系志愿者:', volunteer.name);
  };

  const acceptRequest = (request: HelpRequest) => {
    // 实现接受求助请求的逻辑
    console.log('接受请求:', request.title);
  };

  const nearbyVolunteers = getNearbyVolunteers(5); // 5公里内
  const urgentRequests = getUrgentRequests();

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 地图视图 */}
      {currentLocation && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}>
            
            {/* 志愿者标记 */}
            {volunteers.map(volunteer => (
              <Marker
                key={volunteer.id}
                coordinate={{
                  latitude: volunteer.location.latitude,
                  longitude: volunteer.location.longitude,
                }}
                title={volunteer.name}
                description={`技能: ${volunteer.skills.join(', ')}`}
                pinColor="blue"
              />
            ))}
            
            {/* 求助请求标记 */}
            {helpRequests.map(request => (
              <Marker
                key={request.id}
                coordinate={{
                  latitude: request.location.latitude,
                  longitude: request.location.longitude,
                }}
                title={request.title}
                description={`紧急程度: ${request.urgency}`}
                pinColor={request.urgency === 'emergency' ? 'red' : 'orange'}
              />
            ))}
          </MapView>
        </View>
      )}

      {/* 标签切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'volunteers' && styles.activeTab]}
          onPress={() => setSelectedTab('volunteers')}>
          <Text style={[styles.tabText, selectedTab === 'volunteers' && styles.activeTabText]}>
            附近志愿者 ({nearbyVolunteers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'requests' && styles.activeTab]}
          onPress={() => setSelectedTab('requests')}>
          <Text style={[styles.tabText, selectedTab === 'requests' && styles.activeTabText]}>
            求助请求 ({urgentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 内容列表 */}
      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {selectedTab === 'volunteers' ? (
          <View style={styles.volunteersContainer}>
            {nearbyVolunteers.length > 0 ? (
              nearbyVolunteers.map(volunteer => (
                <VolunteerCard
                  key={volunteer.id}
                  volunteer={volunteer}
                  onPress={() => handleVolunteerPress(volunteer)}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>附近暂无志愿者</Text>
            )}
          </View>
        ) : (
          <View style={styles.requestsContainer}>
            {urgentRequests.length > 0 ? (
              urgentRequests.map(request => (
                <HelpRequestCard
                  key={request.id}
                  request={request}
                  onPress={() => handleRequestPress(request)}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>暂无紧急求助</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    height: 300,
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  volunteersContainer: {
    gap: 10,
  },
  requestsContainer: {
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VolunteerMatchingScreen;

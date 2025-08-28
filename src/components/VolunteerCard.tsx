import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Volunteer} from '../types';

interface VolunteerCardProps {
  volunteer: Volunteer;
  onPress: () => void;
}

const VolunteerCard: React.FC<VolunteerCardProps> = ({volunteer, onPress}) => {
  const getUrgencyColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 4.0) return '#8BC34A';
    if (rating >= 3.5) return '#FFC107';
    return '#FF5722';
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? '#4CAF50' : '#9E9E9E';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {volunteer.avatar ? (
            <Image source={{uri: volunteer.avatar}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={32} color="#ccc" />
            </View>
          )}
          <View style={[
            styles.statusIndicator,
            {backgroundColor: getStatusColor(volunteer.isOnline)}
          ]} />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{volunteer.name}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFC107" />
              <Text style={styles.rating}>{volunteer.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <View style={styles.skillsContainer}>
            {volunteer.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {volunteer.skills.length > 3 && (
              <Text style={styles.moreSkills}>+{volunteer.skills.length - 3}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.callButton}>
            <Icon name="phone" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButton}>
            <Icon name="message" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {volunteer.location.address || '位置信息获取中...'}
          </Text>
        </View>
        
        <View style={styles.availabilityContainer}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.availabilityText}>
            {volunteer.availability.weekdays ? '工作日' : ''}
            {volunteer.availability.weekends ? ' 周末' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  actionContainer: {
    justifyContent: 'center',
    gap: 8,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default VolunteerCard;

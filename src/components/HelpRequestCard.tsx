import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {HelpRequest} from '../types';

interface HelpRequestCardProps {
  request: HelpRequest;
  onPress: () => void;
}

const HelpRequestCard: React.FC<HelpRequestCardProps> = ({request, onPress}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return '#ff3b30';
      case 'high':
        return '#ff9500';
      case 'medium':
        return '#ffcc00';
      case 'low':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return '紧急';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9500';
      case 'accepted':
        return '#007aff';
      case 'in_progress':
        return '#4caf50';
      case 'completed':
        return '#34c759';
      case 'cancelled':
        return '#ff3b30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'accepted':
        return '已接受';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {request.title}
          </Text>
          <View style={styles.urgencyContainer}>
            <View style={[
              styles.urgencyBadge,
              {backgroundColor: getUrgencyColor(request.urgency)}
            ]}>
              <Text style={styles.urgencyText}>
                {getUrgencyText(request.urgency)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(request.status)}
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(request.status)}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={3}>
        {request.description}
      </Text>
      
      <View style={styles.categoryContainer}>
        <Icon name="category" size={16} color="#666" />
        <Text style={styles.categoryText}>{request.category}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {request.location.address}
          </Text>
        </View>
        
        <View style={styles.timeContainer}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.timeText}>
            {formatTime(request.createdAt)}
          </Text>
        </View>
      </View>
      
      {request.estimatedDuration && (
        <View style={styles.durationContainer}>
          <Icon name="timer" size={16} color="#666" />
          <Text style={styles.durationText}>
            预计时长：{request.estimatedDuration}小时
          </Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  urgencyContainer: {
    alignSelf: 'flex-start',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
});

export default HelpRequestCard;

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useVolunteerStore} from '../stores/volunteerStore';

const EmergencyScreen: React.FC = () => {
  const {currentLocation} = useVolunteerStore();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const emergencyContacts = [
    {
      name: '报警电话',
      number: '110',
      icon: 'local-police',
      color: '#ff3b30',
    },
    {
      name: '急救电话',
      number: '120',
      icon: 'local-hospital',
      color: '#ff9500',
    },
    {
      name: '消防电话',
      number: '119',
      icon: 'local-fire-department',
      color: '#ff3b30',
    },
    {
      name: '交通事故',
      number: '122',
      icon: 'directions-car',
      color: '#007aff',
    },
  ];

  const quickActions = [
    {
      title: '发送位置',
      description: '向紧急联系人发送当前位置',
      icon: 'location-on',
      action: () => sendLocation(),
    },
    {
      title: '一键求助',
      description: '向附近志愿者发送紧急求助',
      icon: 'sos',
      action: () => sendEmergencyRequest(),
    },
    {
      title: '联系家人',
      description: '快速联系紧急联系人',
      icon: 'family-restroom',
      action: () => contactFamily(),
    },
    {
      title: '医疗信息',
      description: '显示个人医疗信息',
      icon: 'medical-services',
      action: () => showMedicalInfo(),
    },
  ];

  const handleEmergencyCall = (contact: typeof emergencyContacts[0]) => {
    Alert.alert(
      '紧急呼叫',
      `是否要拨打${contact.name}？`,
      [
        {text: '取消', style: 'cancel'},
        {
          text: '拨打',
          onPress: () => {
            Linking.openURL(`tel:${contact.number}`);
          },
        },
      ]
    );
  };

  const sendLocation = () => {
    if (currentLocation) {
      Alert.alert(
        '发送位置',
        `当前位置：${currentLocation.address}`,
        [
          {text: '取消', style: 'cancel'},
          {text: '发送', onPress: () => {
            // 实现发送位置逻辑
            console.log('发送位置信息');
          }},
        ]
      );
    } else {
      Alert.alert('错误', '无法获取当前位置');
    }
  };

  const sendEmergencyRequest = () => {
    Alert.alert(
      '紧急求助',
      '是否要向附近志愿者发送紧急求助？',
      [
        {text: '取消', style: 'cancel'},
        {text: '发送', onPress: () => {
          setIsEmergencyMode(true);
          // 实现紧急求助逻辑
          console.log('发送紧急求助');
        }},
      ]
    );
  };

  const contactFamily = () => {
    Alert.alert(
      '联系家人',
      '选择要联系的家庭成员',
      [
        {text: '取消', style: 'cancel'},
        {text: '爸爸', onPress: () => Linking.openURL('tel:13800138000')},
        {text: '妈妈', onPress: () => Linking.openURL('tel:13800138001')},
        {text: '配偶', onPress: () => Linking.openURL('tel:13800138002')},
      ]
    );
  };

  const showMedicalInfo = () => {
    Alert.alert(
      '医疗信息',
      '血型：A型\n过敏史：无\n慢性病：无\n紧急联系人：张三 13800138000',
      [{text: '确定', style: 'default'}]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 紧急模式指示器 */}
      {isEmergencyMode && (
        <View style={styles.emergencyModeIndicator}>
          <Icon name="warning" size={24} color="white" />
          <Text style={styles.emergencyModeText}>紧急模式已激活</Text>
        </View>
      )}

      {/* 紧急联系人 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>紧急联系电话</Text>
        <View style={styles.contactsGrid}>
          {emergencyContacts.map(contact => (
            <TouchableOpacity
              key={contact.number}
              style={[styles.contactCard, {borderLeftColor: contact.color}]}
              onPress={() => handleEmergencyCall(contact)}>
              <Icon name={contact.icon} size={32} color={contact.color} />
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>{contact.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 快速操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快速操作</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.action}>
              <Icon name={action.icon} size={32} color="#007aff" />
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 安全提示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>安全提示</Text>
        <View style={styles.tipsContainer}>
          <Text style={styles.tipText}>
            • 保持冷静，不要惊慌失措
          </Text>
          <Text style={styles.tipText}>
            • 优先拨打相应的紧急电话
          </Text>
          <Text style={styles.tipText}>
            • 准确描述事发地点和情况
          </Text>
          <Text style={styles.tipText}>
            • 在安全的情况下等待救援
          </Text>
        </View>
      </View>

      {/* 退出紧急模式 */}
      {isEmergencyMode && (
        <TouchableOpacity
          style={styles.exitEmergencyButton}
          onPress={() => setIsEmergencyMode(false)}>
          <Text style={styles.exitEmergencyButtonText}>退出紧急模式</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emergencyModeIndicator: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emergencyModeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007aff',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  tipsContainer: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  exitEmergencyButton: {
    backgroundColor: '#ff3b30',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitEmergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyScreen;

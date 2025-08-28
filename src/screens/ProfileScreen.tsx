import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useVolunteerStore} from '../stores/volunteerStore';

const ProfileScreen: React.FC = () => {
  const {currentLocation} = useVolunteerStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const profileSections = [
    {
      title: '个人信息',
      items: [
        {
          icon: 'person',
          title: '个人资料',
          subtitle: '查看和编辑个人信息',
          action: () => editProfile(),
        },
        {
          icon: 'verified-user',
          title: '实名认证',
          subtitle: '完成实名认证',
          action: () => verifyIdentity(),
        },
        {
          icon: 'badge',
          title: '志愿者证书',
          subtitle: '查看获得的证书',
          action: () => viewCertificates(),
        },
      ],
    },
    {
      title: '设置',
      items: [
        {
          icon: 'notifications',
          title: '消息通知',
          subtitle: '管理推送通知设置',
          action: () => {},
          toggle: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: 'location-on',
          title: '位置服务',
          subtitle: '管理位置权限',
          action: () => {},
          toggle: (
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={locationEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: 'dark-mode',
          title: '深色模式',
          subtitle: '切换深色主题',
          action: () => {},
          toggle: (
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={darkModeEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          ),
        },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        {
          icon: 'help',
          title: '使用帮助',
          subtitle: '查看使用说明',
          action: () => showHelp(),
        },
        {
          icon: 'feedback',
          title: '意见反馈',
          subtitle: '提交建议和问题',
          action: () => submitFeedback(),
        },
        {
          icon: 'contact-support',
          title: '联系客服',
          subtitle: '获取在线帮助',
          action: () => contactSupport(),
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          icon: 'info',
          title: '关于我们',
          subtitle: '应用版本和介绍',
          action: () => showAbout(),
        },
        {
          icon: 'privacy-tip',
          title: '隐私政策',
          subtitle: '查看隐私保护条款',
          action: () => showPrivacyPolicy(),
        },
        {
          icon: 'logout',
          title: '退出登录',
          subtitle: '安全退出应用',
          action: () => logout(),
          danger: true,
        },
      ],
    },
  ];

  const editProfile = () => {
    Alert.alert('编辑资料', '跳转到个人资料编辑页面');
  };

  const verifyIdentity = () => {
    Alert.alert('实名认证', '跳转到实名认证页面');
  };

  const viewCertificates = () => {
    Alert.alert('志愿者证书', '查看获得的证书列表');
  };

  const showHelp = () => {
    Alert.alert('使用帮助', '显示使用说明和常见问题');
  };

  const submitFeedback = () => {
    Alert.alert('意见反馈', '跳转到反馈提交页面');
  };

  const contactSupport = () => {
    Alert.alert('联系客服', '获取在线客服帮助');
  };

  const showAbout = () => {
    Alert.alert('关于我们', '乐呼志愿者匹配 v1.0.0\n让爱心传递，让世界更美好');
  };

  const showPrivacyPolicy = () => {
    Alert.alert('隐私政策', '查看隐私保护条款');
  };

  const logout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        {text: '取消', style: 'cancel'},
        {text: '退出', style: 'destructive', onPress: () => {
          console.log('用户退出登录');
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息头部 */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Icon name="account-circle" size={80} color="#007aff" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>张三</Text>
          <Text style={styles.userPhone}>138****8888</Text>
          <Text style={styles.userLocation}>
            {currentLocation?.address || '位置信息获取中...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={20} color="#007aff" />
        </TouchableOpacity>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>帮助次数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>评分</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>证书</Text>
        </View>
      </View>

      {/* 功能列表 */}
      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={styles.menuItem}
              onPress={item.action}>
              <View style={styles.menuItemLeft}>
                <Icon 
                  name={item.icon} 
                  size={24} 
                  color={item.danger ? '#ff3b30' : '#007aff'} 
                />
                <View style={styles.menuItemContent}>
                  <Text style={[
                    styles.menuItemTitle,
                    item.danger && styles.menuItemTitleDanger
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              {item.toggle ? (
                item.toggle
              ) : (
                <Icon name="chevron-right" size={24} color="#ccc" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007aff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  menuItemTitleDanger: {
    color: '#ff3b30',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;

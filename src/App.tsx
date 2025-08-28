import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

// 导入屏幕
import VolunteerMatchingScreen from './screens/VolunteerMatchingScreen';
import VoiceChatScreen from './screens/VoiceChatScreen';
import CommunityNewsScreen from './screens/CommunityNewsScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import ProfileScreen from './screens/ProfileScreen';

// 导入图标
import Icon from 'react-native-vector-icons/MaterialIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          switch (route.name) {
            case 'VolunteerMatching':
              iconName = 'people';
              break;
            case 'VoiceChat':
              iconName = 'chat';
              break;
            case 'CommunityNews':
              iconName = 'article';
              break;
            case 'Emergency':
              iconName = 'emergency';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen 
        name="VolunteerMatching" 
        component={VolunteerMatchingScreen}
        options={{title: '志愿者匹配'}}
      />
      <Tab.Screen 
        name="VoiceChat" 
        component={VoiceChatScreen}
        options={{title: '语音聊天'}}
      />
      <Tab.Screen 
        name="CommunityNews" 
        component={CommunityNewsScreen}
        options={{title: '社区新闻'}}
      />
      <Tab.Screen 
        name="Emergency" 
        component={EmergencyScreen}
        options={{title: '紧急求助'}}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{title: '个人中心'}}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{headerShown: false}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

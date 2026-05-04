import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

export default function TabLayout() {
  let tabBarStyle = {
    backgroundColor: '#FDF8F3',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
    height: Platform.OS === 'web' ? 'auto' : 60,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#6F4E37',
        tabBarInactiveTintColor: '#9E8B7D',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: '知识库',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="book-open" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

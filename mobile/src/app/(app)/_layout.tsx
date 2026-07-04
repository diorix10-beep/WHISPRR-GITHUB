import { Tabs } from 'expo-router';
import { useColorScheme, Image } from 'react-native';
import { Colors } from '../../constants/theme';

export default function AppLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.primary,
          fontSize: 22,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'WHISPRR',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../../../assets/images/tabIcons/home.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Oracle',
          headerTitle: 'Oracle Center',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../../../assets/images/tabIcons/explore.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerTitle: 'Inbox',
          headerShown: false, // We'll manage header inside messages Stack
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../../../assets/images/tabIcons/explore.png')}
              style={{ width: size, height: size, tintColor: color, transform: [{ rotate: '90deg' }] }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../../../assets/images/tabIcons/profile.png')}
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

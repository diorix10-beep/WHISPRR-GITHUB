import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../../constants/theme';

export default function CommunitiesLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.primary,
          fontSize: 18,
          fontFamily: 'Cormorant Garamond',
        },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Communities',
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Community',
          headerShown: true
        }} 
      />
    </Stack>
  );
}

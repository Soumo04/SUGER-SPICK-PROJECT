import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);


import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FoodLogScreen from './src/screens/FoodLogScreen';
import ChatScreen from './src/screens/ChatScreen';
import ExportScreen from './src/screens/ExportScreen';
import AdminScreen from './src/screens/AdminScreen';
import { COLORS } from './src/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator for patient users
function MainTabs({ route }) {
  const user = route?.params?.user || {};
  return (
    <Tab.Navigator
      screenOptions={({ route: r }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fffcf7',
          borderTopColor: '#dcd3be',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#5c483a',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: '#9a8d82',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            'Food Log': focused ? 'scan' : 'scan-outline',
            'AI Chat': focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            Export: focused ? 'document-text' : 'document-text-outline',
          };
          return <Ionicons name={icons[r.name] || 'circle'} size={22} color={color} />;
        },
      })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} initialParams={{ user }} />
      <Tab.Screen name="Food Log" component={FoodLogScreen} initialParams={{ user }} />
      <Tab.Screen name="AI Chat" component={ChatScreen} initialParams={{ user }} />
      <Tab.Screen name="Export" component={ExportScreen} initialParams={{ user }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Admin" component={AdminScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

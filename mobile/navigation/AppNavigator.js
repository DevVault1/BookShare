import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'

// Screens
import SplashScreenView from '../screens/SplashScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import HomeScreen from '../screens/HomeScreen'
import BrowseScreen from '../screens/BrowseScreen'
import BookDetailScreen from '../screens/BookDetailScreen'
import ChatScreen from '../screens/ChatScreen'
import ProfileScreen from '../screens/ProfileScreen'
import DonationHistoryScreen from '../screens/DonationHistoryScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Browse: focused ? 'search' : 'search-outline',
            Chat: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Profile: focused ? 'person' : 'person-outline',
          }
          return <Ionicons name={icons[route.name]} size={size} color={color} />
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f3f4f6', paddingBottom: 5 },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Adopt A Book' }} />
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse Books' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { user } = useAuthStore()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ headerShown: true, title: 'Book Details', headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#2563eb' }} />
          <Stack.Screen name="DonationHistory" component={DonationHistoryScreen} options={{ headerShown: true, title: 'Donation History' }} />
        </>
      )}
    </Stack.Navigator>
  )
}

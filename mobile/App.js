import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import AppNavigator from './navigation/AppNavigator'
import { useAuthStore } from './store/authStore'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const { fetchMe } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        await fetchMe()
      } catch {}
      setReady(true)
      await SplashScreen.hideAsync()
    }
    init()
  }, [])

  if (!ready) return null

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type {
  AppTabsParamList,
  AuthStackParamList,
  RootStackParamList,
} from './types';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TwoFactorScreen } from '../screens/auth/TwoFactorScreen';
import { BooksScreen } from '../screens/main/BooksScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { DonateBookScreen } from '../screens/main/DonateBookScreen';
import { ChatListScreen } from '../screens/main/ChatListScreen';
import { ChatRoomScreen } from '../screens/main/ChatRoomScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { BookDetailScreen } from '../screens/main/BookDetailScreen';
import { ReportsCenterScreen } from '../screens/main/ReportsCenterScreen';
import { AdminPanelScreen } from '../screens/admin/AdminPanelScreen';
import { getAppColors } from '../theme/colors';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const BooksTabIcon = () => <Text style={styles.tabIcon}>📚</Text>;
const DashboardTabIcon = () => <Text style={styles.tabIcon}>📊</Text>;
const DonateTabIcon = () => <Text style={styles.tabIcon}>🎁</Text>;
const ChatTabIcon = () => <Text style={styles.tabIcon}>💬</Text>;
const ProfileTabIcon = () => <Text style={styles.tabIcon}>👤</Text>;

const AppTabs = () => {
  const colors = getAppColors(useColorScheme());

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen name="Books" component={BooksScreen} options={{ tabBarIcon: BooksTabIcon }} />
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: DashboardTabIcon }} />
      <Tabs.Screen name="Donate" component={DonateBookScreen} options={{ tabBarIcon: DonateTabIcon }} />
      <Tabs.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: ChatTabIcon }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ProfileTabIcon }} />
    </Tabs.Navigator>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="TwoFactor" component={TwoFactorScreen} />
  </AuthStack.Navigator>
);

const AppNavigator = () => {
  const colors = getAppColors(useColorScheme());

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <RootStack.Screen
        name="AppTabs"
        component={AppTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Details' }} />
      <RootStack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Conversation' }} />
      <RootStack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Admin Panel' }} />
      <RootStack.Screen name="ReportsCenter" component={ReportsCenterScreen} options={{ title: 'Safety Reports' }} />
    </RootStack.Navigator>
  );
};

export const RootNavigator = () => {
  const { user, hasHydrated, bootstrapSession } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = getAppColors(colorScheme);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      if (!hasHydrated) return;
      await bootstrapSession();
      if (mounted) setBooting(false);
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, [hasHydrated, bootstrapSession]);

  const loading = useMemo(() => !hasHydrated || booting, [booting, hasHydrated]);
  const navigationTheme = useMemo<NavigationTheme>(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.destructive,
      },
    };
  }, [colorScheme, colors]);

  if (loading) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.mutedForeground }]}>Preparing BookShare mobile workspace...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 13,
  },
  tabIcon: {
    fontSize: 16,
  },
});

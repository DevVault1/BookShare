import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../../components/ui/AppScreen';
import { FormInput } from '../../components/ui/FormInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../api/config';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginNav>();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const openSocialLogin = async (provider: 'google' | 'facebook') => {
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const target = `${baseUrl}/api/oauth/${provider}/start?next=/dashboard`;
    const canOpen = await Linking.canOpenURL(target);
    if (!canOpen) {
      Alert.alert('Unavailable', 'Could not open social login in browser.');
      return;
    }
    Linking.openURL(target).catch(() => {
      Alert.alert('Error', 'Failed to launch social login.');
    });
  };

  const handleLogin = async () => {
    setError('');
    try {
      const response = await login(email.trim(), password);
      if (response.requiresTwoFactor && response.pendingToken) {
        navigation.navigate('TwoFactor', {
          pendingToken: response.pendingToken,
          method: response.method || 'email',
          destinationHint: response.destinationHint,
        });
      }
    } catch (authError: unknown) {
      setError(authError instanceof Error ? authError.message : 'Login failed');
    }
  };

  return (
    <AppScreen
      title="Welcome Back"
      subtitle="Sign in to continue managing books, requests, donations, reviews, and chat."
      scroll={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.card}>
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
        />

        <FormInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Your password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Sign In"
          onPress={handleLogin}
          loading={isLoading}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <PrimaryButton
          label="Continue with Google"
          variant="secondary"
          onPress={() => openSocialLogin('google')}
        />

        <View style={styles.buttonSpacer} />

        <PrimaryButton
          label="Continue with Facebook"
          variant="secondary"
          onPress={() => openSocialLogin('facebook')}
        />

        <View style={styles.buttonSpacer} />

        <PrimaryButton
          label="Create Account"
          variant="ghost"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  error: {
    color: '#dc2828',
    marginBottom: 10,
    fontSize: 13,
  },
  dividerRow: {
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonSpacer: {
    height: 8,
  },
});

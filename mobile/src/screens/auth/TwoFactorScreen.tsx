import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AppScreen } from '../../components/ui/AppScreen';
import { FormInput } from '../../components/ui/FormInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'TwoFactor'>;

export const TwoFactorScreen = ({ route }: Props) => {
  const { pendingToken, destinationHint, method } = route.params;
  const { verifyTwoFactorLogin, resendTwoFactorLogin, isLoading } = useAuthStore();
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('Enter the 6-digit verification code to continue.');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setError('');
    try {
      await verifyTwoFactorLogin(pendingToken, code.trim());
    } catch (verifyError: unknown) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verification failed');
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const result = await resendTwoFactorLogin(pendingToken);
      setInfo(result.message || 'A fresh verification code has been sent.');
    } catch (resendError: unknown) {
      setError(resendError instanceof Error ? resendError.message : 'Failed to resend code');
    }
  };

  return (
    <AppScreen
      title="Two-Factor Verification"
      subtitle={`Method: ${method.toUpperCase()}${destinationHint ? ` • ${destinationHint}` : ''}`}
      scroll={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.info}>{info}</Text>

        <FormInput
          label="Verification Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Verify"
          onPress={handleVerify}
          loading={isLoading}
          disabled={code.trim().length < 6}
        />

        <View style={styles.spacer} />

        <PrimaryButton
          label="Resend Code"
          variant="ghost"
          onPress={handleResend}
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
  info: {
    color: '#1f2937',
    fontSize: 13,
    marginBottom: 10,
  },
  error: {
    color: '#dc2828',
    marginBottom: 10,
    fontSize: 13,
  },
  spacer: {
    height: 8,
  },
});

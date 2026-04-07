import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../../components/ui/AppScreen';
import { FormInput } from '../../components/ui/FormInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TagChip } from '../../components/ui/TagChip';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const roles: Array<'student' | 'donor'> = ['student', 'donor'];

export const RegisterScreen = () => {
  const navigation = useNavigation<RegisterNav>();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'student' | 'donor'>('student');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    try {
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        location: location.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (data.requiresTwoFactor && data.pendingToken) {
        navigation.navigate('TwoFactor', {
          pendingToken: data.pendingToken,
          method: data.method || 'email',
          destinationHint: data.destinationHint,
        });
      }
    } catch (registerError: unknown) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed');
    }
  };

  return (
    <AppScreen
      title="Create Account"
      subtitle="Join BookShare to donate and adopt books with secure messaging and trust features."
    >
      <View style={styles.card}>
        <FormInput label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
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
          placeholder="At least 6 characters"
        />
        <FormInput label="Location" value={location} onChangeText={setLocation} placeholder="Colombo" />
        <FormInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="+94..."
        />

        <Text style={styles.roleLabel}>Role</Text>
        <View style={styles.roleRow}>
          {roles.map((item) => (
            <TagChip
              key={item}
              label={item}
              selected={role === item}
              onPress={() => setRole(item)}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Create Account" onPress={handleRegister} loading={isLoading} />

        <View style={styles.spacer} />

        <PrimaryButton
          label="Back to Login"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  roleLabel: {
    marginTop: 2,
    marginBottom: 8,
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
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

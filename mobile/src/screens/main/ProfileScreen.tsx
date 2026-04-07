import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppScreen } from '../../components/ui/AppScreen';
import { FormInput } from '../../components/ui/FormInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { booksApi, authApi } from '../../api/services';
import { extractApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { Book } from '../../types/domain';
import type { RootStackParamList } from '../../navigation/types';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
}

export const ProfileScreen = () => {
  const navigation = useNavigation<RootNav>();
  const { user, refreshMe, clearSession } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState((user?.interests || []).join(', '));
  const [image, setImage] = useState<PickedImage | null>(null);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const items = await booksApi.getRecommendations();
        setRecommendations(items);
      } catch {
        setRecommendations([]);
      }
    };
    loadRecommendations();
  }, []);

  useEffect(() => {
    setName(user?.name || '');
    setLocation(user?.location || '');
    setPhoneNumber(user?.phoneNumber || '');
    setBio(user?.bio || '');
    setInterests((user?.interests || []).join(', '));
  }, [user]);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setImage({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const body = new FormData();
      body.append('name', name.trim());
      body.append('location', location.trim());
      body.append('phoneNumber', phoneNumber.trim());
      body.append('bio', bio.trim());
      body.append('interests', interests.trim());

      if (image?.uri) {
        body.append('profileImage', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `profile-${Date.now()}.jpg`,
        } as never);
      }

      await authApi.updateProfile(body);
      await refreshMe();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (saveError: unknown) {
      Alert.alert('Update failed', extractApiError(saveError, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AppScreen
      title="Profile and Settings"
      subtitle="Manage account details, donor reputation, personalized recommendations, and admin/report tools."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        {image?.uri ? <Image source={{ uri: image.uri }} style={styles.avatar} /> : null}
        {!image?.uri && user?.profileImage ? <Image source={{ uri: user.profileImage }} style={styles.avatar} /> : null}
        <PrimaryButton label="Choose Profile Image" variant="ghost" onPress={pickImage} />

        <View style={styles.spacer} />

        <FormInput label="Name" value={name} onChangeText={setName} />
        <FormInput label="Location" value={location} onChangeText={setLocation} />
        <FormInput label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
        <FormInput label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} />
        <FormInput
          label="Interests"
          value={interests}
          onChangeText={setInterests}
          placeholder="Science, Technology, Fiction"
        />

        <PrimaryButton label="Save Profile" onPress={saveProfile} loading={saving} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trust and Reputation</Text>
        <Text style={styles.metric}>Role: {user?.role || 'N/A'}</Text>
        <Text style={styles.metric}>2FA: {user?.twoFactorEnabled ? `Enabled (${user.twoFactorMethod})` : 'Disabled'}</Text>
        <Text style={styles.metric}>Reputation Score: {user?.donorReputation?.overallScore?.toFixed(1) || 'New'}</Text>
        <Text style={styles.metric}>Response Speed: {user?.donorReputation?.responseSpeedScore?.toFixed(1) || 'N/A'}</Text>
        <Text style={styles.metric}>Accuracy: {user?.donorReputation?.accuracyScore?.toFixed(1) || 'N/A'}</Text>
        <Text style={styles.metric}>Feedback: {user?.donorReputation?.receiverFeedbackScore?.toFixed(1) || 'N/A'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommended Books</Text>
        {recommendations.length === 0 ? (
          <Text style={styles.muted}>No recommendations yet. Add interests for better matching.</Text>
        ) : (
          recommendations.map((item) => (
            <View key={item._id} style={styles.recoRow}>
              <Text style={styles.recoTitle}>{item.title}</Text>
              <Text style={styles.recoMeta}>{item.author} • {item.category}</Text>
              <PrimaryButton
                label="Open"
                variant="ghost"
                onPress={() => navigation.navigate('BookDetail', { bookId: item._id })}
              />
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Safety and Admin</Text>
        <PrimaryButton
          label="Open Reports Center"
          variant="secondary"
          onPress={() => navigation.navigate('ReportsCenter')}
        />

        {user?.role === 'admin' ? (
          <View style={styles.spacer}>
            <PrimaryButton label="Open Admin Panel" onPress={() => navigation.navigate('AdminPanel')} />
          </View>
        ) : null}

        <View style={styles.spacer}>
          <PrimaryButton label="Logout" variant="danger" onPress={logout} />
        </View>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
  },
  spacer: {
    marginTop: 8,
  },
  metric: {
    color: '#374151',
    marginBottom: 3,
    fontSize: 13,
  },
  muted: {
    color: '#6b7280',
    fontSize: 13,
  },
  recoRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginTop: 10,
  },
  recoTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  recoMeta: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
});

import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../store/authStore'

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  const menuItems = [
    { icon: 'book-outline', label: 'My Donated Books', onPress: () => {} },
    { icon: 'heart-outline', label: 'My Requests', onPress: () => {} },
    { icon: 'gift-outline', label: 'Donation History', onPress: () => navigation.navigate('DonationHistory') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <LinearGradient colors={['#1d4ed8', '#2563eb']} style={styles.header}>
        <View style={styles.avatarWrap}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.name?.[0] || '?'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
        {user?.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#bfdbfe" />
            <Text style={styles.location}>{user.location}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Books Given', value: '—' },
          { label: 'Books Received', value: '—' },
          { label: 'Requests', value: '—' },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuIconWrap}>
              <Ionicons name={item.icon} size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 48 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  editBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1d4ed8', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { color: '#bfdbfe', fontSize: 14, marginBottom: 10 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  roleText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { color: '#bfdbfe', fontSize: 13 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -20, borderRadius: 18, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: 'center' },
  menu: { backgroundColor: '#fff', borderRadius: 18, margin: 20, marginBottom: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 14 },
  menuIconWrap: { width: 38, height: 38, backgroundColor: '#eff6ff', borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
})

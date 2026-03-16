import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

export default function SplashScreenView() {
  return (
    <LinearGradient colors={['#1d4ed8', '#2563eb', '#3b82f6']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="book" size={52} color="#2563eb" />
        </View>
        <Text style={styles.title}>Adopt A Book</Text>
        <Text style={styles.tagline}>Give books a second life</Text>
        <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 40 }} />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  icon: { width: 100, height: 100, backgroundColor: '#fff', borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tagline: { color: '#bfdbfe', marginTop: 8, fontSize: 16 },
})

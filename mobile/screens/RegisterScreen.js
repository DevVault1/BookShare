import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/authStore'

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', location: '' })
  const [showPass, setShowPass] = useState(false)
  const { register, isLoading } = useAuthStore()

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Please fill required fields')
    try {
      await register(form)
    } catch (err) {
      Alert.alert('Registration Failed', err.message)
    }
  }

  return (
    <LinearGradient colors={['#1d4ed8', '#2563eb', '#3b82f6']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="book" size={32} color="#2563eb" />
            </View>
            <Text style={styles.logoText}>Adopt A Book</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the book-sharing community</Text>

            {/* Role picker */}
            <View style={styles.roleRow}>
              {['student', 'donor'].map(role => (
                <TouchableOpacity key={role} onPress={() => update('role', role)}
                  style={[styles.roleBtn, form.role === role && styles.roleBtnActive]}>
                  <Text style={[styles.roleBtnText, form.role === role && styles.roleBtnTextActive]}>
                    I'm a {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {[
              { key: 'name', icon: 'person-outline', placeholder: 'Full Name', type: 'default' },
              { key: 'email', icon: 'mail-outline', placeholder: 'Email Address', type: 'email-address' },
              { key: 'location', icon: 'location-outline', placeholder: 'City, Country (optional)', type: 'default' },
            ].map(({ key, icon, placeholder, type }) => (
              <View key={key} style={styles.inputWrap}>
                <Ionicons name={icon} size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor="#9ca3af"
                  value={form[key]}
                  onChangeText={val => update(key, val)}
                  keyboardType={type}
                  autoCapitalize={key === 'email' ? 'none' : 'words'}
                />
              </View>
            ))}

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="Password (min 6 chars)"
                placeholderTextColor="#9ca3af"
                value={form.password}
                onChangeText={val => update('password', val)}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoIcon: { width: 64, height: 64, backgroundColor: '#fff', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logoText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { color: '#6b7280', marginBottom: 20, fontSize: 14 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: { flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  roleBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  roleBtnText: { color: '#6b7280', fontWeight: '600', textTransform: 'capitalize' },
  roleBtnTextActive: { color: '#2563eb' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, marginBottom: 12, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#111827' },
  eyeBtn: { position: 'absolute', right: 14 },
  btn: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkWrap: { marginTop: 18, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
  link: { color: '#2563eb', fontWeight: '600' },
})

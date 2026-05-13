// ─── IMPORTS ───
// SecureStore for saving token and user info
import * as SecureStore from 'expo-secure-store';
// axios for making API requests
import axios from 'axios';
// useRouter for navigation
import { useRouter } from 'expo-router';
// React hooks
import { useState } from 'react';
// React Native components
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
// Notification utility functions
import {
  registerForPushNotifications,
  sendLocalNotification
} from '../utils/notifications';

// ─── CONFIGURATION ───
const API = 'http://192.168.0.105:5000/api';

export default function LoginScreen() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [email, setEmail] = useState('');           // Email input
  const [password, setPassword] = useState('');     // Password input
  const [loading, setLoading] = useState(false);    // Loading spinner
  const [showPassword, setShowPassword] = useState(false); // Toggle password

  // ─── HANDLE LOGIN ───
  // Sends login request to backend
  const handleLogin = async () => {
    // Validate fields are not empty
    if (!email || !password) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    setLoading(true);
    try {
      // Send login request to backend
      const res = await axios.post(`${API}/auth/login`, { email, password });

      // Save token to SecureStore for future requests
      await SecureStore.setItemAsync('token', res.data.token);

      // Save user info to SecureStore
      await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));

      // ── Request notification permission ──
      // No push token needed - local notifications only
      await registerForPushNotifications();

      // ── Send welcome notification ──
      await sendLocalNotification(
        '👋 Welcome Back!',
        `Hello ${res.data.user.name}! You are now logged in.`
      );

      // Navigate based on user role
      if (res.data.user.role === 'instructor') {
        router.replace('/show-qr');
      } else {
        router.replace('/scan-qr');
      }

    } catch (err) {
      Alert.alert(
        'Login Failed',
        err.response?.data?.error || err.message || 'Server error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ───
  return (
    // KeyboardAvoidingView pushes content up when keyboard opens
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HEADER SECTION ── */}
        <View style={styles.header}>

          {/* App Logo Circle */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>📋</Text>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>Smart Attendance</Text>

          {/* App Tagline */}
          <Text style={styles.tagline}>
            Track attendance with QR codes
          </Text>
        </View>

        {/* ── LOGIN FORM ── */}
        <View style={styles.formBox}>

          {/* Form Title */}
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          {/* ── EMAIL INPUT ── */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            {/* Email icon */}
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* ── PASSWORD INPUT ── */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            {/* Lock icon */}
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            {/* Show/hide password toggle */}
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── LOGIN BUTTON ── */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.loginBtnText}>Login →</Text>
            )}
          </TouchableOpacity>

          {/* ── DIVIDER ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── REGISTER LINK ── */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerBtnText}>
              Create New Account
            </Text>
          </TouchableOpacity>

        </View>

        {/* ── FOOTER ── */}
        <Text style={styles.footer}>
          Smart Attendance System v1.0
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Main scroll container - dark background
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'center'
  },

  // Header section container
  header: {
    alignItems: 'center',
    marginBottom: 32
  },

  // Logo circle background
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#38bdf8'
  },

  // Logo emoji
  logoEmoji: {
    fontSize: 36
  },

  // App name - large blue bold
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8
  },

  // App tagline - small gray
  tagline: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center'
  },

  // Form container box
  formBox: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24
  },

  // Form title
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },

  // Form subtitle
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24
  },

  // Field label
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8
  },

  // Input row with icon
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    paddingHorizontal: 12
  },

  // Input icon
  inputIcon: {
    fontSize: 18,
    marginRight: 8
  },

  // Eye icon for password toggle
  eyeIcon: {
    fontSize: 18,
    padding: 4
  },

  // Text input field
  input: {
    flex: 1,
    color: '#fff',
    padding: 14,
    fontSize: 16
  },

  // Login button - blue gradient style
  loginBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },

  // Disabled login button
  loginBtnDisabled: {
    opacity: 0.7
  },

  // Login button text
  loginBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Divider container
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },

  // Divider line
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155'
  },

  // Divider text
  dividerText: {
    color: '#64748b',
    marginHorizontal: 12,
    fontSize: 14
  },

  // Register button - outlined style
  registerBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Register button text
  registerBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Footer text
  footer: {
    color: '#334155',
    textAlign: 'center',
    fontSize: 12
  },
});
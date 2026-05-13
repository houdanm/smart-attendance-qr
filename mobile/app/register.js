// ─── IMPORTS ───
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

// ─── CONFIGURATION ───
const API = 'http://192.168.0.105:5000/api';

// ─── SUBJECTS LIST ───
// Available subjects for instructors to choose from
const SUBJECTS = [
  'Mathematics', 'Science', 'English',
  'History', 'Physics', 'Chemistry',
  'Biology', 'Computer Science'
];

export default function RegisterScreen() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [name, setName] = useState('');              // Full name input
  const [email, setEmail] = useState('');            // Email input
  const [password, setPassword] = useState('');      // Password input
  const [confirmPassword, setConfirmPassword] = useState(''); // Confirm password
  const [role, setRole] = useState('student');       // Selected role
  const [subject, setSubject] = useState('');        // Selected subject
  const [loading, setLoading] = useState(false);     // Loading spinner
  const [showPassword, setShowPassword] = useState(false); // Toggle password

  // ─── VALIDATE FIELDS ───
  // Checks all fields are valid before submitting
  const validate = () => {
    // Check name is not empty
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    // Check email is not empty
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    // Check email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Check password is at least 6 characters
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Check instructors have selected a subject
    if (role === 'instructor' && !subject) {
      Alert.alert('Error', 'Please select your subject');
      return false;
    }

    return true;
  };

  // ─── GET PASSWORD STRENGTH ───
  // Returns strength level based on password length
  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
  };

  // ─── HANDLE REGISTER ───
  // Sends register request to backend
  const handleRegister = async () => {
    // Validate all fields first
    if (!validate()) return;

    setLoading(true);
    try {
      // Send register request to backend
      await axios.post(`${API}/auth/register`, {
        name, email, password, role, subject
      });

      // Show success and navigate to login
      Alert.alert(
        '✅ Account Created',
        'Your account has been created successfully!',
        [{ text: 'Login Now', onPress: () => router.replace('/') }]
      );

    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  // Get current password strength
  const strength = getPasswordStrength();

  // ─── RENDER ───
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>👤</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Smart Attendance</Text>
        </View>

        {/* ── FORM BOX ── */}
        <View style={styles.formBox}>

          {/* ── FULL NAME INPUT ── */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* ── EMAIL INPUT ── */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
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
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── PASSWORD STRENGTH INDICATOR ── */}
          {strength && (
            <View style={styles.strengthRow}>
              {/* Strength bars */}
              <View style={styles.strengthBars}>
                <View style={[
                  styles.strengthBar,
                  strength && styles.strengthBarFill,
                  { backgroundColor: '#ef4444' }
                ]} />
                <View style={[
                  styles.strengthBar,
                  (strength === 'medium' || strength === 'strong') && styles.strengthBarFill,
                  { backgroundColor: '#f59e0b' }
                ]} />
                <View style={[
                  styles.strengthBar,
                  strength === 'strong' && styles.strengthBarFill,
                  { backgroundColor: '#22c55e' }
                ]} />
              </View>
              {/* Strength label */}
              <Text style={[
                styles.strengthText,
                strength === 'weak' && { color: '#ef4444' },
                strength === 'medium' && { color: '#f59e0b' },
                strength === 'strong' && { color: '#22c55e' },
              ]}>
                {strength === 'weak' ? '❌ Weak' :
                 strength === 'medium' ? '⚠️ Medium' : '✅ Strong'}
              </Text>
            </View>
          )}

          {/* ── CONFIRM PASSWORD INPUT ── */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
            {/* Show checkmark if passwords match */}
            {confirmPassword.length > 0 && (
              <Text style={styles.eyeIcon}>
                {password === confirmPassword ? '✅' : '❌'}
              </Text>
            )}
          </View>

          {/* ── ROLE SELECTION ── */}
          <Text style={styles.label}>I am a:</Text>
          <View style={styles.roleRow}>

            {/* Student Role Button */}
            <TouchableOpacity
              style={[
                styles.roleBtn,
                role === 'student' && styles.roleBtnActive
              ]}
              onPress={() => setRole('student')}
            >
              <Text style={styles.roleEmoji}>👨‍🎓</Text>
              <Text style={[
                styles.roleText,
                role === 'student' && styles.roleTextActive
              ]}>
                Student
              </Text>
            </TouchableOpacity>

            {/* Instructor Role Button */}
            <TouchableOpacity
              style={[
                styles.roleBtn,
                role === 'instructor' && styles.roleBtnActive
              ]}
              onPress={() => setRole('instructor')}
            >
              <Text style={styles.roleEmoji}>👨‍🏫</Text>
              <Text style={[
                styles.roleText,
                role === 'instructor' && styles.roleTextActive
              ]}>
                Instructor
              </Text>
            </TouchableOpacity>

          </View>

          {/* ── SUBJECT SELECTION ── */}
          {/* Only shown when instructor role is selected */}
          {role === 'instructor' && (
            <>
              <Text style={styles.label}>Select Your Subject:</Text>
              <View style={styles.subjectGrid}>
                {SUBJECTS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.subjectBtn,
                      subject === s && styles.subjectBtnActive
                    ]}
                    onPress={() => setSubject(s)}
                  >
                    <Text style={[
                      styles.subjectText,
                      subject === s && styles.subjectTextActive
                    ]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── REGISTER BUTTON ── */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0f172a" />
              : <Text style={styles.registerBtnText}>Create Account →</Text>
            }
          </TouchableOpacity>

        </View>

        {/* ── LOGIN LINK ── */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Main scroll container
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    paddingTop: 60
  },

  // Header section
  header: {
    alignItems: 'center',
    marginBottom: 24
  },

  // Logo circle
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#38bdf8'
  },

  // Logo emoji
  logoEmoji: {
    fontSize: 32
  },

  // Page title
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 4
  },

  // Page subtitle
  subtitle: {
    fontSize: 14,
    color: '#64748b'
  },

  // Form container box
  formBox: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16
  },

  // Field label
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4
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

  // Eye/check icon
  eyeIcon: {
    fontSize: 18,
    padding: 4
  },

  // Text input
  input: {
    flex: 1,
    color: '#fff',
    padding: 14,
    fontSize: 16
  },

  // Password strength row
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    gap: 12
  },

  // Strength bars container
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1
  },

  // Individual strength bar
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155'
  },

  // Filled strength bar
  strengthBarFill: {
    opacity: 1
  },

  // Strength label text
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold'
  },

  // Role selection row
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },

  // Role button
  roleBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#0f172a'
  },

  // Active role button
  roleBtnActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Role emoji
  roleEmoji: {
    fontSize: 24,
    marginBottom: 4
  },

  // Role text
  roleText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 14
  },

  // Active role text
  roleTextActive: {
    color: '#0f172a'
  },

  // Subject grid container
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },

  // Subject button
  subjectBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a'
  },

  // Active subject button
  subjectBtnActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Subject text
  subjectText: {
    color: '#94a3b8',
    fontSize: 13
  },

  // Active subject text
  subjectTextActive: {
    color: '#0f172a',
    fontWeight: 'bold'
  },

  // Register button
  registerBtn: {
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

  // Disabled register button
  registerBtnDisabled: {
    opacity: 0.7
  },

  // Register button text
  registerBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Login link button
  loginLink: {
    padding: 16,
    alignItems: 'center'
  },

  // Login link text
  loginLinkText: {
    color: '#38bdf8',
    fontSize: 15
  },
});
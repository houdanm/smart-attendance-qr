// ─── IMPORTS ───
// useRouter for navigation
import { useRouter } from 'expo-router';
// SecureStore for reading saved token and user
import * as SecureStore from 'expo-secure-store';
// React hooks
import { useEffect, useState } from 'react';
// React Native components
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
// QRCode component for generating QR codes
import QRCode from 'react-native-qrcode-svg';
// Token expiry checker
import { checkTokenExpiry } from '../utils/authCheck';
// Location utility to get classroom GPS
import { getCurrentLocation } from '../utils/location';

// ─── CONFIGURATION ───
const API = 'http://192.168.0.105:5000/api';

export default function ShowQR() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [user, setUser] = useState(null);              // Instructor info
  const [qrValue, setQrValue] = useState('');          // Current QR code value
  const [subject, setSubject] = useState('General');   // Instructor's subject
  const [room, setRoom] = useState('');                // Room number input
  const [classroomLocation, setClassroomLocation] = useState(null); // GPS coords
  const [gettingLocation, setGettingLocation] = useState(false);    // GPS loading

  // ─── LIFECYCLE ───
  useEffect(() => {
    checkTokenExpiry(router);
    loadUser();
  }, []);

  // ─── LOAD USER ───
  const loadUser = async () => {
    const stored = await SecureStore.getItemAsync('user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      const userSubject = parsedUser.subject || 'General';
      setSubject(userSubject);
      // Generate first QR automatically
      const code = `ATT-${userSubject}-${Date.now()}`;
      setQrValue(code);
    }
  };

  // ─── SET CLASSROOM LOCATION ───
  // Gets instructor's current GPS as classroom location
  const setClassroomGPS = async () => {
    setGettingLocation(true);
    try {
      // Get current GPS coordinates
      const location = await getCurrentLocation();

      if (location) {
        // Save classroom location
        setClassroomLocation(location);
        Alert.alert(
          '📍 Location Set',
          `Classroom location saved!\nLat: ${location.latitude.toFixed(4)}\nLon: ${location.longitude.toFixed(4)}`
        );
      } else {
        Alert.alert(
          'Error',
          'Could not get location. Please enable GPS and try again.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  // ─── GENERATE QR CODE ───
  // Creates new QR with subject room and optional location
  const generateQR = () => {
    // Build QR value with available info
    // Format: ATT-Subject-Room-Timestamp
    // Location is stored separately not in QR
    const code = room.trim()
      ? `ATT-${subject}-${room}-${Date.now()}`
      : `ATT-${subject}-${Date.now()}`;

    setQrValue(code);
  };

  // ─── HANDLE LOGOUT ───
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    router.replace('/');
  };

  // ─── RENDER ───
  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>Instructor Panel</Text>

      {/* Welcome Message */}
      {user && <Text style={styles.subtitle}>Welcome, {user.name}</Text>}

      {/* Subject Label */}
      <Text style={styles.label}>📚 Subject: {subject}</Text>

      {/* ── ROOM NUMBER INPUT ── */}
      <Text style={styles.inputLabel}>🏫 Room Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter room number e.g. Room 101"
        placeholderTextColor="#64748b"
        value={room}
        onChangeText={setRoom}
      />

      {/* ── SET CLASSROOM LOCATION BUTTON ── */}
      {/* Saves instructor's current GPS as classroom location */}
      <TouchableOpacity
        style={[
          styles.locationBtn,
          classroomLocation && styles.locationBtnSet
        ]}
        onPress={setClassroomGPS}
        disabled={gettingLocation}
      >
        {gettingLocation ? (
          // Show spinner while getting GPS
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.locationBtnText}>
            {classroomLocation
              ? '📍 Location Set ✅ (Tap to Update)'
              : '📍 Set Classroom Location'
            }
          </Text>
        )}
      </TouchableOpacity>

      {/* Show GPS coordinates if set */}
      {classroomLocation && (
        <Text style={styles.coordsText}>
          Lat: {classroomLocation.latitude.toFixed(4)} |
          Lon: {classroomLocation.longitude.toFixed(4)}
        </Text>
      )}

      {/* ── QR CODE BOX ── */}
      <View style={styles.qrBox}>
        {qrValue ? (
          <QRCode
            value={qrValue}
            size={220}
            color="#0f172a"
            backgroundColor="#fff"
          />
        ) : null}
      </View>

      {/* QR Code Value Text */}
      <Text style={styles.code}>{qrValue}</Text>

      {/* Room display if set */}
      {room ? (
        <Text style={styles.roomText}>🏫 Room: {room}</Text>
      ) : null}

      {/* ── GENERATE NEW QR BUTTON ── */}
      <TouchableOpacity style={styles.button} onPress={generateQR}>
        <Text style={styles.buttonText}>🔄 Generate New QR</Text>
      </TouchableOpacity>

      {/* Manual Attendance Button */}
      <TouchableOpacity
        style={styles.manualBtn}
        onPress={() => router.push('/manual-attendance')}
      >
        <Text style={styles.manualText}>✏️ Manual Attendance</Text>
      </TouchableOpacity>

      {/* Dashboard Button */}
      <TouchableOpacity
        style={styles.dashboardBtn}
        onPress={() => router.push('/dashboard')}
      >
        <Text style={styles.dashboardText}>👨‍🏫 View Dashboard</Text>
      </TouchableOpacity>

      {/* Schedule Button */}
      <TouchableOpacity
        style={styles.scheduleBtn}
        onPress={() => router.push('/schedule')}
      >
        <Text style={styles.scheduleText}>📅 Class Schedule</Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        style={styles.profileBtn}
        onPress={() => router.push('/profile')}
      >
        <Text style={styles.profileText}>👤 My Profile</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Main scroll container
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  // Page title
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 4
  },
  // Welcome subtitle
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 12
  },
  // Subject label
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16
  },
  // Room input label
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start'
  },
  // Room text input
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%'
  },
  // Set location button - default state
  locationBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#64748b'
  },
  // Set location button - when location is set
  locationBtnSet: {
    borderColor: '#22c55e'
  },
  // Location button text
  locationBtnText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 14
  },
  // GPS coordinates display text
  coordsText: {
    color: '#22c55e',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center'
  },
  // White QR code box
  qrBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16
  },
  // QR value text
  code: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center'
  },
  // Room display text
  roomText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16
  },
  // Generate QR button
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  // Generate button text
  buttonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Manual attendance button
  manualBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  // Manual button text
  manualText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Dashboard button
  dashboardBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  // Dashboard text
  dashboardText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Schedule button
  scheduleBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10b981'
  },
  // Schedule text
  scheduleText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Profile button
  profileBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  // Profile text
  profileText: {
    color: '#a78bfa',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Logout button
  logoutBtn: {
    padding: 14,
    width: '100%',
    alignItems: 'center'
  },
  // Logout text
  logoutText: {
    color: '#ef4444',
    fontSize: 16
  },
});
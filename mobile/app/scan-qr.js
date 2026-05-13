// ─── IMPORTS ───
// axios for API requests
import axios from 'axios';
// CameraView for camera preview
import { CameraView, useCameraPermissions } from 'expo-camera';
// useRouter for navigation
import { useRouter } from 'expo-router';
// SecureStore for token and user
import * as SecureStore from 'expo-secure-store';
// React hooks
import { useEffect, useState } from 'react';
// React Native components
import {
  ActivityIndicator, Alert, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
// Token expiry checker
import { checkTokenExpiry } from '../utils/authCheck';
// Notification utility
import { sendLocalNotification } from '../utils/notifications';
// Location utility - records location but does NOT block
import { getCurrentLocation } from '../utils/location';

// ─── CONFIGURATION ───
const API = 'http://192.168.0.105:5000/api';

export default function ScanQR() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);      // Prevents duplicate scans
  const [loading, setLoading] = useState(false);      // Loading spinner
  const [user, setUser] = useState(null);             // Student info
  const [locationStatus, setLocationStatus] = useState('idle'); // GPS status
  // idle / getting / recorded / failed

  // ─── LIFECYCLE ───
  useEffect(() => {
    checkTokenExpiry(router);
    loadUser();
  }, []);

  // ─── LOAD USER ───
  const loadUser = async () => {
    const stored = await SecureStore.getItemAsync('user');
    if (stored) setUser(JSON.parse(stored));
  };

  // ─── HANDLE QR SCAN ───
  // Records attendance with optional GPS - does NOT block
  const handleBarCodeScanned = async ({ data }) => {
    // Prevent multiple scans
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setLocationStatus('getting'); // Start getting location

    try {
      const token = await SecureStore.getItemAsync('token');

      // Extract subject and room from QR
      // Format: ATT-Mathematics-Room101-timestamp
      const parts = data.split('-');
      const subject = parts[1] || 'Unknown';
      const room = parts[2] || null;

      // ── Try to get GPS location ──
      // This runs in background - does NOT block attendance
      let studentLat = null;
      let studentLon = null;

      try {
        // Attempt to get location
        const location = await getCurrentLocation();
        if (location) {
          studentLat = location.latitude;
          studentLon = location.longitude;
          setLocationStatus('recorded'); // Location recorded
        } else {
          setLocationStatus('failed'); // Location unavailable
        }
      } catch {
        // Location failed - continue anyway
        setLocationStatus('failed');
      }

      // ── Record attendance ──
      // Always records regardless of GPS result
      await axios.post(
        `${API}/attendance/scan`,
        {
          qr_code: data,
          subject,
          room,
          student_lat: studentLat, // null if GPS unavailable
          student_lon: studentLon  // null if GPS unavailable
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Send success notification
      await sendLocalNotification(
        '✅ Attendance Recorded!',
        `Your attendance for ${subject}${room ? ` in ${room}` : ''} has been recorded.`
      );

      // Show success with location info
      Alert.alert(
        '✅ Attendance Recorded!',
        `📚 ${subject}${room ? `\n🏫 ${room}` : ''}\n${studentLat ? '📍 Location recorded' : '📍 Location unavailable'}`,
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );

    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to record attendance'
      );
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  // ─── HANDLE LOGOUT ───
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    router.replace('/');
  };

  // ─── PERMISSION CHECKS ───
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── RENDER ───
  return (
    <View style={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>Scan QR Code</Text>

      {/* Student Name */}
      {user && <Text style={styles.subtitle}>Student: {user.name}</Text>}

      {/* ── LOCATION STATUS ── */}
      {/* Shows GPS status - informational only does not block */}
      {locationStatus !== 'idle' && (
        <View style={styles.locationBar}>
          <Text style={[
            styles.locationText,
            locationStatus === 'recorded' && { color: '#22c55e' },
            locationStatus === 'failed' && { color: '#f59e0b' },
            locationStatus === 'getting' && { color: '#38bdf8' }
          ]}>
            {locationStatus === 'getting' && '📍 Getting location...'}
            {locationStatus === 'recorded' && '📍 Location recorded ✅'}
            {locationStatus === 'failed' && '📍 Location unavailable (attendance still recorded)'}
          </Text>
        </View>
      )}

      {/* ── CAMERA BOX ── */}
      <View style={styles.cameraBox}>

        {/* Camera View - always active no GPS lock */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Loading overlay while recording */}
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#38bdf8" />
            {locationStatus === 'getting' && (
              <Text style={styles.overlayText}>Getting location...</Text>
            )}
          </View>
        )}
      </View>

      {/* Scan Again Button */}
      {scanned && !loading && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setScanned(false);
            setLocationStatus('idle');
          }}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* View Attendance History */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => router.push('/history')}
      >
        <Text style={styles.historyText}>📊 View My Attendance</Text>
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
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
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
  // Student name
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 12
  },
  // Location status bar - informational only
  locationBar: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155'
  },
  // Location status text
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // Camera preview box
  cameraBox: {
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1e293b'
  },
  // Loading overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Overlay loading text
  overlayText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8
  },
  // Scan Again button
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  // Button text
  buttonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  },
  // History button
  historyBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  // History text
  historyText: {
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
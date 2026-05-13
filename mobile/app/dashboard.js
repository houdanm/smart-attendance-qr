// ─── IMPORTS ───
// SecureStore for reading saved token
import * as SecureStore from 'expo-secure-store';
// axios for making API requests to backend
import axios from 'axios';
// FileSystem for saving Excel file to device
import * as FileSystem from 'expo-file-system';
// Sharing for sharing/downloading Excel file
import * as Sharing from 'expo-sharing';
// useRouter for navigation between screens
import { useRouter } from 'expo-router';
// React hooks for state and lifecycle
import { useEffect, useState } from 'react';
// React Native UI components
import {
  ActivityIndicator, Alert, FlatList, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
// Token expiry checker utility
import { checkTokenExpiry } from '../utils/authCheck';

// ─── CONFIGURATION ───
// Backend API base URL - change this to your IP or deployed URL
const API = 'http://192.168.0.105:5000/api';

export default function Dashboard() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [records, setRecords] = useState([]);      // All attendance records
  const [loading, setLoading] = useState(true);    // Loading spinner for records
  const [exporting, setExporting] = useState(false); // Loading spinner for export

  // ─── LIFECYCLE ───
  // Run when screen first loads
  useEffect(() => {
    checkTokenExpiry(router); // Check if token is still valid
    loadRecords();            // Load attendance records
  }, []);

  // ─── LOAD RECORDS ───
  // Fetches all attendance records from backend
  const loadRecords = async () => {
    try {
      // Get saved JWT token for authentication
      const token = await SecureStore.getItemAsync('token');

      // Fetch all attendance records from backend
      // This includes student names subjects rooms and dates
      const res = await axios.get(`${API}/attendance/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save records to state
      setRecords(res.data);

    } catch (err) {
      console.log('Dashboard error:', err.message);
      Alert.alert('Error', 'Failed to load attendance records');
    } finally {
      // Hide loading spinner when done
      setLoading(false);
    }
  };

  // ─── FORMAT DATE ───
  // Converts database date to readable format
  // Example: 2026-04-11T17:46:53 → 4/11/2026 5:46:53 PM
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // ─── HANDLE EXPORT ───
  // Downloads attendance records as Excel file
  const handleExport = async () => {
    // Show loading spinner on export button
    setExporting(true);
    try {
      // Get saved JWT token for authentication
      const token = await SecureStore.getItemAsync('token');

      // Set file path where Excel will be saved
      // documentDirectory is app's private storage folder
      const fileUri = FileSystem.documentDirectory + 'attendance.xlsx';

      // Download Excel file from backend
      const response = await FileSystem.downloadAsync(
        `${API}/attendance/export`, // Backend export endpoint
        fileUri,                     // Save location on device
        {
          // Include JWT token in request header
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Open share dialog so user can save or send the file
      await Sharing.shareAsync(response.uri, {
        // Excel file MIME type
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Dialog title shown to user
        dialogTitle: 'Save Attendance Excel File',
      });

    } catch (err) {
      // Show error if export fails
      Alert.alert('Export Failed', err.message);
    } finally {
      // Hide loading spinner when done
      setExporting(false);
    }
  };

  // ─── RENDER ───
  return (
    <View style={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>Attendance Dashboard</Text>

      {/* Total Records Count */}
      <Text style={styles.count}>Total Records: {records.length}</Text>

      {/* ── EXPORT BUTTON ── */}
      {/* Downloads all attendance records as Excel file */}
      <TouchableOpacity
        style={styles.exportBtn}
        onPress={handleExport}
        disabled={exporting} // Disable while export is in progress
      >
        {exporting
          ? <ActivityIndicator color="#fff" /> // Show spinner while exporting
          : <Text style={styles.exportText}>📤 Export to Excel</Text>
        }
      </TouchableOpacity>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        // Show spinner while loading records
        <ActivityIndicator
          size="large"
          color="#38bdf8"
          style={{ marginTop: 40 }}
        />

      ) : records.length === 0 ? (
        // Show empty message if no records
        <Text style={styles.empty}>No attendance records yet</Text>

      ) : (
        // Show list of attendance records
        <FlatList
          data={records}                              // Records array
          keyExtractor={(_, index) => index.toString()} // Unique key for each item
          showsVerticalScrollIndicator={false}        // Hide scroll bar
          renderItem={({ item }) => (

            // ── ATTENDANCE RECORD CARD ──
            <View style={styles.card}>

              {/* Student Name */}
              <Text style={styles.name}>👤 {item.name}</Text>

              {/* Subject Name */}
              <Text style={styles.subject}>📚 {item.subject}</Text>

              {/* Room Number - only shown if exists */}
              {item.room && (
                <Text style={styles.room}>🏫 {item.room}</Text>
              )}

              {/* Date and Time of Scan */}
              <Text style={styles.date}>🕐 {formatDate(item.scanned_at)}</Text>

              {/* Manual Badge - shown if marked manually */}
              {item.qr_code?.startsWith('MANUAL') && (
                <View style={styles.manualBadge}>
                  <Text style={styles.manualBadgeText}>✏️ Manual</Text>
                </View>
              )}

            </View>
          )}
        />
      )}

      {/* ── BACK BUTTON ── */}
      {/* Returns to previous screen */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>← Back</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Main container - dark background full screen
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    paddingTop: 60
  },

  // Page title - blue bold text
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 4
  },

  // Total records count text
  count: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16
  },

  // Export to Excel button - green
  exportBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16
  },

  // Export button text
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Empty state text
  empty: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16
  },

  // Attendance record card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Student name text
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },

  // Subject name text - blue
  subject: {
    fontSize: 14,
    color: '#38bdf8',
    marginBottom: 4
  },

  // Room number text - yellow
  room: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 4
  },

  // Date and time text - gray
  date: {
    fontSize: 13,
    color: '#94a3b8'
  },

  // Manual attendance badge container
  manualBadge: {
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    padding: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3b82f6'
  },

  // Manual badge text
  manualBadgeText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: 'bold'
  },

  // Back button - dark with border
  button: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Back button text - blue
  buttonText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },
});
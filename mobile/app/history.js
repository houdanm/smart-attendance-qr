// ─── IMPORTS ───
// SecureStore for reading saved token and user info
import * as SecureStore from 'expo-secure-store';
// axios for making API requests to backend
import axios from 'axios';
// useRouter for navigation between screens
import { useRouter } from 'expo-router';
// React hooks for state and lifecycle
import { useEffect, useState } from 'react';
// React Native UI components
import {
  ActivityIndicator, FlatList, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
// Token expiry checker utility
import { checkTokenExpiry } from '../utils/authCheck';

// ─── CONFIGURATION ───
// Backend API base URL - change this to your IP or deployed URL
const API = 'http://192.168.0.105:5000/api';

// ─── DATE FILTER OPTIONS ───
const FILTERS = ['All', 'Today', 'This Week', 'This Month'];

export default function History() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [records, setRecords] = useState([]);      // All attendance records from backend
  const [filtered, setFiltered] = useState([]);    // Filtered records based on date filter
  const [percentage, setPercentage] = useState([]); // Attendance percentage per subject
  const [loading, setLoading] = useState(true);    // Loading spinner state
  const [user, setUser] = useState(null);          // Current logged in user info
  const [activeFilter, setActiveFilter] = useState('All');      // Currently selected date filter
  const [activeTab, setActiveTab] = useState('history');        // Currently active tab

  // ─── LIFECYCLE ───
  // Run when screen first loads
  useEffect(() => {
    checkTokenExpiry(router); // Check if token is still valid
    loadData();               // Load attendance data
  }, []);

  // Run when records or activeFilter changes
  useEffect(() => {
    applyFilter(activeFilter);
  }, [records, activeFilter]);

  // ─── LOAD DATA FROM BACKEND ───
  const loadData = async () => {
    try {
      // Get saved token and user from SecureStore
      const token = await SecureStore.getItemAsync('token');
      const stored = await SecureStore.getItemAsync('user');
      if (stored) setUser(JSON.parse(stored));

      // Fetch attendance history from backend
      const historyRes = await axios.get(`${API}/attendance/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(historyRes.data);

      // Fetch attendance percentage from backend
      const percentRes = await axios.get(`${API}/attendance/percentage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPercentage(percentRes.data);

    } catch (err) {
      console.log('History error:', err.message);
    } finally {
      // Hide loading spinner when done
      setLoading(false);
    }
  };

  // ─── DATE FILTER FUNCTION ───
  // Filters records based on selected time period
  const applyFilter = (filter) => {
    const now = new Date();
    let result = records; // Start with all records

    if (filter === 'Today') {
      // Keep only records from today
      result = records.filter(r =>
        new Date(r.scanned_at).toDateString() === now.toDateString()
      );
    } else if (filter === 'This Week') {
      // Keep only records from last 7 days
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      result = records.filter(r => new Date(r.scanned_at) >= weekAgo);
    } else if (filter === 'This Month') {
      // Keep only records from current month
      result = records.filter(r => {
        const d = new Date(r.scanned_at);
        return d.getMonth() === now.getMonth() &&
               d.getFullYear() === now.getFullYear();
      });
    }
    // Update filtered records
    setFiltered(result);
  };

  // ─── FORMAT DATE ───
  // Converts database date to readable format
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // ─── GET STATUS COLOR ───
  // Returns color based on attendance status
  const getStatusColor = (status) => {
    if (status === 'good') return '#22c55e';    // Green for good
    if (status === 'warning') return '#f59e0b'; // Yellow for warning
    return '#ef4444';                           // Red for danger
  };

  // ─── GET STATUS EMOJI ───
  // Returns emoji based on attendance status
  const getStatusEmoji = (status) => {
    if (status === 'good') return '✅';
    if (status === 'warning') return '⚠️';
    return '❌';
  };

  // ─── RENDER ───
  return (
    <View style={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>My Attendance</Text>

      {/* Student Name */}
      {user && <Text style={styles.subtitle}>{user.name}</Text>}

      {/* ── TAB SWITCHER ── */}
      {/* Switches between History and Percentage views */}
      <View style={styles.tabRow}>
        {/* History Tab Button */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📋 History
          </Text>
        </TouchableOpacity>

        {/* Percentage Tab Button */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'percentage' && styles.tabActive]}
          onPress={() => setActiveTab('percentage')}
        >
          <Text style={[styles.tabText, activeTab === 'percentage' && styles.tabTextActive]}>
            📊 Percentage
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LOADING SPINNER ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />

      ) : activeTab === 'history' ? (
        // ── HISTORY TAB CONTENT ──
        <>
          {/* Total count */}
          <Text style={styles.count}>Total: {filtered.length} classes</Text>

          {/* Date Filter Buttons */}
          <View style={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, activeFilter === f && styles.filterActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Empty State */}
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No records for this period</Text>
          ) : (
            // Attendance Records List
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                // Single Attendance Record Card
                <View style={styles.card}>
                  {/* Subject Name */}
                  <Text style={styles.subject}>{item.subject}</Text>
                  {/* Date and Time */}
                  <Text style={styles.date}>{formatDate(item.scanned_at)}</Text>
                  {/* Present Badge */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>✅ Present</Text>
                  </View>
                </View>
              )}
            />
          )}
        </>

      ) : (
        // ── PERCENTAGE TAB CONTENT ──
        <ScrollView style={{ width: '100%' }}>
          <Text style={styles.count}>Attendance by Subject</Text>

          {/* Empty State */}
          {percentage.length === 0 ? (
            <Text style={styles.empty}>No attendance data yet</Text>
          ) : (
            // Percentage Cards for each Subject
            percentage.map((item, index) => (
              <View key={index} style={styles.percentCard}>

                {/* Subject Name and Percentage */}
                <View style={styles.percentHeader}>
                  <Text style={styles.percentSubject}>{item.subject}</Text>
                  <Text style={[styles.percentValue, { color: getStatusColor(item.status) }]}>
                    {getStatusEmoji(item.status)} {item.percentage}%
                  </Text>
                </View>

                {/* Progress Bar Background */}
                <View style={styles.progressBg}>
                  {/* Progress Bar Fill - width based on percentage */}
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: getStatusColor(item.status)
                    }
                  ]} />
                </View>

                {/* Classes Attended Detail */}
                <Text style={styles.percentDetail}>
                  {item.attended} of {item.total} classes attended
                </Text>

                {/* Status Text */}
                <Text style={[styles.percentStatus, { color: getStatusColor(item.status) }]}>
                  {item.status === 'good' ? '✅ Good Standing' :
                   item.status === 'warning' ? '⚠️ At Risk' :
                   '❌ Poor Attendance'}
                </Text>

              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
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

  // Student name subtitle
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16
  },

  // Tab row container
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },

  // Individual tab button
  tabBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#1e293b'
  },

  // Active tab button style
  tabActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Tab button text
  tabText: {
    color: '#94a3b8',
    fontWeight: 'bold'
  },

  // Active tab text
  tabTextActive: {
    color: '#0f172a'
  },

  // Record count text
  count: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12
  },

  // Filter buttons row
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap'
  },

  // Individual filter button
  filterBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Active filter button
  filterActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Filter button text
  filterText: {
    color: '#94a3b8',
    fontSize: 13
  },

  // Active filter text
  filterTextActive: {
    color: '#0f172a',
    fontWeight: 'bold'
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

  // Subject name in card
  subject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },

  // Date text in card
  date: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8
  },

  // Present badge container
  badge: {
    backgroundColor: '#064e3b',
    borderRadius: 6,
    padding: 4,
    alignSelf: 'flex-start'
  },

  // Present badge text
  badgeText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold'
  },

  // Percentage card container
  percentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Percentage card header row
  percentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  // Subject name in percentage card
  percentSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },

  // Percentage value text
  percentValue: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  // Progress bar background track
  progressBg: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden'
  },

  // Progress bar fill
  progressFill: {
    height: 10,
    borderRadius: 5
  },

  // Classes attended detail text
  percentDetail: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4
  },

  // Status text below progress bar
  percentStatus: {
    fontSize: 13,
    fontWeight: 'bold'
  },

  // Back button
  button: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16
  },

  // Back button text
  buttonText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },
});
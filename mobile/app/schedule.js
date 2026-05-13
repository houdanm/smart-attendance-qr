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
    ActivityIndicator, Alert, FlatList,
    Modal, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
// Token expiry checker utility
import { checkTokenExpiry } from '../utils/authCheck';
// Notification utilities for class reminders
import {
    cancelAllNotifications,
    scheduleClassReminder
} from '../utils/notifications';

// ─── CONFIGURATION ───
// Backend API base URL
const API = 'http://192.168.0.105:5000/api';

// ─── CONSTANTS ───
// Days of the week for schedule
const DAYS = [
  'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday', 'Sunday'
];

// Available time slots every 30 minutes
const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00'
];

export default function Schedule() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [schedules, setSchedules] = useState([]);          // All schedule records
  const [loading, setLoading] = useState(true);            // Loading spinner
  const [user, setUser] = useState(null);                  // Current user info
  const [modalVisible, setModalVisible] = useState(false); // Add modal visibility
  const [selectedDay, setSelectedDay] = useState('Monday'); // Selected day filter
  const [settingReminders, setSettingReminders] = useState(false); // Reminder spinner

  // ─── NEW SCHEDULE FORM STATE ───
  const [newSubject, setNewSubject] = useState('');          // Subject input
  const [newRoom, setNewRoom] = useState('');                // Room input
  const [newDay, setNewDay] = useState('Monday');            // Day selection
  const [newStartTime, setNewStartTime] = useState('09:00'); // Start time
  const [newEndTime, setNewEndTime] = useState('10:00');     // End time
  const [saving, setSaving] = useState(false);               // Saving spinner

  // ─── LIFECYCLE ───
  // Run when screen first loads
  useEffect(() => {
    checkTokenExpiry(router); // Check token is valid
    loadData();               // Load user and schedules
  }, []);

  // ─── LOAD DATA ───
  // Loads user info and schedule from backend
  const loadData = async () => {
    try {
      // Get saved token and user info
      const token = await SecureStore.getItemAsync('token');
      const stored = await SecureStore.getItemAsync('user');
      if (stored) setUser(JSON.parse(stored));

      // Fetch schedules from backend
      const res = await axios.get(`${API}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save schedules to state
      setSchedules(res.data);

    } catch (err) {
      console.log('Schedule error:', err.message);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      // Hide loading spinner when done
      setLoading(false);
    }
  };

  // ─── ADD SCHEDULE ───
  // Sends new schedule to backend
  const addSchedule = async () => {
    // Validate subject is provided
    if (!newSubject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('token');

      // Send new schedule to backend
      await axios.post(
        `${API}/schedule`,
        {
          subject: newSubject,       // Subject name
          room: newRoom,             // Room number
          day_of_week: newDay,       // Day of week
          start_time: newStartTime,  // Start time
          end_time: newEndTime       // End time
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show success message
      Alert.alert('✅ Success', 'Schedule added successfully');

      // Reset all form fields
      setNewSubject('');
      setNewRoom('');
      setNewDay('Monday');
      setNewStartTime('09:00');
      setNewEndTime('10:00');

      // Close modal
      setModalVisible(false);

      // Reload schedules to show new entry
      loadData();

    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add schedule');
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE SCHEDULE ───
  // Removes a schedule from backend
  const deleteSchedule = async (id) => {
    // Ask instructor to confirm deletion
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this class?',
      [
        // Cancel button - does nothing
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('token');

              // Send delete request to backend
              await axios.delete(`${API}/schedule/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              // Reload schedules after deletion
              loadData();

            } catch (err) {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          }
        }
      ]
    );
  };

  // ─── SET REMINDERS FOR TODAY ───
  // Schedules notifications 15 mins before each class today
  const setRemindersForToday = async () => {
    setSettingReminders(true);
    try {
      // Cancel all existing reminders first
      // to avoid duplicate notifications
      await cancelAllNotifications();

      // Get today's day name
      const today = getTodayName();

      // Filter schedules for today only
      const todaySchedules = schedules.filter(
        s => s.day_of_week === today
      );

      // Schedule reminder for each class today
      let count = 0;
      for (const s of todaySchedules) {
        // Schedule notification 15 mins before class
        const id = await scheduleClassReminder(
          s.subject,     // Subject name
          s.room,        // Room number
          s.start_time   // Class start time
        );
        if (id) count++; // Count successful reminders
      }

      // Show confirmation with count of reminders set
      Alert.alert(
        '🔔 Reminders Set',
        count > 0
          ? `${count} class reminder${count > 1 ? 's' : ''} set for today!\nYou will be notified 15 minutes before each class.`
          : 'No upcoming classes today or all classes have already started.'
      );

    } catch (err) {
      Alert.alert('Error', 'Failed to set reminders');
    } finally {
      setSettingReminders(false);
    }
  };

  // ─── GET DAY COLOR ───
  // Returns a unique color for each day of the week
  const getDayColor = (day) => {
    const colors = {
      'Monday': '#3b82f6',    // Blue
      'Tuesday': '#8b5cf6',   // Purple
      'Wednesday': '#ec4899', // Pink
      'Thursday': '#f59e0b',  // Yellow
      'Friday': '#10b981',    // Green
      'Saturday': '#ef4444',  // Red
      'Sunday': '#64748b'     // Gray
    };
    return colors[day] || '#38bdf8';
  };

  // ─── FILTER SCHEDULES BY DAY ───
  // Returns only schedules for the selected day
  const filteredSchedules = schedules.filter(
    s => s.day_of_week === selectedDay
  );

  // ─── GET TODAY'S DAY NAME ───
  // Returns current day name for highlighting today's button
  const getTodayName = () => {
    const days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday'
    ];
    return days[new Date().getDay()];
  };

  // ─── RENDER ───
  return (
    <View style={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>📅 Class Schedule</Text>

      {/* User Name Subtitle */}
      {user && <Text style={styles.subtitle}>{user.name}</Text>}

      {/* ── DAY SELECTOR ── */}
      {/* Horizontal scroll of day buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
      >
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayBtn,
              selectedDay === day && styles.dayBtnActive,
              // Add yellow border to highlight today
              day === getTodayName() && styles.todayBtn
            ]}
            onPress={() => setSelectedDay(day)}
          >
            {/* Day name shortened to 3 letters */}
            <Text style={[
              styles.dayBtnText,
              selectedDay === day && styles.dayBtnTextActive
            ]}>
              {day.substring(0, 3)}
            </Text>

            {/* Yellow dot indicator for today */}
            {day === getTodayName() && (
              <View style={styles.todayDot} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── ACTION BUTTONS ROW ── */}
      <View style={styles.actionRow}>

        {/* Add Class Button - only for instructors */}
        {user?.role === 'instructor' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addBtnText}>+ Add Class</Text>
          </TouchableOpacity>
        )}

        {/* Set Reminders Button - for all users */}
        <TouchableOpacity
          style={styles.reminderBtn}
          onPress={setRemindersForToday}
          disabled={settingReminders}
        >
          {settingReminders
            ? <ActivityIndicator color="#f59e0b" size="small" />
            : <Text style={styles.reminderText}>🔔 Set Reminders</Text>
          }
        </TouchableOpacity>

      </View>

      {/* ── SCHEDULE LIST ── */}
      {loading ? (
        // Show spinner while loading
        <ActivityIndicator
          size="large"
          color="#38bdf8"
          style={{ marginTop: 40 }}
        />

      ) : filteredSchedules.length === 0 ? (
        // Show empty message if no classes for this day
        <Text style={styles.empty}>No classes on {selectedDay}</Text>

      ) : (
        // Show list of classes for selected day
        <FlatList
          data={filteredSchedules}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (

            // ── SCHEDULE CARD ──
            <View style={[
              styles.card,
              // Color left border based on day
              { borderLeftColor: getDayColor(item.day_of_week) }
            ]}>

              {/* Card Header Row */}
              <View style={styles.cardHeader}>

                {/* Subject Name */}
                <Text style={styles.cardSubject}>{item.subject}</Text>

                {/* Delete Button - only for instructors */}
                {user?.role === 'instructor' && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteSchedule(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Time Range */}
              <Text style={styles.cardTime}>
                🕐 {item.start_time} — {item.end_time}
              </Text>

              {/* Room Number - only shown if exists */}
              {item.room && (
                <Text style={styles.cardRoom}>🏫 {item.room}</Text>
              )}

              {/* Instructor Name - only shown to students */}
              {user?.role === 'student' && (
                <Text style={styles.cardInstructor}>
                  👨‍🏫 {item.instructor_name}
                </Text>
              )}

            </View>
          )}
        />
      )}

      {/* ── ADD SCHEDULE MODAL ── */}
      {/* Popup form for adding new class schedule */}
      <Modal
        visible={modalVisible}
        animationType="slide"   // Slides up from bottom
        transparent={true}      // Shows background behind modal
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>

            {/* Modal Title */}
            <Text style={styles.modalTitle}>Add New Class</Text>

            {/* ── SUBJECT INPUT ── */}
            <Text style={styles.modalLabel}>Subject Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#64748b"
              value={newSubject}
              onChangeText={setNewSubject}
            />

            {/* ── ROOM INPUT ── */}
            <Text style={styles.modalLabel}>Room Number (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Room 101"
              placeholderTextColor="#64748b"
              value={newRoom}
              onChangeText={setNewRoom}
            />

            {/* ── DAY SELECTION ── */}
            <Text style={styles.modalLabel}>Day of Week</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.dayRow}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.modalDayBtn,
                      newDay === day && styles.modalDayActive
                    ]}
                    onPress={() => setNewDay(day)}
                  >
                    <Text style={[
                      styles.modalDayText,
                      newDay === day && styles.modalDayTextActive
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* ── START TIME SELECTION ── */}
            <Text style={styles.modalLabel}>Start Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.timeRow}>
                {TIME_SLOTS.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeBtn,
                      newStartTime === time && styles.timeBtnActive
                    ]}
                    onPress={() => setNewStartTime(time)}
                  >
                    <Text style={[
                      styles.timeBtnText,
                      newStartTime === time && styles.timeBtnTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* ── END TIME SELECTION ── */}
            <Text style={styles.modalLabel}>End Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.timeRow}>
                {TIME_SLOTS.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeBtn,
                      newEndTime === time && styles.timeBtnActive
                    ]}
                    onPress={() => setNewEndTime(time)}
                  >
                    <Text style={[
                      styles.timeBtnText,
                      newEndTime === time && styles.timeBtnTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* ── SAVE BUTTON ── */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={addSchedule}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#0f172a" />
                : <Text style={styles.saveBtnText}>💾 Save Schedule</Text>
              }
            </TouchableOpacity>

            {/* ── CANCEL BUTTON ── */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>

      {/* ── BACK BUTTON ── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backBtnText}>← Back</Text>
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

  // User name subtitle - gray text
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16
  },

  // Horizontal day scroll container
  dayScroll: {
    marginBottom: 16,
    flexGrow: 0
  },

  // Individual day button
  dayBtn: {
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    minWidth: 50
  },

  // Active selected day button
  dayBtnActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Today's day button - yellow border
  todayBtn: {
    borderColor: '#f59e0b'
  },

  // Day button text
  dayBtnText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 13
  },

  // Active day button text - dark
  dayBtnTextActive: {
    color: '#0f172a'
  },

  // Yellow dot indicator for today
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 4
  },

  // Action buttons row container
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },

  // Add Class button - green
  addBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },

  // Add button text
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },

  // Set Reminders button - dark with yellow border
  reminderBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b'
  },

  // Reminder button text - yellow
  reminderText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 15
  },

  // Empty state text
  empty: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16
  },

  // Schedule card with colored left border
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4  // Thick colored left border
  },

  // Card header row - subject and delete button
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  // Subject name in card - white bold
  cardSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1
  },

  // Delete button container
  deleteBtn: {
    padding: 4
  },

  // Delete emoji button
  deleteBtnText: {
    fontSize: 18
  },

  // Time range text - blue
  cardTime: {
    fontSize: 14,
    color: '#38bdf8',
    marginBottom: 4
  },

  // Room number text - yellow
  cardRoom: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 4
  },

  // Instructor name text - gray
  cardInstructor: {
    fontSize: 13,
    color: '#94a3b8'
  },

  // Modal dark overlay background
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },

  // Modal content box - slides up from bottom
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40
  },

  // Modal title
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 20,
    textAlign: 'center'
  },

  // Modal field labels
  modalLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12
  },

  // Modal text input fields
  modalInput: {
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Day selection row in modal
  dayRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },

  // Day button in modal
  modalDayBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a'
  },

  // Active day in modal - blue
  modalDayActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Day text in modal
  modalDayText: {
    color: '#94a3b8',
    fontWeight: 'bold'
  },

  // Active day text in modal - dark
  modalDayTextActive: {
    color: '#0f172a'
  },

  // Time slots row in modal
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },

  // Time slot button
  timeBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a'
  },

  // Active time slot - blue
  timeBtnActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },

  // Time slot text
  timeBtnText: {
    color: '#94a3b8',
    fontSize: 13
  },

  // Active time text - dark bold
  timeBtnTextActive: {
    color: '#0f172a',
    fontWeight: 'bold'
  },

  // Save schedule button - blue
  saveBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20
  },

  // Save button text - dark
  saveBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Cancel button - no background
  cancelBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8
  },

  // Cancel button text - red
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 16
  },

  // Back button - dark with border
  backBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Back button text - blue
  backBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },
});
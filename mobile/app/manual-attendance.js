import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { checkTokenExpiry } from '../utils/authCheck';

const API = 'http://192.168.0.105:5000/api';

export default function ManualAttendance() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);
  const [subject, setSubject] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkTokenExpiry(router);
    loadData();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(students);
    } else {
      setFiltered(students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      ));
    }
  }, [search, students]);

  const loadData = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const stored = await SecureStore.getItemAsync('user');
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        setSubject(parsedUser.subject || 'General');
      }
      const res = await axios.get(`${API}/attendance/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
      setFiltered(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (student) => {
    setMarking(student.id);
    try {
      const token = await SecureStore.getItemAsync('token');
      await axios.post(
        `${API}/attendance/manual`,
        { student_id: student.id, subject },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✅ Success', `Attendance marked for ${student.name}`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setMarking(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Attendance</Text>
      {user && <Text style={styles.subtitle}>📚 {subject}</Text>}

      <TextInput
        style={styles.search}
        placeholder="Search student by name or email..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>No students found</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>👤 {item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.markBtn}
                onPress={() => markAttendance(item)}
                disabled={marking === item.id}
              >
                {marking === item.id
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.markText}>✅ Mark</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#38bdf8', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 16 },
  search: {
    backgroundColor: '#1e293b', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 16, fontSize: 16,
    borderWidth: 1, borderColor: '#334155'
  },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#334155',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: '#64748b' },
  markBtn: {
    backgroundColor: '#16a34a', borderRadius: 8,
    padding: 10, alignItems: 'center', minWidth: 80
  },
  markText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  button: {
    backgroundColor: '#1e293b', borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 16
  },
  buttonText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 16 },
});
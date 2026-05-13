// ─── IMPORTS ───
// SecureStore for reading and saving token/user
import * as SecureStore from 'expo-secure-store';
// ImagePicker for selecting photo from gallery
import * as ImagePicker from 'expo-image-picker';
// axios for API requests
import axios from 'axios';
// useRouter for navigation
import { useRouter } from 'expo-router';
// React hooks
import { useEffect, useState } from 'react';
// React Native components
import {
    ActivityIndicator, Alert, Image, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
// Token expiry checker
import { checkTokenExpiry } from '../utils/authCheck';

// ─── CONFIGURATION ───
const API = 'http://192.168.0.105:5000/api';

export default function Profile() {
  // ─── NAVIGATION ───
  const router = useRouter();

  // ─── STATE VARIABLES ───
  const [user, setUser] = useState(null);        // User profile data
  const [name, setName] = useState('');          // Editable name field
  const [photo, setPhoto] = useState(null);      // Profile photo URL
  const [loading, setLoading] = useState(true);  // Loading spinner
  const [saving, setSaving] = useState(false);   // Saving spinner
  const [uploading, setUploading] = useState(false); // Upload spinner

  // ─── LIFECYCLE ───
  // Load profile when screen opens
  useEffect(() => {
    checkTokenExpiry(router); // Check token is valid
    loadProfile();            // Load user profile
  }, []);

  // ─── LOAD PROFILE ───
  // Fetches user profile from backend
  const loadProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      // Fetch profile from backend
      const res = await axios.get(`${API}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Save profile data to state
      setUser(res.data);
      setName(res.data.name);

      // Set photo URL if exists
      if (res.data.photo) {
        setPhoto(`http://192.168.0.105:5000${res.data.photo}`);
      }

    } catch (err) {
      console.log('Profile error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── PICK IMAGE ───
  // Opens photo library for user to select image
  const pickImage = async () => {
    try {
      // Request permission to access photo library
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      // Return if permission denied
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Images only
        allowsEditing: true,   // Allow cropping
        aspect: [1, 1],        // Square crop
        quality: 0.8,          // 80% quality to reduce file size
      });

      // Upload image if user didn't cancel
      if (!result.canceled) {
        uploadImage(result.assets[0]);
      }

    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // ─── UPLOAD IMAGE ───
  // Uploads selected image to backend
  const uploadImage = async (image) => {
    setUploading(true);
    try {
      const token = await SecureStore.getItemAsync('token');

      // Create form data for file upload
      const formData = new FormData();
      formData.append('photo', {
        uri: image.uri,          // Local file path
        type: 'image/jpeg',      // File type
        name: 'profile.jpg',     // File name
      });

      // Upload to backend
      const res = await axios.post(`${API}/profile/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data', // Required for file upload
        }
      });

      // Update photo display with new URL
      setPhoto(`http://192.168.0.105:5000${res.data.photo}`);
      Alert.alert('✅ Success', 'Profile picture updated!');

    } catch (err) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // ─── SAVE PROFILE ───
  // Updates user's name in backend
  const saveProfile = async () => {
    // Validate name is not empty
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('token');

      // Send update request to backend
      await axios.put(`${API}/profile/update`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update stored user data with new name
      const stored = await SecureStore.getItemAsync('user');
      if (stored) {
        const updatedUser = { ...JSON.parse(stored), name };
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      }

      Alert.alert('✅ Success', 'Profile updated successfully!');

    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  // ─── RENDER ───
  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>My Profile</Text>

      {/* ── PROFILE PHOTO SECTION ── */}
      <View style={styles.photoSection}>

        {/* Profile Photo or Default Avatar */}
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          {photo ? (
            // Show uploaded photo
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            // Show default avatar if no photo
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {/* Show first letter of name as avatar */}
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Camera icon overlay */}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraText}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* Upload loading indicator */}
        {uploading && (
          <ActivityIndicator
            size="small"
            color="#38bdf8"
            style={{ marginTop: 8 }}
          />
        )}

        {/* Tap to change photo hint */}
        <Text style={styles.photoHint}>Tap photo to change</Text>
      </View>

      {/* ── PROFILE INFO SECTION ── */}
      <View style={styles.infoSection}>

        {/* Role Badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'instructor' ? '👨‍🏫 Instructor' : '👨‍🎓 Student'}
          </Text>
        </View>

        {/* Subject Badge - Only for instructors */}
        {user?.subject && (
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectText}>📚 {user.subject}</Text>
          </View>
        )}

        {/* Email - Read only */}
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.emailBox}>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Name - Editable */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#64748b"
        />

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#0f172a" />
            : <Text style={styles.saveBtnText}>💾 Save Changes</Text>
          }
        </TouchableOpacity>

      </View>

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  // Loading screen container
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Main scroll container
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center'
  },

  // Page title
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 24
  },

  // Photo section wrapper
  photoSection: {
    alignItems: 'center',
    marginBottom: 32
  },

  // Profile photo circle
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,      // Makes it circular
    borderWidth: 3,
    borderColor: '#38bdf8'
  },

  // Default avatar placeholder
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e293b',
    borderWidth: 3,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // First letter in avatar
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#38bdf8'
  },

  // Camera icon overlay on photo
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#38bdf8',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Camera emoji
  cameraText: { fontSize: 16 },

  // Tap hint text below photo
  photoHint: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8
  },

  // Info section wrapper
  infoSection: { width: '100%' },

  // Role badge
  roleBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    alignSelf: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Role text
  roleText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Subject badge
  subjectBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Subject text
  subjectText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14
  },

  // Field label
  label: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },

  // Email display box - read only
  emailBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Email text
  emailText: {
    color: '#64748b',
    fontSize: 16
  },

  // Name input field
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },

  // Save button
  saveBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },

  // Save button text
  saveBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Back button
  backBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginTop: 8
  },

  // Back button text
  backBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 16
  },
});
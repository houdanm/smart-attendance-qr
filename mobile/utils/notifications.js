// ─── NOTIFICATIONS UTILITY ───
// Simplified version - expo-notifications removed
// Not compatible with Expo Go SDK 53
// All functions are kept as stubs so app still works

// ─── REGISTER ───
// Stub function - does nothing
// Kept so imports dont break
export async function registerForPushNotifications() {
  // expo-notifications not supported in Expo Go SDK 53
  return false;
}

// ─── SEND LOCAL NOTIFICATION ───
// Stub function - shows console log only
// Replace with real implementation when using dev build
export async function sendLocalNotification(title, body) {
  // Just log for now
  console.log(`📱 Notification: ${title} - ${body}`);
}

// ─── SCHEDULE CLASS REMINDER ───
// Stub function - does nothing
export async function scheduleClassReminder(subject, room, time) {
  console.log(`⏰ Reminder: ${subject} at ${time}${room ? ` in ${room}` : ''}`);
  return null;
}

// ─── CANCEL ALL NOTIFICATIONS ───
// Stub function - does nothing
export async function cancelAllNotifications() {
  console.log('🔕 All notifications cancelled');
}

// ─── CANCEL SPECIFIC NOTIFICATION ───
// Stub function - does nothing
export async function cancelNotification(id) {
  console.log('🔕 Notification cancelled:', id);
}
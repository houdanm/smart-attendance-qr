import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';

export default function Login({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch("http://192.168.56.1:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }

      navigation.replace("home");
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        placeholder="Email or Student/Instructor ID"
        value={identifier}
        onChangeText={setIdentifier}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginBottom: 15,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

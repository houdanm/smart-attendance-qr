import { Button, Image, View } from 'react-native';

export default function Home({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 20 }}>

      <Image
        source={require('../assets/classroom.jpg')}
        style={{
          width: '100%',
          height: 200,
          borderRadius: 12,
          marginBottom: 30,
          resizeMode: 'cover'
        }}
      />

      <Button
        title="Show QR Code"
        onPress={() =>
          navigation.navigate("show-qr", { qr_code: "example123" })
        }
      />

      <View style={{ height: 20 }} />

      <Button
        title="Scan QR Code"
        onPress={() => navigation.navigate("scan-qr")}
      />
    </View>
  );
}

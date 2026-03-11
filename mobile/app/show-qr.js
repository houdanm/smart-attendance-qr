import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function ShowQR({ route }) {
  const { qr_code } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <QRCode
        value={qr_code}     // example: "CISC4900|SESSION_12"
        size={250}
      />
    </View>
  );
}


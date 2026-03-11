import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './screens/Home';
import ShowQR from './screens/ShowQR';
import ScanQR from './screens/ScanQR';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ShowQR" component={ShowQR} />
        <Stack.Screen name="ScanQR" component={ScanQR} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

export const checkTokenExpiry = async (router) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      router.replace('/');
      return false;
    }
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      router.replace('/');
      return false;
    }
    return true;
  } catch {
    router.replace('/');
    return false;
  }
};
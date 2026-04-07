import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';

export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

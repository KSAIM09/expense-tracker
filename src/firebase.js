import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyD-wV380lLMXRSSata-9i3gYgDVmtzy37g',
  authDomain: 'expense-tracker-617d6.firebaseapp.com',
  projectId: 'expense-tracker-617d6',
  storageBucket: 'expense-tracker-617d6.appspot.com',
  messagingSenderId: '511414559166',
  appId: '1:511414559166:web:3ff88734d8c9aab32019ef',
  databaseURL: 'https://expense-tracker-617d6-default-rtdb.firebaseio.com/',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db }; 
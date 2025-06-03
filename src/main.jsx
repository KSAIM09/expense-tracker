import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import { ref, onValue } from 'firebase/database';
import { db } from '../src/firebase';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

const expensesRef = ref(db, 'expenses');
onValue(expensesRef, (snapshot) => {
  const data = snapshot.val();
  console.log(data);
});

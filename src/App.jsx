import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import './index.css';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Dashboard from './components/Dashboard';
import Signup from './components/Signup';
import Signin from './components/Signin';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { message } from 'antd';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';


const { Header, Content } = Layout;

function App() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const location = useLocation(); // Get the current location
  const navigate = useNavigate(); // Use for navigation
  const [initializing, setInitializing] = useState(true);

  // Set the current page based on the route
  const currentPage = location.pathname === '/expenses' ? 'expenses' : 'dashboard';

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
    setInitializing(false); // ✅ done loading
    if (!user && location.pathname !== '/signin' && location.pathname !== '/signup') {
      navigate('/signin');
    }
  });
  return () => unsubscribe();
}, [location, navigate]);


  useEffect(() => {
  if (!user) return; // 🔒 Only fetch if user is logged in

  const expensesRef = ref(db, `expenses/${user.uid}`);
  const unsubscribe = onValue(expensesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const expensesArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setExpenses(expensesArray);
    } else {
      setExpenses([]);
    }
  });

  return () => unsubscribe(); // 🔄 Clean up listener when user/logs out or component unmounts
}, [user]); // 👈 Dependency array includes user


  const handleAddExpense = (newExpense) => {
    setExpenses([...expenses, newExpense]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      message.success('Logged out successfully!');
      navigate('/signin'); // Redirect to signin page after logout
    } catch (error) {
      message.error(error.message);
    }
  };

  // Function to capitalize the first letter of the user's name
  const capitalizeFirstLetter = (str) => {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  };

  // Get the user's name or email (with the first character capitalized)
  const userName = capitalizeFirstLetter(user?.displayName || user?.email?.split('@')[0]);

  const menuItems = [
    { key: 'expenses', label: 'Expenses' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <Layout className="layout">
      {/* Conditionally render the Header */}
      {location.pathname !== '/signup' && location.pathname !== '/signin' && (
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Menu
              theme="light"
              mode="horizontal"
              selectedKeys={[currentPage]}
              items={menuItems}
              onClick={({ key }) => {
                if (key === 'expenses') {
                  navigate('/expenses'); // Use navigate instead of window.location.href
                } else if (key === 'dashboard') {
                  navigate('/dashboard'); // Use navigate instead of window.location.href
                }
              }}
              style={{ flex: 1, borderBottom: 'none' }}
            />
            {user && (
              <Space>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                  ) : (
                    <UserOutlined style={{ fontSize: '18px', color: 'black' }} />
                  )}
                  <span style={{ color: 'black',fontWeight: "bold" }}>
                    {userName}
                  </span>
                </span>
                <Button type="primary" danger onClick={handleLogout} style={{ border: "none" }}>
                  Logout
                </Button>
              </Space>
            )}
          </div>
        </Header>
      )}
      <Content style={{ padding: '24px' }}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route
            path="/"
            element={user ? <Navigate to="/expenses" /> : <Navigate to="/signin" />}
          />
          <Route
            path="/expenses"
            element={user ? (
              <>
                <ExpenseForm onAddExpense={handleAddExpense} />
                <ExpenseList expenses={expenses} />
              </>
            ) : <Navigate to="/signin" />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/signin" />}
          />
        </Routes>
      </Content>
    </Layout>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper; 
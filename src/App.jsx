import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space, Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import './index.css';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Dashboard from './components/Dashboard';
import Signup from './components/Signup';
import Signin from './components/Signin';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MonthHistory from './components/MonthHistory';

const { Header, Content } = Layout;

function App() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Get the current location
  const navigate = useNavigate(); // Use for navigation

  // Set the current page based on the route
  let currentPage = 'dashboard';
  if (location.pathname.startsWith('/expenses')) {
    currentPage = 'expenses';
  } else if (location.pathname.startsWith('/dashboard')) {
    currentPage = 'dashboard';
  } else if (location.pathname.startsWith('/month-history')) {
    currentPage = 'month-history';
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (!user && location.pathname !== '/signin' && location.pathname !== '/signup') {
        navigate('/signin'); // Redirect to sign-in page if not authenticated
      }
    });
    return () => unsubscribe();
  }, [location, navigate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Fetch expenses for the logged-in user
    const expensesRef = ref(db, `expenses/${user.uid}`);
    onValue(expensesRef, (snapshot) => {
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
  }, []);

  const handleAddExpense = (newExpense) => {
    setExpenses([...expenses, newExpense]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
      navigate('/signin'); // Redirect to signin page after logout
    } catch (error) {
      toast.error(error.message);
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
    { key: 'month-history', label: 'Month History' },
  ];

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span>Loading...</span></div>;
  }

  return (
    <Layout className="layout">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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
                } else if (key === 'month-history') {
                  navigate('/month-history'); // Use navigate instead of window.location.href
                }
              }}
              style={{ flex: 1, borderBottom: 'none' }}
            />
            {user && (
              <Dropdown
                overlay={
                  <div style={{ padding: 12, minWidth: 160, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>{userName}</div>
                    <Button type="primary" danger onClick={handleLogout} style={{ width: '100%' }}>
                      Logout
                    </Button>
                  </div>
                }
                trigger={['click']}
                placement="bottomRight"
                arrow
              >
                <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                  ) : (
                    <UserOutlined style={{ fontSize: '22px', color: 'black' }} />
                  )}
                </span>
              </Dropdown>
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
          <Route
            path="/month-history"
            element={user ? <MonthHistory /> : <Navigate to="/signin" />}
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
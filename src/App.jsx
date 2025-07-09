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
import InvestmentInsights from './components/InvestmentInsights';
import { MenuOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';
import reactLogo from './assets/react.svg';

const { Header, Content } = Layout;

function App() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Get the current location
  const navigate = useNavigate(); // Use for navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { key: 'investment-insights', label: 'Investment & Insights' },
  ];

  // Responsive navigation
  const isMobile = window.innerWidth < 768;

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span>Loading...</span></div>;
  }

  return (
    <Layout className="layout">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      {/* Conditionally render the Header */}
      {location.pathname !== '/signup' && location.pathname !== '/signin' && (
        <Header 
          style={{ 
            background: 'var(--glass-bg)', 
            backdropFilter: 'blur(var(--glass-blur))', 
            WebkitBackdropFilter: 'blur(var(--glass-blur))', 
            border: 'var(--glass-border)', 
            boxShadow: 'var(--card-shadow)', 
            borderRadius: '0 0 18px 18px', 
            padding: '0 24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            position: 'sticky', 
            top: 0, 
            zIndex: 100, 
            minHeight: 64,
            height: 72,
          }}
          className="glass fade-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, width: '100%' }}>
            {/* Removed React logo from navigation bar */}
            {isMobile ? (
              <>
                <Button
                  type="text"
                  icon={<MenuOutlined style={{ fontSize: 28, color: 'var(--primary)' }} />}
                  onClick={() => setMobileMenuOpen(true)}
                  style={{ marginRight: 16, background: 'var(--glass-bg)', borderRadius: 12, boxShadow: '0 2px 8px rgba(108,99,255,0.08)' }}
                />
                <Drawer
                  title={<span style={{ fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}><img src={reactLogo} alt="logo" style={{ height: 32, marginRight: 8, verticalAlign: 'middle' }} />Menu</span>}
                  placement="left"
                  onClose={() => setMobileMenuOpen(false)}
                  open={mobileMenuOpen}
                  bodyStyle={{ padding: 0, background: 'var(--glass-bg)' }}
                  headerStyle={{ background: 'var(--glass-bg)' }}
                  className="glass fade-in"
                >
                  <Menu
                    mode="vertical"
                    selectedKeys={[currentPage]}
                    items={menuItems}
                    onClick={({ key }) => {
                      setMobileMenuOpen(false);
                      if (key === 'expenses') navigate('/expenses');
                      else if (key === 'dashboard') navigate('/dashboard');
                      else if (key === 'month-history') navigate('/month-history');
                      else if (key === 'investment-insights') navigate('/investment-insights');
                    }}
                    style={{ background: 'transparent', border: 'none', fontWeight: 600, fontSize: 18 }}
                  />
                </Drawer>
              </>
            ) : (
              <Menu
                theme="light"
                mode="horizontal"
                selectedKeys={[currentPage]}
                items={menuItems}
                onClick={({ key }) => {
                  if (key === 'expenses') navigate('/expenses');
                  else if (key === 'dashboard') navigate('/dashboard');
                  else if (key === 'month-history') navigate('/month-history');
                  else if (key === 'investment-insights') navigate('/investment-insights');
                }}
                style={{ flex: 1, borderBottom: 'none', background: 'transparent', fontWeight: 600, fontSize: 18 }}
                className="fade-in"
              />
            )}
            {user && (
              <Dropdown
                overlay={
                  <div style={{ padding: 16, minWidth: 180, background: 'var(--glass-bg)', borderRadius: 16, boxShadow: '0 2px 12px rgba(24,144,255,0.08)', border: 'var(--glass-border)', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 18, color: 'var(--primary)' }}>{userName}</div>
                    <Button type="primary" danger onClick={handleLogout} style={{ width: '100%', borderRadius: 10, fontWeight: 600 }}>
                      Logout
                    </Button>
                  </div>
                }
                trigger={['click']}
                placement="bottomRight"
                arrow
              >
                <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 18 }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      style={{ width: '38px', height: '38px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(108,99,255,0.12)' }}
                    />
                  ) : (
                    <UserOutlined style={{ fontSize: '28px', color: 'var(--primary)' }} />
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
          <Route
            path="/investment-insights"
            element={user ? <InvestmentInsights /> : <Navigate to="/signin" />}
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
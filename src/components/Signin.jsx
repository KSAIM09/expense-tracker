import { useState } from 'react';
import { Button, Form, Input, message, Alert } from 'antd';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

function Signin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast.success('Signed in successfully!');
      navigate('/dashboard'); // Redirect to the Dashboard page
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google successfully!');
      navigate('/dashboard'); // Redirect to the Dashboard page
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: 400, margin: '0 auto', padding: '24px' }}
    >
      <h2>Sign In</h2>
      <Form onFinish={onFinish}>
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email!' }]}
        >
          <Input
            placeholder="Email"
            style={{
              background: 'var(--glass-bg)',
              border: 'var(--glass-border)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(108,99,255,0.08)',
              padding: '10px 16px',
              fontSize: 16,
              transition: 'box-shadow 0.3s, border 0.3s',
              color: 'var(--foreground)',
            }}
            className="fade-in"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            placeholder="Password"
            style={{
              background: 'var(--glass-bg)',
              border: 'var(--glass-border)',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(108,99,255,0.08)',
              padding: '10px 16px',
              fontSize: 16,
              transition: 'box-shadow 0.3s, border 0.3s',
              color: 'var(--foreground)',
            }}
            className="fade-in"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '48px', borderRadius: 14, fontWeight: 700, fontSize: 18, background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(108,99,255,0.18)', transition: 'background 0.3s, box-shadow 0.3s' }} className="fade-in">
            Sign In
          </Button>
        </Form.Item>
      </Form>
      <Button
        type="default"
        icon={<GoogleOutlined />}
        onClick={handleGoogleSignIn}
        style={{ width: '100%', height: '48px', marginTop: '-10px', borderRadius: 14, fontWeight: 700, fontSize: 18, background: 'var(--glass-bg)', boxShadow: '0 2px 8px rgba(108,99,255,0.08)', color: 'var(--foreground)', border: 'var(--glass-border)', transition: 'background 0.3s, box-shadow 0.3s' }}
        className="fade-in"
      >
        Sign In with Google
      </Button>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </div>
    </motion.div>
  );
}

export default Signin; 
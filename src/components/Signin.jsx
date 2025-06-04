import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

function Signin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      await signInWithEmailAndPassword(auth, email, password);
      message.success('Signin successful!');
      navigate('/'); // Redirect to the main app
    } catch (error) {
      console.error('Signin error:', error);
      if (error.code === 'auth/user-not-found') {
        message.error('User not found. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        message.error('Incorrect password. Please try again.');
      } else {
        message.error('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      message.success('Google Sign-In successful!');
      navigate('/'); // Redirect to the main app
    } catch (error) {
      console.error('Google Sign-In error:', error);
      message.error(error.message || 'Failed to sign in with Google.');
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
          <Input placeholder="Email" style={{ height: '40px', padding: '8px 12px' }} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" style={{ height: '40px' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '48px' }}>
            Sign In
          </Button>
        </Form.Item>
      </Form>
      <Button
        type="default"
        icon={<GoogleOutlined />}
        onClick={handleGoogleSignIn}
        style={{ width: '100%', height: '48px', marginTop: '-10px' }}
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
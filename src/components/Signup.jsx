import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

function Signup() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      message.success('Signup successful!');
      navigate('/'); // Redirect to the main app
    } catch (error) {
      message.error(error.message);
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
      message.error(error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: 400, margin: '0 auto', padding: '24px' }}
    >
      <h2>Sign Up</h2>
      <Form onFinish={onFinish}>
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email!' }]}
        >
          <Input placeholder="Email" style={{ height: '40px' }} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" style={{ height: '40px' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Sign Up
          </Button>
        </Form.Item>
      </Form>
      <Button
        type="default"
        icon={<GoogleOutlined />}
        onClick={handleGoogleSignIn}
        style={{ width: '100%', marginTop: '12px' }}
      >
        Sign Up with Google
      </Button>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        Already have an account? <Link to="/signin">Sign In</Link>
      </div>
    </motion.div>
  );
}

export default Signup; 
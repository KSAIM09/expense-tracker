import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input, Button, message } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { ref, push } from 'firebase/database';
import { db } from '../firebase';

function ExpenseForm({ onAddExpense }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date

  const handleSubmit = (e) => {
    e.preventDefault();
    const expense = {
      title,
      amount: +amount,
      date, // Include the date field
    };

    // Add expense to Realtime Database
    push(ref(db, 'expenses'), expense)
      .then(() => {
        onAddExpense(expense); // Call the function passed from the parent
        setTitle('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]); // Reset date to today

        // Show success message at the middle top
        message.success('Expense added successfully!', 3); // 3 seconds duration
      })
      .catch((error) => {
        console.error('Error adding expense: ', error);
        // Show error message at the middle top
        message.error('Failed to add expense. Please try again.', 3); // 3 seconds duration
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 style={{ marginBottom: '16px' }}>Add New Expense</h2>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '8px' }}
        />
        <Input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '8px' }}
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '8px' }}
        />
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusCircleOutlined />}
          style={{ width: '100%' }}
        >
          Add Expense
        </Button>
      </form>
    </motion.div>
  );
}

export default ExpenseForm; 
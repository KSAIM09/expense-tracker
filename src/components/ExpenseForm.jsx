import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input, Button, message, DatePicker, Select, Form } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { ref, push, get, onValue } from 'firebase/database';
import { db, auth } from '../firebase';

function ExpenseForm({ onAddExpense }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [visibleExpenses, setVisibleExpenses] = useState(3); // State to control visible expenses
  const [expenses, setExpenses] = useState([]); // State to store fetched expenses

  // Fetch expenses from Firebase
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const expensesRef = ref(db, `expenses/${user.uid}`);
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const expenseList = [];
        Object.keys(data).forEach((date) => {
          if (typeof data[date] === 'object') { // Ensure it's a date node
            Object.keys(data[date]).forEach((expenseId) => {
              expenseList.push({
                id: expenseId,
                date,
                ...data[date][expenseId],
              });
            });
          }
        });
        setExpenses(expenseList);
      } else {
        setExpenses([]);
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        message.error('You must be logged in to add an expense.');
        return;
      }

      const { title, amount, category, date } = values;
      const formattedDate = date.format('YYYY-MM-DD'); // Format the date
      const dateRef = ref(db, `expenses/${user.uid}/${formattedDate}`);

      // Check if the date node exists
      const snapshot = await get(dateRef);
      if (!snapshot.exists()) {
        // If the date node doesn't exist, create it
        await push(dateRef, {}); // Initialize the date node
      }

      // Add the expense under the date node
      const expenseRef = ref(db, `expenses/${user.uid}/${formattedDate}`);
      await push(expenseRef, { title, amount, category });

      onAddExpense({ title, amount, category, date: formattedDate });
      form.resetFields(); // Reset the form fields after submission
      message.success('Expense added successfully!', 3);
    } catch (error) {
      console.error('Error adding expense: ', error);
      message.error('Failed to add expense: ' + error.message, 3);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle "Load More" button click
  const handleLoadMore = () => {
    setVisibleExpenses((prev) => prev + 5); // Increase visible expenses by 5
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 style={{ marginBottom: '16px' }}>Add New Expense</h2>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please input the title!' }]}
          style={{ marginBottom: '12px' }}
        >
          <Input placeholder="Enter title" required />
        </Form.Item>
        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true, message: 'Please input the amount!' }]}
          style={{ marginBottom: '12px' }}
        >
          <Input type="number" placeholder="Enter amount" required />
        </Form.Item>
        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: 'Please select the date!' }]}
          style={{ marginBottom: '12px' }}
        >
          <DatePicker style={{ width: '100%' }} required />
        </Form.Item>
        <Form.Item
          label="Category"
          name="category"
          rules={[{ required: true, message: 'Please select a category!' }]}
          style={{ marginBottom: '12px' }}
        >
          <Select placeholder="Select category" required>
            <Select.Option value="Food">Food</Select.Option>
            <Select.Option value="Transport">Transport</Select.Option>
            <Select.Option value="Entertainment">Entertainment</Select.Option>
            <Select.Option value="Utilities">Utilities</Select.Option>
            <Select.Option value="Others">Others</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item style={{ marginBottom: '12px' }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusCircleOutlined />}
            style={{ width: '100%', height: '48px', color: "white" }}
            loading={loading}
          >
            Add Expense
          </Button>
        </Form.Item>
      </Form>
    </motion.div>
  );
}

export default ExpenseForm;
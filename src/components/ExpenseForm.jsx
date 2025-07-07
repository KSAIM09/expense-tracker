import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input, Button, DatePicker, Select, Form } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { ref, push, get, onValue } from 'firebase/database';
import { db, auth } from '../firebase';
import { toast } from 'react-toastify';
import moment from 'moment';

function ExpenseForm({ onAddExpense }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [expenses, setExpenses] = useState([]); // State to store fetched expenses
  const [budgets, setBudgets] = useState(null);

  // Fetch expenses and budgets from Firebase
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Get current month key (YYYY-MM)
    const currentMonthKey = moment().format('YYYY-MM');

    // Fetch expenses for the current month only
    const expensesRef = ref(db, `expenses/${user.uid}`);
    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      const expenseList = [];
      if (data) {
        Object.keys(data).forEach((date) => {
          if (typeof data[date] === 'object' && date.startsWith(currentMonthKey)) {
            Object.keys(data[date]).forEach((expenseId) => {
              expenseList.push({ ...data[date][expenseId], id: expenseId, date });
            });
          }
        });
      }
      setExpenses(expenseList);
    });

    // Fetch budget for the current month only
    const budgetRef = ref(db, `budgets/${user.uid}/${currentMonthKey}`);
    const unsubscribeBudgets = onValue(budgetRef, (snapshot) => {
      setBudgets(snapshot.val());
    });

    // Cleanup the listeners on unmount
    return () => {
      unsubscribeExpenses();
      unsubscribeBudgets();
    };
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to add an expense.');
        return;
      }

      const { title, amount, category, date } = values;
      const formattedDate = date.format('YYYY-MM-DD');
      const expenseRef = ref(db, `expenses/${user.uid}/${formattedDate}`);
      
      await push(expenseRef, { title, amount: parseFloat(amount), category });

      onAddExpense({ title, amount, category, date: formattedDate });
      form.resetFields();
      toast.success('Expense added successfully!');

      // Check budget alerts (for current month only)
      if (budgets) {
        const newAmount = parseFloat(amount);
        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0) + newAmount;

        // Overall budget check
        if (budgets.overall && parseFloat(budgets.overall) > 0) {
          const overallBudget = parseFloat(budgets.overall);
          if (totalSpent >= overallBudget) {
            toast.error(`You've exceeded your overall budget of ₹${overallBudget}!`, { autoClose: 5000 });
          } else if (totalSpent >= overallBudget * 0.9) {
            toast.warn(`You've used over 90% of your overall budget!`, { autoClose: 5000 });
          }
        }

        // Category budget check
        if (budgets[category] && parseFloat(budgets[category]) > 0) {
          const categoryTotal = expenses
            .filter(exp => exp.category === category)
            .reduce((sum, exp) => sum + exp.amount, 0) + newAmount;
          const categoryBudget = parseFloat(budgets[category]);
          if (categoryTotal >= categoryBudget) {
            toast.error(`You've exceeded your ${category} budget of ₹${categoryBudget}!`, { autoClose: 5000 });
          } else if (categoryTotal >= categoryBudget * 0.9) {
            toast.warn(`You've used over 90% of your ${category} budget!`, { autoClose: 5000 });
          }
        }
      }
    } catch (error) {
      console.error('Error adding expense: ', error);
      toast.error('Failed to add expense: ' + error.message);
    } finally {
      setLoading(false);
    }
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
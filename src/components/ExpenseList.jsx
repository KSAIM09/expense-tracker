import { useEffect, useState } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db, auth } from '../firebase';
import { DatePicker, Row, Col, Button, message, Popconfirm } from 'antd';
import ExpenseItem from './ExpenseItem';
import { motion, AnimatePresence } from 'framer-motion';
import { DeleteOutlined } from '@ant-design/icons';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3); // Show 3 expenses initially

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.error('User is not authenticated.');
      return;
    }

    const expensesRef = ref(db, `expenses/${user.uid}`);
    onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Fetched data:', data); // Log the fetched data
        const expensesArray = [];
        Object.keys(data).forEach((date) => {
          if (typeof data[date] === 'object') { // Ensure it's a date node
            Object.keys(data[date]).forEach((expenseId) => {
              expensesArray.push({
                id: expenseId,
                date,
                ...data[date][expenseId],
              });
            });
          }
        });
        // Sort by date descending, then by id (if needed)
        expensesArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(expensesArray);
        filterExpensesByDate(expensesArray, selectedDate);
      } else {
        console.log('No data found.');
        setExpenses([]);
        setFilteredExpenses([]);
      }
    });
  }, []);

  const filterExpensesByDate = (expenses, date) => {
    if (date) {
      const filtered = expenses.filter((expense) => expense.date === date.format('YYYY-MM-DD'));
      // Sort filtered by date descending
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFilteredExpenses(filtered);
    } else {
      // Sort all by date descending
      const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
      setFilteredExpenses(sorted);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterExpensesByDate(expenses, date);
  };

  // Function to delete a single expense
  const handleDeleteExpense = async (expenseId, date) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        message.error('You must be logged in to delete expenses.');
        return;
      }

      // Ensure the expenseRef points to the specific expense under the date node
      const expenseRef = ref(db, `expenses/${user.uid}/${date}/${expenseId}`);
      await remove(expenseRef); // Delete the specific expense
      message.success('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      message.error('Failed to delete expense. Please try again.');
    }
  };

  // Function to load more expenses
  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 5); // Load 5 more expenses
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <Col>
          <h2 style={{ margin: 0 }}>Recent Expenses</h2>
        </Col>
        <Col>
          <DatePicker
            placeholder="Select a date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      <AnimatePresence>
        {filteredExpenses.slice(0, visibleCount).map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <ExpenseItem
              expense={expense}
              onDeleteExpense={handleDeleteExpense}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {filteredExpenses.length > visibleCount && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            type="primary"
            onClick={handleLoadMore}
            style={{ width: '100%', color: '#fff' }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExpenseList; 
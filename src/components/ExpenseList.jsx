import { useEffect, useState } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db, auth } from '../firebase';
import { DatePicker, Row, Col, Button } from 'antd';
import ExpenseItem from './ExpenseItem';
import { motion, AnimatePresence } from 'framer-motion';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3); // Show 3 expenses initially

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
        filterExpensesByDate(expensesArray, selectedDate);
      } else {
        setExpenses([]);
        setFilteredExpenses([]);
      }
    });
  }, []);

  const filterExpensesByDate = (expenses, date) => {
    if (date) {
      const filtered = expenses.filter((expense) => expense.date === date.format('YYYY-MM-DD'));
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterExpensesByDate(expenses, date);
  };

  // Function to delete a single expense
  const handleDeleteExpense = (expenseId) => {
    const user = auth.currentUser;
    if (!user) return;

    remove(ref(db, `expenses/${user.uid}/${expenseId}`))
      .then(() => {
        console.log('Expense deleted successfully!');
        setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));
        setFilteredExpenses((prevFiltered) => prevFiltered.filter((expense) => expense.id !== expenseId));
      })
      .catch((error) => {
        console.error('Error deleting expense: ', error);
      });
  };

  // Function to load more expenses
  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 5); // Load 5 more expenses
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <Col>
          <h2 style={{ margin: 0 }}>Expenses</h2>
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
          <Button type="primary" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExpenseList; 
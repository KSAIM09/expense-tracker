import { useEffect, useState } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import { DatePicker, Row, Col } from 'antd';
import ExpenseItem from './ExpenseItem';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    console.log('db:', db); // Add this line before using `db`
    // Fetch expenses from Realtime Database
    const expensesRef = ref(db, 'expenses');
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
    remove(ref(db, `expenses/${expenseId}`))
      .then(() => {
        console.log('Expense deleted successfully!');
        // Update the local state to remove the deleted expense
        setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));
        setFilteredExpenses((prevFiltered) => prevFiltered.filter((expense) => expense.id !== expenseId));
      })
      .catch((error) => {
        console.error('Error deleting expense: ', error);
      });
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
      {filteredExpenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onDeleteExpense={handleDeleteExpense}
        />
      ))}
    </div>
  );
}

export default ExpenseList; 
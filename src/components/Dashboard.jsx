import { useState, useEffect } from 'react';
import { Table, Button, Popconfirm, message, Space, Modal, Form, Input, DatePicker } from 'antd';
import { CloseCircleOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { ref, onValue, remove, update } from 'firebase/database';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();

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

        // Group expenses by date
        const grouped = expensesArray.reduce((acc, expense) => {
          const date = expense.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(expense);
          return acc;
        }, {});
        setGroupedExpenses(grouped);
      } else {
        setExpenses([]);
        setGroupedExpenses({});
      }
    });
  }, []);

  const handleShowExpenses = (date) => {
    setSelectedDate(date);
  };

  const handleCloseContainer = () => {
    setSelectedDate(null);
  };

  // Delete a single expense
  const handleDeleteExpense = (expenseId) => {
    remove(ref(db, `expenses/${expenseId}`))
      .then(() => message.success('Expense deleted!'))
      .catch(() => message.error('Failed to delete expense.'));
  };

  // Delete all expenses for a day
  const handleDeleteAllForDay = () => {
    const promises = groupedExpenses[selectedDate].map((expense) =>
      remove(ref(db, `expenses/${expense.id}`))
    );
    Promise.all(promises)
      .then(() => {
        message.success('All expenses for the day deleted!');
        setSelectedDate(null);
      })
      .catch(() => message.error('Failed to delete all expenses for the day.'));
  };

  // Open modal for editing an expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      title: expense.title,
      amount: expense.amount,
      date: moment(expense.date, 'YYYY-MM-DD'),
    });
    setIsModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingExpense(null);
    form.resetFields();
  };

  // Handle form submission for editing an expense
  const handleEditSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const updatedExpense = {
          ...editingExpense,
          title: values.title,
          amount: +values.amount,
          date: values.date.format('YYYY-MM-DD'),
        };

        // Update expense in Firebase
        update(ref(db, `expenses/${editingExpense.id}`), updatedExpense)
          .then(() => {
            message.success('Expense updated successfully!');
            setIsModalVisible(false);
            setEditingExpense(null);
            form.resetFields();
          })
          .catch(() => {
            message.error('Failed to update expense. Please try again.');
          });
      })
      .catch((error) => {
        console.error('Validation failed:', error);
      });
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Total Expenses',
      dataIndex: 'total',
      key: 'total',
      render: (_, record) => `₹${record.total}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleShowExpenses(record.date)}
          style={{ color: 'white', backgroundColor: '#1890ff', borderColor: '#1890ff' }}
        >
          Show
        </Button>
      ),
    },
  ];

  const dataSource = Object.keys(groupedExpenses).map((date) => ({
    key: date,
    date,
    total: groupedExpenses[date].reduce((sum, expense) => sum + expense.amount, 0),
  }));

  return (
    <div style={{
      width: '100%',
      maxWidth: 900,
      margin: '0 auto',
      padding: '24px 8px',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        style={{ marginBottom: '16px', overflowX: 'auto' }}
        rowKey="key"
        components={{
          body: {
            row: ({ children, ...props }) => (
              <motion.tr
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                {...props}
              >
                {children}
              </motion.tr>
            ),
          },
        }}
      />

      <AnimatePresence mode="wait">
        {selectedDate && groupedExpenses[selectedDate] && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            style={{
              padding: '20px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              position: 'relative',
              background: '#fff',
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              marginBottom: 24,
              minHeight: 120,
            }}
          >
            <CloseCircleOutlined
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                cursor: 'pointer',
                fontSize: '22px',
                color: '#888',
                zIndex: 1,
                marginBottom: '40px',
              }}
              onClick={handleCloseContainer}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '40px',
            }}>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>
                Expenses for {selectedDate}
              </h3>
              <Popconfirm
                title="Delete all expenses for this day?"
                onConfirm={handleDeleteAllForDay}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined style={{ color: 'white' }} />}
                  style={{
                    background: '#ff4d4f',
                    borderColor: '#ff4d4f',
                    color: 'white',
                    fontWeight: 500,
                    marginLeft: 0,
                  }}
                  size="small"
                >
                  Delete All
                </Button>
              </Popconfirm>
            </div>
            {groupedExpenses[selectedDate].map((expense) => (
              <div
                key={expense.id}
                style={{
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f7f7f7',
                  borderRadius: 6,
                  padding: '10px 14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{expense.title}</div>
                  <div style={{ color: '#1890ff', fontWeight: 600 }}>₹{expense.amount}</div>
                </div>
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                    onClick={() => handleEditExpense(expense)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  />
                  <Popconfirm
                    title="Delete this expense?"
                    onConfirm={() => handleDeleteExpense(expense.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        marginLeft: 8
                      }}
                    />
                  </Popconfirm>
                </Space>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        title="Edit Expense"
        visible={isModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleModalClose}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title!' }]}
          >
            <Input placeholder="Title" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter an amount!' }]}
          >
            <Input type="number" placeholder="Amount" />
          </Form.Item>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Dashboard; 
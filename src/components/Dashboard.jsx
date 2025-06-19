import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
} from "antd";
import {
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { ref, onValue, remove, update, set } from "firebase/database";
import { db, auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();

  const user = auth.currentUser;

  // Function to capitalize the first letter of the user's name
  const capitalizeFirstLetter = (str) => {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
  };

  // Get the user's name or email (with the first character capitalized)
  const userName = capitalizeFirstLetter(
    user?.displayName || user?.email?.split("@")[0]
  );

  // Fetch expenses from Firebase
  useEffect(() => {
    if (!auth.currentUser) {
      setExpenses([]);
      setGroupedExpenses({});
      return;
    }
    const expensesRef = ref(db, `expenses/${auth.currentUser.uid}`);
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const expenseList = [];
        Object.keys(data).forEach((date) => {
          if (typeof data[date] === "object") {
            // Ensure it's a date node
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
        groupExpensesByDate(expenseList); // Group expenses by date
      } else {
        setExpenses([]);
        setGroupedExpenses({});
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Group expenses by date
  const groupExpensesByDate = (expenses) => {
    const grouped = expenses.reduce((acc, expense) => {
      const date = expense.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(expense);
      return acc;
    }, {});
    setGroupedExpenses(grouped);
  };

  // Group expenses by category
  const categoryData = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += parseFloat(expense.amount);
    return acc;
  }, {});

  // Convert category data to array for the pie chart
  const pieChartData = Object.keys(categoryData).map((category) => ({
    name: category,
    value: categoryData[category],
  }));

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

  // Calculate total spent in the current month
  const currentMonth = moment().format('YYYY-MM');
  const monthlyTotal = expenses
    .filter(exp => exp.date && exp.date.startsWith(currentMonth))
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const handleShowExpenses = (date) => {
    setSelectedDate(date);
  };

  const handleCloseContainer = () => {
    setSelectedDate(null);
  };

  // Delete all expenses for a specific date
  const handleDeleteAllForDate = (date) => {
    const expensesRef = ref(db, `expenses/${auth.currentUser.uid}/${date}`);
    remove(expensesRef)
      .then(() => {
        message.success(`All expenses for ${date} deleted successfully!`);
        setSelectedDate(null); // Close the container
      })
      .catch(() => {
        message.error("Failed to delete expenses.");
      });
  };

  // Delete a single expense
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

  // Open modal for editing an expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: moment(expense.date, "YYYY-MM-DD"),
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
          category: values.category,
          date: values.date.format("YYYY-MM-DD"),
        };

        // Update expense in Firebase
        const expenseRef = ref(
          db,
          `expenses/${auth.currentUser.uid}/${updatedExpense.date}/${updatedExpense.id}`
        );
        update(expenseRef, updatedExpense)
          .then(() => {
            message.success("Expense updated successfully!");
            setIsModalVisible(false);
            setEditingExpense(null);
            form.resetFields();
          })
          .catch(() => {
            message.error("Failed to update expense. Please try again.");
          });
      })
      .catch((error) => {
        console.error("Validation failed:", error);
      });
  };

  // Table columns for day-wise expenses
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handleShowExpenses(record.date)}
          style={{
            backgroundColor: "#1890ff",
            borderColor: "#1890ff",
            color: "#fff",
          }}
        >
          Show
        </Button>
      ),
    },
  ];

  // Prepare data for the table
  const dataSource = Object.keys(groupedExpenses)
    .sort((a, b) => new Date(b) - new Date(a)) // Sort by date descending
    .map((date) => {
      const totalAmount = groupedExpenses[date].reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );
      return {
        key: date,
        date,
        totalAmount: `₹${totalAmount.toFixed(2)}`,
      };
    });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 8px",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ marginBottom: "24px" }}>Welcome, {userName}</h1>

      {/* Monthly Total Box */}
      <div style={{
        margin: "0 auto 24px auto",
        padding: "24px 0",
        background: "#e6f7ff",
        borderRadius: "10px",
        fontSize: "2rem",
        fontWeight: 700,
        color: "#1890ff",
        boxShadow: "0 2px 8px rgba(24,144,255,0.08)",
        maxWidth: 400,
        textAlign: "center"
      }}>
        Total Spent This Month: ₹{monthlyTotal.toFixed(2)}
      </div>

      {/* Pie Chart for Expense Categories */}
      <div style={{ marginBottom: "24px" }}>
        <h3>Expense Categories</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label
            >
              {pieChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="key"
        pagination={{ pageSize: 5, position: ["bottomRight"] }}
        scroll={false}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ color: '#888', fontWeight: 500, marginBottom: "20px" }}>
          Total Days: {dataSource.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedDate && groupedExpenses[selectedDate] && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            style={{
              padding: "20px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              position: "relative",
              background: "#fff",
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
              marginBottom: 24,
              minHeight: 120,
            }}
          >
            <CloseCircleOutlined
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                cursor: "pointer",
                fontSize: "22px",
                color: "#888",
                zIndex: 1,
                marginBottom: "40px",
              }}
              onClick={handleCloseContainer}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "40px",
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>
                Expenses for <span style={{ color: "#178fff", marginLeft: "20px", fontWeight: "900"}}>{moment(selectedDate, 'YYYY-MM-DD').format('D MMMM')}</span>
              </h3>
              <Popconfirm
                title="Delete all expenses for this day?"
                onConfirm={() => handleDeleteAllForDate(selectedDate)}
                okText="Yes"
                cancelText="No"
                placement="top"
                overlayStyle={{
                  maxWidth: "200px",
                  wordWrap: "break-word",
                  textAlign: "center",
                }}
                okButtonProps={{ style: { width: "80px", marginRight: "8px", color: "white" } }}
                cancelButtonProps={{ style: { width: "80px", color: "white" } }}
              >
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined style={{ color: "white" }} />}
                  style={{
                    background: "#ff4d4f",
                    borderColor: "#ff4d4f",
                    color: "white",
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
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f7f7f7",
                  borderRadius: 6,
                  padding: "10px 14px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{expense.title}</div>
                  <div style={{ color: "#1890ff", fontWeight: 600 }}>
                    ₹{expense.amount}
                  </div>
                </div>
                <Space>
                  <Button
                    type="text"
                    icon={
                      <EditOutlined
                        style={{ color: "#1890ff", fontSize: 20 }}
                      />
                    }
                    onClick={() => handleEditExpense(expense)}
                    style={{
                      background: "transparent",
                      border: "none",
                      boxShadow: "none",
                    }}
                  />
                  <Popconfirm
                    title="Delete this expense?"
                    onConfirm={() => handleDeleteExpense(expense.id, selectedDate)}
                    okText="Yes"
                    cancelText="No"
                    placement="top"
                    overlayStyle={{
                      maxWidth: "200px",
                      wordWrap: "break-word",
                      textAlign: "center",
                    }}
                    okButtonProps={{
                      style: {
                        width: "80px",
                        marginRight: "8px",
                        color: "white",
                      },
                    }}
                    cancelButtonProps={{
                      style: { width: "80px", color: "white" },
                    }}
                  >
                    <Button
                      type="text"
                      icon={
                        <DeleteOutlined
                          style={{ color: "#ff4d4f", fontSize: 20 }}
                        />
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        boxShadow: "none",
                        marginLeft: 8,
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
            rules={[{ required: true, message: "Please enter a title!" }]}
          >
            <Input placeholder="Title" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter an amount!" }]}
          >
            <Input type="number" placeholder="Amount" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select a category!" }]}
          >
            <Select placeholder="Select category">
              <Select.Option value="Food">Food</Select.Option>
              <Select.Option value="Transport">Transport</Select.Option>
              <Select.Option value="Entertainment">Entertainment</Select.Option>
              <Select.Option value="Utilities">Utilities</Select.Option>
              <Select.Option value="Others">Others</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please select a date!" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Dashboard;

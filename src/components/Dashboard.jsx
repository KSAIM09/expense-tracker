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
  Select,
  Progress,
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
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgets, setBudgets] = useState({ overall: '', Food: '', Transport: '', Entertainment: '', Utilities: '', Others: '' });
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [currentMonthKey, setCurrentMonthKey] = useState(moment().format('YYYY-MM'));
  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(moment());
  const [showCopyPrevModal, setShowCopyPrevModal] = useState(false);
  const [prevMonthBudget, setPrevMonthBudget] = useState(null);

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
    if (!user) {
      setExpenses([]);
      setGroupedExpenses({});
      return;
    }
    const expensesRef = ref(db, `expenses/${user.uid}`);
    const unsubscribe = onValue(
      expensesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const expensesArray = [];
          Object.keys(data).forEach((date) => {
            if (typeof data[date] === "object") {
              // Ensure it's a date node
              Object.keys(data[date]).forEach((expenseId) => {
                expensesArray.push({
                  id: expenseId,
                  date,
                  ...data[date][expenseId],
                });
              });
            }
          });
          setExpenses(expensesArray);
          groupExpensesByDate(expensesArray); // Group expenses by date
        } else {
          setExpenses([]);
          setGroupedExpenses({});
        }
      },
      (error) => {
        console.error("Error fetching expenses:", error);
        message.error(
          "Failed to fetch expenses data. Please try again later."
        );
      }
    );

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [user]);

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

  // Filter expenses for the selected month
  const selectedMonthKey = selectedBudgetMonth.format('YYYY-MM');
  const filteredExpenses = expenses.filter(exp => exp.date && exp.date.startsWith(selectedMonthKey));

  // Group filtered expenses by date
  const groupedFilteredExpenses = filteredExpenses.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {});

  // Group expenses by category for the pie chart (filtered)
  const categoryData = filteredExpenses.reduce((acc, expense) => {
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

  // Calculate total spent for the selected month
  const selectedMonthTotal = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const handleShowExpenses = (date) => {
    setSelectedDate(date);
  };

  const handleCloseContainer = () => {
    setSelectedDate(null);
  };

  // Delete all expenses for a specific date
  const handleDeleteAllForDate = (date) => {
    const expensesRef = ref(db, `expenses/${user.uid}/${date}`);
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
          `expenses/${user.uid}/${updatedExpense.date}/${updatedExpense.id}`
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

  const handleCategoryClick = (data) => {
    setSelectedCategory(data.name);
    setIsCategoryModalVisible(true);
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalVisible(false);
    setSelectedCategory(null);
    setSelectedMonth(moment());
  };

  const filteredCategoryExpenses = expenses.filter(expense => {
    const expenseMonth = moment(expense.date).format('YYYY-MM');
    const selectedMonthFormatted = selectedMonth.format('YYYY-MM');
    return expense.category === selectedCategory && expenseMonth === selectedMonthFormatted;
  });

  // Table columns for day-wise expenses
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend',
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

  // Prepare data for the table (filtered)
  const dataSource = Object.keys(groupedFilteredExpenses)
    .sort((a, b) => new Date(b) - new Date(a)) // Sort by date descending
    .map((date) => {
      const totalAmount = groupedFilteredExpenses[date].reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );
      return {
        key: date,
        date,
        totalAmount: `₹${totalAmount.toFixed(2)}`,
      };
    });

  // Fetch budgets from Firebase (per month, for selected month)
  useEffect(() => {
    if (!user) return;
    const monthKey = selectedBudgetMonth.format('YYYY-MM');
    setCurrentMonthKey(monthKey);
    const budgetRef = ref(db, `budgets/${user.uid}/${monthKey}`);
    onValue(budgetRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBudgets({ ...budgets, ...data });
      } else {
        setBudgets({ overall: '', Food: '', Transport: '', Entertainment: '', Utilities: '', Others: '' });
        // If current month and no budget, check previous month
        if (monthKey === moment().format('YYYY-MM')) {
          const prevMonthKey = moment().subtract(1, 'month').format('YYYY-MM');
          const prevBudgetRef = ref(db, `budgets/${user.uid}/${prevMonthKey}`);
          onValue(prevBudgetRef, (snap) => {
            const prevData = snap.val();
            if (prevData) {
              setPrevMonthBudget(prevData);
              setShowCopyPrevModal(true);
            }
          }, { onlyOnce: true });
        }
      }
    });
    // eslint-disable-next-line
  }, [user, selectedBudgetMonth]);

  // Save budgets to Firebase (per month)
  const handleSaveBudgets = async (values) => {
    if (!user) return;
    setBudgetLoading(true);
    try {
      const monthKey = currentMonthKey;
      await set(ref(db, `budgets/${user.uid}/${monthKey}`), values);
      toast.success('Budgets saved!');
      setBudgetModalVisible(false);
      setBudgets(values);
    } catch (e) {
      toast.error('Failed to save budgets');
    } finally {
      setBudgetLoading(false);
    }
  };

  // Calculate totals for progress bars (filtered for selected month)
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const categoryTotals = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  // Responsive styles
  const progressContainerStyle = {
    marginBottom: 16,
    padding: '12px',
    borderRadius: '10px',
    background: '#f9f9f9',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    maxWidth: 500,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  // Handle copy previous month budget
  const handleCopyPrevBudget = async () => {
    if (!user || !prevMonthBudget) return;
    const monthKey = currentMonthKey;
    await set(ref(db, `budgets/${user.uid}/${monthKey}`), prevMonthBudget);
    setBudgets(prevMonthBudget);
    setShowCopyPrevModal(false);
  };

  // Handle dismiss copy modal
  const handleDismissCopyModal = () => {
    setShowCopyPrevModal(false);
  };

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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={() => setBudgetModalVisible(true)} 
          style={{ color: 'white' }}
        >
          Set Budget
        </Button>
        <Button 
          onClick={() => setShowBudgets(!showBudgets)}
          style={showBudgets
            ? { background: '#1890ff', color: '#fff', border: 'none' }
            : { background: '#fff', color: '#1890ff', border: '1px solid #1890ff' }
          }
        >
          {showBudgets ? 'Hide Budgets' : 'Show Budgets'}
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <ReactDatePicker
          selected={selectedBudgetMonth.toDate()}
          onChange={date => setSelectedBudgetMonth(moment(date))}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          className="ant-input dashboard-month-picker"
          maxDate={new Date()}
          style={{ minWidth: 180, border: 'none', borderRadius: 20 }}
        />
      </div>

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
        Total Spent This Month: ₹{selectedMonthTotal.toFixed(2)}
      </div>
      
      <AnimatePresence>
        {showBudgets && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Overall Budget Progress */}
            {budgets.overall && (
              <div style={progressContainerStyle}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Overall Budget: ₹{budgets.overall}</div>
                <Progress percent={Math.min(100, ((totalSpent / budgets.overall) * 100).toFixed(0))} status={totalSpent > budgets.overall ? 'exception' : 'active'} />
                <div style={{ color: totalSpent > budgets.overall ? 'red' : '#1890ff', fontWeight: 600, marginTop: 4 }}>
                  {totalSpent > budgets.overall ? 'Over budget!' : `₹${totalSpent} / ₹${budgets.overall}`}
                </div>
              </div>
            )}
            {/* Per-Category Budgets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {Object.keys(budgets).filter(k => k !== 'overall').map(cat => budgets[cat] && (
                <div key={cat} style={{ ...progressContainerStyle, minWidth: 220, flex: '1 1 220px' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{cat} Budget: ₹{budgets[cat]}</div>
                  <Progress percent={Math.min(100, ((categoryTotals[cat] || 0) / budgets[cat]) * 100)} status={(categoryTotals[cat] || 0) > budgets[cat] ? 'exception' : 'active'} />
                  <div style={{ color: (categoryTotals[cat] || 0) > budgets[cat] ? 'red' : '#1890ff', fontWeight: 600, marginTop: 4 }}>
                    {(categoryTotals[cat] || 0) > budgets[cat] ? 'Over budget!' : `₹${categoryTotals[cat] || 0} / ₹${budgets[cat]}`}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        title="Set Budgets"
        open={budgetModalVisible}
        onCancel={() => setBudgetModalVisible(false)}
        footer={null}
        width={350}
        style={{ top: 40 }}
        bodyStyle={{ padding: 16 }}
      >
        <Form
          layout="vertical"
          initialValues={budgets}
          onFinish={handleSaveBudgets}
        >
          <Form.Item label="Overall Budget" name="overall">
            <Input type="number" placeholder="Enter overall budget" min={0} />
          </Form.Item>
          <Form.Item label="Food Budget" name="Food">
            <Input type="number" placeholder="Enter Food budget" min={0} />
          </Form.Item>
          <Form.Item label="Transport Budget" name="Transport">
            <Input type="number" placeholder="Enter Transport budget" min={0} />
          </Form.Item>
          <Form.Item label="Entertainment Budget" name="Entertainment">
            <Input type="number" placeholder="Enter Entertainment budget" min={0} />
          </Form.Item>
          <Form.Item label="Utilities Budget" name="Utilities">
            <Input type="number" placeholder="Enter Utilities budget" min={0} />
          </Form.Item>
          <Form.Item label="Others Budget" name="Others">
            <Input type="number" placeholder="Enter Others budget" min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={budgetLoading} block>
              Save Budgets
            </Button>
          </Form.Item>
        </Form>
      </Modal>

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
              onClick={(data) => handleCategoryClick(data)}
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
        {selectedDate && groupedFilteredExpenses[selectedDate] && (
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
            {groupedFilteredExpenses[selectedDate].map((expense) => (
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
            <ReactDatePicker
              selected={form.getFieldValue('date') ? form.getFieldValue('date').toDate() : null}
              onChange={date => form.setFieldsValue({ date: date ? moment(date) : null })}
              dateFormat="yyyy-MM-dd"
              className="ant-input"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
        title={`Expenses for ${selectedCategory}`}
        visible={isCategoryModalVisible}
        onCancel={handleCategoryModalClose}
        footer={null}
        width={600}
        className="category-modal"
      >
        <div style={{ marginBottom: "16px" }}>
          <ReactDatePicker
            selected={selectedMonth.toDate()}
            onChange={(date) => setSelectedMonth(moment(date))}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            className="ant-input"
          />
        </div>
        <Table
          dataSource={filteredCategoryExpenses}
          columns={[
            { title: 'Title', dataIndex: 'title', key: 'title' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount) => `₹${parseFloat(amount).toFixed(2)}` },
            { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => moment(date).format('DD MMMM, YYYY'), sorter: (a, b) => new Date(a.date) - new Date(b.date), defaultSortOrder: 'descend' },
          ]}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      <Modal
        open={showCopyPrevModal}
        onCancel={handleDismissCopyModal}
        onOk={handleCopyPrevBudget}
        okText="Copy Previous Month's Budget"
        cancelText="No, I'll Set Manually"
        title="No Budget Set for This Month"
        closable={false}
        maskClosable={false}
        keyboard={false}
      >
        <div>
          Do you want to copy the previous month's budget?
        </div>
      </Modal>

      <style>{`
        .dashboard-month-picker {
          border: none !important;
          border-radius: 20px !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          padding: 6px 16px;
          font-size: 1rem;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

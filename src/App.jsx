import { useState } from 'react';
import { Layout, Menu, Row, Col } from 'antd';
import './index.css';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Dashboard from './components/Dashboard';

const { Header, Content } = Layout;

function App() {
  const [currentPage, setCurrentPage] = useState('expenses');
  const [expenses, setExpenses] = useState([]);

  const handleAddExpense = (newExpense) => {
    setExpenses([...expenses, newExpense]);
  };

  const menuItems = [
    { key: 'expenses', label: 'Expenses' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <Layout className="layout">
      <Header>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[currentPage]}
          onSelect={({ key }) => setCurrentPage(key)}
          items={menuItems}
        />
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12}>
            {currentPage === 'expenses' && (
              <>
                <ExpenseForm onAddExpense={handleAddExpense} />
                <ExpenseList expenses={expenses} />
              </>
            )}
            {currentPage === 'dashboard' && <Dashboard />}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App; 
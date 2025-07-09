import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../firebase';
import { Card, Button, Collapse, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryOutlined } from '@ant-design/icons';

function MonthHistory() {
  const [monthlyExpenses, setMonthlyExpenses] = useState({});
  const [expandedMonths, setExpandedMonths] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const expensesRef = ref(db, `expenses/${user.uid}`);
    onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMonthlyExpenses({});
        return;
      }
      const monthMap = {};
      Object.keys(data).forEach(date => {
        Object.keys(data[date]).forEach(expenseId => {
          const expense = data[date][expenseId];
          const month = moment(date, 'YYYY-MM-DD').format('YYYY-MM');
          if (!monthMap[month]) monthMap[month] = [];
          monthMap[month].push({ ...expense, id: expenseId, date });
        });
      });
      setMonthlyExpenses(monthMap);
    });
  }, [user]);

  // Prepare data for the bar chart
  const chartData = Object.keys(monthlyExpenses).map(month => ({
    month: moment(month, 'YYYY-MM').format('MMM YYYY'),
    total: monthlyExpenses[month].reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
  })).sort((a, b) => moment(a.month, 'MMM YYYY') - moment(b.month, 'MMM YYYY'));

  // Handle expand/collapse
  const toggleExpand = (month) => {
    setExpandedMonths(prev => prev.includes(month)
      ? prev.filter(m => m !== month)
      : [...prev, month]
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }} className="glass fade-in">
      <style>{`
        @media (max-width: 600px) {
          .mh-card-row-header, .mh-card-row {
            display: block !important;
          }
          .mh-card-row-header > div, .mh-card-row > div {
            width: 100% !important;
            text-align: left !important;
            margin-bottom: 4px;
          }
          .mh-card-row-header {
            display: none !important;
          }
          .mh-card-row {
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 10px;
            padding-bottom: 8px;
          }
        }
        @media (max-width: 900px) {
          .mh-bar-chart-container {
            min-width: 0 !important;
            width: 100vw !important;
            overflow-x: auto;
          }
        }
      `}</style>
      <h1 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><HistoryOutlined style={{ color: '#6c63ff', fontSize: 32 }} />Month History</h1>
      <div style={{ marginBottom: 32 }}>
        <h3>Monthly Expenses Overview</h3>
        {chartData.length > 0 ? (
          <div className="mh-bar-chart-container" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#1890ff" name="Total Spent" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Empty description="No data" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.keys(monthlyExpenses).sort((a, b) => moment(b, 'YYYY-MM') - moment(a, 'YYYY-MM')).map(month => {
          const expenses = monthlyExpenses[month];
          const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
          const isExpanded = expandedMonths.includes(month);
          return (
            <Card
              key={month}
              title={<span style={{ fontWeight: 600 }}>{moment(month, 'YYYY-MM').format('MMMM YYYY')}</span>}
              extra={
                <Button
                  onClick={() => toggleExpand(month)}
                  style={isExpanded
                    ? { background: '#1890ff', color: '#fff', border: 'none' }
                    : { background: '#fff', color: '#1890ff', border: '1px solid #1890ff' }
                  }
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Button>
              }
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 10 }}
            >
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Total: ₹{total.toFixed(2)}</div>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {expenses.length > 0 ? (
                      <div>
                        <div className="mh-card-row-header" style={{
                          display: 'flex',
                          fontWeight: 600,
                          color: '#888',
                          borderBottom: '2px solid #e0e0e0',
                          padding: '6px 0',
                          marginBottom: 4,
                        }}>
                          <div style={{ flex: 2 }}>Title</div>
                          <div style={{ flex: 1, textAlign: 'right' }}>Amount</div>
                          <div style={{ flex: 1.5, textAlign: 'center' }}>Date</div>
                          <div style={{ flex: 1, textAlign: 'center' }}>Category</div>
                        </div>
                        <AnimatePresence>
                          {expenses.map((exp, idx) => (
                            <motion.div
                              key={exp.id}
                              className="mh-card-row"
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 30 }}
                              transition={{ delay: idx * 0.04, duration: 0.3 }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 0',
                                borderBottom: '1px solid #f0f0f0',
                              }}
                            >
                              <div style={{ flex: 2 }}>{exp.title}</div>
                              <div style={{ flex: 1, textAlign: 'right', color: '#1890ff', fontWeight: 600 }}>₹{parseFloat(exp.amount).toFixed(2)}</div>
                              <div style={{ flex: 1.5, textAlign: 'center', color: '#888', fontSize: 13 }}>{moment(exp.date, 'YYYY-MM-DD').format('DD MMM, YYYY')}</div>
                              <div style={{ flex: 1, textAlign: 'center', color: '#888', fontSize: 13 }}>{exp.category}</div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : <Empty description="No expenses" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default MonthHistory; 
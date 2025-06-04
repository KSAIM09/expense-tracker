import { motion } from 'framer-motion';
import { Popconfirm, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

function ExpenseItem({ expense, onDeleteExpense }) {
  return (
    <div
      style={{
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f7f7f7',
        borderRadius: '6px',
        padding: '10px 14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}
    >
      <div>
        <div style={{ fontWeight: 500 }}>{expense.title}</div>
        <div style={{ color: '#1890ff', fontWeight: 600 }}>₹{expense.amount}</div>
      </div>
      <Popconfirm
        title="Delete this expense?"
        onConfirm={() => onDeleteExpense(expense.id)}
        okText="Yes"
        cancelText="No"
        placement="top"
        overlayStyle={{ maxWidth: '200px', wordWrap: 'break-word', textAlign: 'center' }}
        okButtonProps={{ style: { width: '80px', marginRight: '8px', color: "white" } }}
        cancelButtonProps={{ style: { width: '80px', color: "white" } }}
      >
        <Button
          type="text"
          icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />}
          style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            marginLeft: 8,
          }}
        />
      </Popconfirm>
    </div>
  );
}

export default ExpenseItem; 
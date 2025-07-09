import React from 'react';
import { Card, Row, Col, Typography, Divider, Button, Select, Spin, Input, Empty, Tooltip, List, Tag } from 'antd';
import { BarChartOutlined, RiseOutlined, FundOutlined, BulbOutlined, RobotOutlined, ArrowUpOutlined, ArrowDownOutlined, UserOutlined, InfoCircleOutlined, FireOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const sectionCardStyle = {
  borderRadius: 16,
  boxShadow: '0 2px 12px rgba(24,144,255,0.06)',
  background: '#fafdff',
  marginBottom: 24,
};

const FINNHUB_PROXY = 'https://expense-tracker-iota-opal-51.vercel.app/api/finnhub';
const GEMINI_API_URL = 'https://expense-tracker-iota-opal-51.vercel.app/api/gemini';

// List of popular Indian stocks for gainers/losers (limited for demo/rate limits)
const INDIAN_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'BHARTIARTL.NS', name: 'Airtel' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'LT.NS', name: 'L&T' },
  { symbol: 'HINDUNILVR.NS', name: 'HUL' },
];

// List of popular Indian ETFs
const INDIAN_ETFS = [
  { symbol: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty BeES' },
  { symbol: 'BANKBEES.NS', name: 'Nippon India ETF Bank BeES' },
  { symbol: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES' },
  { symbol: 'ICICINIFTY.NS', name: 'ICICI Prudential Nifty ETF' },
];

function InvestmentInsights() {
  // Risk profile selection
  const [riskProfile, setRiskProfile] = React.useState('Beginner');
  // AI UI state
  const [aiPrompt, setAiPrompt] = React.useState('Give me a monthly financial summary and advice based on my expenses and risk profile.');
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState('');
  // Custom Suggestions state
  const [suggestionLoading, setSuggestionLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState('');

  // Fetch custom suggestions from Gemini on risk profile change
  React.useEffect(() => {
    async function fetchSuggestion() {
      setSuggestionLoading(true);
      setSuggestion('');
      try {
        const prompt = `Suggest 3 investment options for an Indian user with a ${riskProfile} risk profile. Keep it simple and relevant to Indian investors.`;
        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        setSuggestion(data.result || data.error || 'No response');
      } catch (err) {
        setSuggestion('Error: ' + err.message);
      }
      setSuggestionLoading(false);
    }
    fetchSuggestion();
  }, [riskProfile]);

  const handleGetAIAdvice = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${aiPrompt}\nRisk profile: ${riskProfile}` }),
      });
      const data = await response.json();
      setAiResult(data.result || data.error || 'No response');
    } catch (err) {
      setAiResult('Error: ' + err.message);
    }
    setAiLoading(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 8px', minHeight: '100vh' }} className="glass fade-in">
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <BarChartOutlined style={{ color: '#1890ff', fontSize: 36 }} />
        Investment & Market Insights
      </Title>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <span style={{ fontWeight: 500, marginRight: 12 }}>Risk Profile:</span>
        <Select
          value={riskProfile}
          onChange={setRiskProfile}
          style={{ minWidth: 180 }}
          options={[
            { value: 'Beginner', label: 'Beginner' },
            { value: 'Intermediate', label: 'Intermediate' },
            { value: 'Risk-Tolerant', label: 'Risk-Tolerant' },
          ]}
        />
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={<span><RiseOutlined style={{ color: '#52c41a', fontSize: 22 }} /> Market Trends</span>}
            bordered={false}
            style={{ ...sectionCardStyle, background: 'var(--glass-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 'var(--card-radius)' }}
            headStyle={{ fontWeight: 700, fontSize: 18 }}
            className="glass fade-in"
          >
            <MarketTrends />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><FundOutlined style={{ color: '#faad14', fontSize: 22 }} /> Top Gainers / Losers</span>}
            bordered={false}
            style={{ ...sectionCardStyle, background: 'var(--glass-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 'var(--card-radius)' }}
            headStyle={{ fontWeight: 700, fontSize: 18 }}
            className="glass fade-in"
          >
            <TopGainersLosers />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><BulbOutlined style={{ color: '#1890ff', fontSize: 22 }} /> Investment Opportunities</span>}
            bordered={false}
            style={{ ...sectionCardStyle, background: 'var(--glass-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 'var(--card-radius)' }}
            headStyle={{ fontWeight: 700, fontSize: 18 }}
            className="glass fade-in"
          >
            <InvestmentOpportunities />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<span><UserOutlined style={{ color: '#722ed1', fontSize: 22 }} /> Custom Suggestions</span>}
            bordered={false}
            style={{ ...sectionCardStyle, background: 'var(--glass-bg)', boxShadow: 'var(--card-shadow)', borderRadius: 'var(--card-radius)' }}
            headStyle={{ fontWeight: 700, fontSize: 18 }}
            className="glass fade-in"
          >
            {suggestionLoading ? <Spin /> : (
              <div style={{ color: '#444', fontSize: 16, whiteSpace: 'pre-line', minHeight: 60 }}>{suggestion}</div>
            )}
          </Card>
        </Col>
      </Row>
      <Divider style={{ margin: '40px 0 24px 0' }} />
      <Card
        title={<span><RobotOutlined style={{ color: '#fa541c', fontSize: 22 }} /> AI Insights</span>}
        bordered={false}
        style={{ ...sectionCardStyle, background: 'var(--glass-bg)', marginTop: 16, boxShadow: 'var(--card-shadow)', borderRadius: 'var(--card-radius)' }}
        headStyle={{ fontWeight: 700, fontSize: 18 }}
        className="glass fade-in"
      >
        <div style={{ marginBottom: 16 }}>
          <Input.TextArea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={3}
            placeholder="Ask the AI about your finances..."
            style={{ marginBottom: 8, borderRadius: 8, fontSize: 16 }}
          />
          <Button type="primary" onClick={handleGetAIAdvice} loading={aiLoading} disabled={!aiPrompt.trim()} style={{ borderRadius: 8, fontWeight: 600 }}>
            Get AI Financial Advice
          </Button>
        </div>
        {aiLoading && <Spin />}
        {aiResult && (
          <div style={{
            marginTop: 16,
            background: '#fffbe6',
            borderRadius: 16,
            padding: 20,
            minHeight: 60,
            boxShadow: '0 2px 8px rgba(250, 84, 28, 0.08)',
            border: '1px solid #ffe58f',
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: 17,
            color: '#ad6800',
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: -12, top: 18, fontSize: 28, color: '#faad14' }}>💬</span>
            {aiResult}
          </div>
        )}
        {!aiLoading && !aiResult && (
          <Text type="secondary">AI-powered financial advice and monthly analysis will be shown here.</Text>
        )}
      </Card>
    </div>
  );
}

function MarketTrends() {
  const [prices, setPrices] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // List of stocks to show (symbol: display name)
  const stocks = [
    { symbol: 'NSEI', name: 'Nifty 50' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    // Add more stocks here
  ];

  React.useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          stocks.map(async (stock) => {
            const url = `${FINNHUB_PROXY}?symbol=${stock.symbol}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            return { symbol: stock.symbol, name: stock.name, price: data.c, change: data.d, percent: data.dp };
          })
        );
        const priceMap = {};
        results.forEach((item) => { priceMap[item.symbol] = item; });
        setPrices(priceMap);
      } catch (err) {
        setError('Failed to fetch market data.');
      }
      setLoading(false);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spin />;
  if (error) return <Text type="danger">{error}</Text>;

  return (
    <div>
      {stocks.map(stock => {
        const price = prices[stock.symbol]?.price;
        const change = prices[stock.symbol]?.change;
        const percent = prices[stock.symbol]?.percent;
        const isUp = change > 0;
        const isDown = change < 0;
        return (
          <div key={stock.symbol} style={{
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f0f5ff',
            borderRadius: 10,
            padding: '10px 18px',
            boxShadow: '0 1px 4px rgba(24,144,255,0.04)',
            border: '1px solid #adc6ff',
          }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{stock.name}</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: isUp ? '#52c41a' : isDown ? '#ff4d4f' : '#888' }}>
              ₹{price?.toFixed(2) || '--'}
              {change !== undefined && (
                <Tooltip title={isUp ? 'Up' : isDown ? 'Down' : 'No change'}>
                  {isUp && <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: 8 }} />} 
                  {isDown && <ArrowDownOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />} 
                </Tooltip>
              )}
              {change !== undefined && (
                <span style={{ marginLeft: 8, fontSize: 14, color: isUp ? '#52c41a' : isDown ? '#ff4d4f' : '#888' }}>
                  ({change > 0 ? '+' : ''}{change?.toFixed(2)}, {percent > 0 ? '+' : ''}{percent?.toFixed(2)}%)
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopGainersLosers() {
  const [data, setData] = React.useState({ gainers: [], losers: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function fetchGainersLosers() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          INDIAN_STOCKS.map(async (stock) => {
            const url = `${FINNHUB_PROXY}?symbol=${stock.symbol}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API error');
            const d = await res.json();
            return { ...stock, price: d.c, change: d.d, percent: d.dp };
          })
        );
        const sorted = results.filter(s => typeof s.percent === 'number').sort((a, b) => b.percent - a.percent);
        setData({
          gainers: sorted.slice(0, 3),
          losers: sorted.slice(-3).reverse(),
        });
      } catch (err) {
        setError('Failed to fetch gainers/losers.');
      }
      setLoading(false);
    }
    fetchGainersLosers();
    const interval = setInterval(fetchGainersLosers, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spin />;
  if (error) return <Text type="danger">{error}</Text>;

  return (
    <Row gutter={12}>
      <Col span={12}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#52c41a' }}><ArrowUpOutlined /> Gainers</div>
        <List
          size="small"
          dataSource={data.gainers}
          renderItem={item => (
            <List.Item style={{ padding: '6px 0' }}>
              <span>{item.name}</span>
              <Tag color="green">+{item.percent?.toFixed(2)}%</Tag>
            </List.Item>
          )}
        />
      </Col>
      <Col span={12}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#ff4d4f' }}><ArrowDownOutlined /> Losers</div>
        <List
          size="small"
          dataSource={data.losers}
          renderItem={item => (
            <List.Item style={{ padding: '6px 0' }}>
              <span>{item.name}</span>
              <Tag color="red">{item.percent?.toFixed(2)}%</Tag>
            </List.Item>
          )}
        />
      </Col>
    </Row>
  );
}

function InvestmentOpportunities() {
  const [etfs, setEtfs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function fetchEtfs() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          INDIAN_ETFS.map(async (etf) => {
            const url = `${FINNHUB_PROXY}?symbol=${etf.symbol}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('API error');
            const d = await res.json();
            return { ...etf, price: d.c, change: d.d, percent: d.dp };
          })
        );
        setEtfs(results);
      } catch (err) {
        setError('Failed to fetch ETF data.');
      }
      setLoading(false);
    }
    fetchEtfs();
    const interval = setInterval(fetchEtfs, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spin />;
  if (error) return <Text type="danger">{error}</Text>;

  return (
    <List
      size="small"
      dataSource={etfs}
      renderItem={item => {
        const isUp = item.change > 0;
        const isDown = item.change < 0;
        return (
          <List.Item style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontWeight: 700, color: isUp ? '#52c41a' : isDown ? '#ff4d4f' : '#888' }}>
              ₹{item.price?.toFixed(2) || '--'}
              {item.change !== undefined && (
                <span style={{ marginLeft: 8, fontSize: 13 }}>
                  ({item.change > 0 ? '+' : ''}{item.change?.toFixed(2)}, {item.percent > 0 ? '+' : ''}{item.percent?.toFixed(2)}%)
                </span>
              )}
            </span>
          </List.Item>
        );
      }}
    />
  );
}

export default InvestmentInsights; 
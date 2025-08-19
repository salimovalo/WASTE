import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Row, Col, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { login, error, clearError } = useAuthStore();

  const onFinish = async (values) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await login(values);
      
      if (result.success) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login xatoligi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={22} sm={18} md={12} lg={8} xl={6}>
          <Card className="login-card">
            <div className="login-header">
              <Title level={2} className="login-title">
                Chiqindilarni Boshqarish Tizimi
              </Title>
              <Text type="secondary" className="login-subtitle">
                Tizimga kirish uchun ma'lumotlaringizni kiriting
              </Text>
            </div>

            {error && (
              <Alert
                message="Xatolik"
                description={error}
                type="error"
                showIcon
                closable
                onClose={clearError}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label="Foydalanuvchi nomi"
                rules={[
                  {
                    required: true,
                    message: 'Foydalanuvchi nomini kiriting!',
                  },
                  {
                    min: 3,
                    message: 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak!',
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Foydalanuvchi nomi"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Parol"
                rules={[
                  {
                    required: true,
                    message: 'Parolni kiriting!',
                  },
                  {
                    min: 6,
                    message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak!',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Parol"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<LoginOutlined />}
                  className="login-button"
                >
                  {loading ? 'Kirilyapti...' : 'Kirish'}
                </Button>
              </Form.Item>
            </Form>

            <div className="login-footer">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                  Tizimga kirish uchun administrator bilan bog'laning
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
                  © 2024 Chiqindilarni Boshqarish Tizimi
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;

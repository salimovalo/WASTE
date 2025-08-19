import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Breadcrumb, Dropdown, Avatar, Badge, Spin } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CarOutlined,
  StarOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  DownOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  ShopOutlined,
  ExclamationCircleOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import CompanySelector from './CompanySelector';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;

// Menu items configuration
const getMenuItems = (user) => {
  const items = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Bosh sahifa',
    }
  ];

  // Super Admin modullar
  if (user?.role?.name === 'super_admin') {
    items.push({
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Tizim boshqaruvi',
      children: [
        {
          key: '/admin/companies',
          icon: <BankOutlined />,
          label: 'Korxonalar',
        },
        {
          key: '/admin/districts',
          icon: <EnvironmentOutlined />,
          label: 'Tumanlar',
        },
        {
          key: '/admin/neighborhoods',
          icon: <EnvironmentOutlined />,
          label: 'Maxallalar',
        },
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: 'Foydalanuvchilar',
        }
      ]
    });
  }

  // Asosiy modullar - eski permission system (hozircha)
  if (user?.role?.permissions?.view_physical_persons) {
    items.push({
      key: '/physical-persons',
      icon: <TeamOutlined />,
      label: 'Jismoniy shaxslar',
    });
  }

  if (user?.role?.permissions?.view_legal_entities) {
    items.push({
      key: '/legal-entities',
      icon: <BankOutlined />,
      label: 'Yuridik shaxslar',
    });
  }

  if (hasPermission(user, PERMISSIONS.VIEW_VEHICLES)) {
    items.push({
      key: 'vehicles',
      icon: <CarOutlined />,
      label: 'Texnikalar',
      children: [
        {
          key: '/vehicles/dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
        {
          key: '/vehicles/list',
          icon: <CarOutlined />,
          label: 'Texnikalar ro\'yxati',
        },
        {
          key: '/vehicles/daily-work-status',
          icon: <CalendarOutlined />,
          label: 'Kunlik ma\'lumot',
        },
        {
          key: '/vehicles/fuel',
          icon: <ThunderboltOutlined />,
          label: 'Yoqilg\'i',
        },
        {
          key: '/vehicles/report-206',
          icon: <BarChartOutlined />,
          label: '206 xisoboti',
        },
        {
          key: '/vehicles/data-entry',
          icon: <DatabaseOutlined />,
          label: 'Ma\'lumotlar kiritish',
        },
        {
          key: '/vehicles/historical',
          icon: <HistoryOutlined />,
          label: 'Tarixiy ma\'lumotlar',
        }
      ]
    });
  }

  if (user?.role?.permissions?.view_service_quality) {
    items.push({
      key: '/service-quality',
      icon: <StarOutlined />,
      label: 'Xizmat sifati',
    });
  }

  if (user?.role?.permissions?.view_employees) {
    items.push({
      key: '/employees',
      icon: <UsergroupAddOutlined />,
      label: 'Xodimlar',
    });
  }

  if (user?.role?.permissions?.view_fuel_stations) {
    items.push({
      key: '/fuel-stations',
      icon: <ShopOutlined />,
      label: 'Zapravkalar',
    });
  }

  if (user?.role?.permissions?.view_reports) {
    items.push({
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Xisobotlar',
    });
  }

  items.push({
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Sozlamalar',
  });

  return items;
};

// Breadcrumb ma'lumotlari
const breadcrumbNameMap = {
  '/': 'Bosh sahifa',
  '/dashboard': 'Bosh sahifa',
  '/admin': 'Tizim boshqaruvi',
  '/admin/companies': 'Korxonalar',
  '/admin/districts': 'Tumanlar',
  '/admin/neighborhoods': 'Maxallalar',
  '/admin/users': 'Foydalanuvchilar',
  '/physical-persons': 'Jismoniy shaxslar',
  '/legal-entities': 'Yuridik shaxslar',
  '/vehicles': 'Texnikalar',
  '/vehicles/dashboard': 'Dashboard',
  '/vehicles/list': 'Texnikalar ro\'yxati',
  '/vehicles/daily-work-status': 'Kunlik ma\'lumot',
  '/vehicles/fuel': 'Yoqilg\'i',
  '/vehicles/report-206': '206 xisoboti',
  '/vehicles/data-entry': 'Ma\'lumotlar kiritish',
  '/vehicles/historical': 'Tarixiy ma\'lumotlar',
  '/service-quality': 'Xizmat sifati',
  '/employees': 'Xodimlar',
  '/fuel-stations': 'Zapravkalar',
  '/reports': 'Xisobotlar',
  '/settings': 'Sozlamalar',
};

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openKeys, setOpenKeys] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, logout, hasPermission, checkAuth } = useAuthStore();

  // Sahifa yuklanishida autentifikatsiyani tekshirish
  useEffect(() => {
    const initAuth = async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        navigate('/login');
      }
      setLoading(false);
    };

    initAuth();
  }, [checkAuth, navigate]);

  // Sahifa o'zgarganda openKeys ni yangilash
  useEffect(() => {
    const path = location.pathname;
    const newOpenKeys = [];
    if (path.startsWith('/admin/')) newOpenKeys.push('admin');
    if (path.startsWith('/vehicles/')) newOpenKeys.push('vehicles');
    setOpenKeys(newOpenKeys);
  }, [location.pathname]);

  // Menu bosilganda
  const handleMenuClick = ({ key }) => {
    // Faqat to'g'ri route'larga navigate qilish
    if (key.startsWith('/')) {
      navigate(key);
    }
    // Submenu kalitlari (admin, vehicles) uchun navigate qilmaslik
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User dropdown menu
  const userMenu = (
    <Menu
      items={[
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profil',
          onClick: () => navigate('/profile'),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'Sozlamalar',
          onClick: () => navigate('/settings'),
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Chiqish',
          onClick: handleLogout,
        },
      ]}
    />
  );

  // Breadcrumb yaratish
  const pathSnippets = location.pathname.split('/').filter(i => i);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    return {
      key: url,
      title: breadcrumbNameMap[url] || 'Noma\'lum sahifa',
    };
  });

  const breadcrumbItems = [
    {
      key: '/',
      title: 'Bosh sahifa',
    },
    ...extraBreadcrumbItems,
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = getMenuItems(user);

  // Open keys va selected keys ni aniqlash
  const getSelectedKeys = () => {
    const path = location.pathname;
    return [path];
  };

  // Submenu ochish/yopish
  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
        width={250}
      >
        <div className="logo">
          <div className="logo-text">
            {collapsed ? 'CBT' : 'Chiqindi Boshqaruv Tizimi'}
          </div>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <AntLayout className="site-layout">
        <Header className="site-layout-header">
          <div className="header-left">
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
              }
            )}
            
            <CompanySelector />
          </div>
          
          <div className="header-right">
            {/* Bildirishnomalar */}
            <Badge count={0} showZero={false}>
              <BellOutlined className="header-icon" />
            </Badge>
            
            {/* Foydalanuvchi ma'lumotlari */}
            <Dropdown 
              overlay={userMenu} 
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="user-info">
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />} 
                  style={{ marginRight: 8 }}
                />
                <span className="user-name">
                  {user.first_name} {user.last_name}
                </span>
                <DownOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="site-layout-content">
          <div className="breadcrumb-container">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          
          <div className="content-container">
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

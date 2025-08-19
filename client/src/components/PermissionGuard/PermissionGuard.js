import React, { useState, useEffect } from 'react';
import { Modal, Button, Result, message } from 'antd';
import { LockOutlined, HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './PermissionGuard.css';

const PermissionGuard = ({ 
  children, 
  permission, 
  requiredRole = null,
  fallbackPath = '/'
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuthStore();

  useEffect(() => {
    // Permission tekshirish
    let hasAccess = false;

    if (requiredRole) {
      // Agar aniq rol talab qilinsa
      if (requiredRole === 'super_admin') {
        hasAccess = user?.role?.name === 'super_admin';
      } else {
        hasAccess = user?.role?.name === requiredRole;
      }
    } else if (permission) {
      // Agar permission talab qilinsa
      hasAccess = hasPermission(permission);
    } else {
      // Agar hech narsa talab qilinmasa, ruxsat bor
      hasAccess = true;
    }

    if (!hasAccess) {
      setShowModal(true);
      // Toast notification ham ko'rsatish
      message.error({
        content: 'Bu sahifaga kirish uchun sizda ruxsat yo\'q',
        duration: 4,
        style: { marginTop: '20vh' }
      });
    }
  }, [user, permission, requiredRole, hasPermission]);

  const handleModalOk = () => {
    setShowModal(false);
    navigate(fallbackPath, { replace: true });
  };

  const handleModalCancel = () => {
    setShowModal(false);
    navigate(-1); // Orqaga qaytish
  };

  // Agar ruxsat bo'lsa, sahifani ko'rsatish
  const hasAccess = requiredRole 
    ? (requiredRole === 'super_admin' ? user?.role?.name === 'super_admin' : user?.role?.name === requiredRole)
    : permission 
      ? hasPermission(permission)
      : true;

  if (hasAccess) {
    return children;
  }

  return (
    <>
      {/* Ruxsat yo'q bo'lganda ko'rsatiladigan modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LockOutlined style={{ color: 'white' }} />
            Kirish taqiqlangan
          </div>
        }
        open={showModal}
        footer={[
          <Button 
            key="back" 
            icon={<ArrowLeftOutlined />}
            onClick={handleModalCancel}
          >
            Orqaga qaytish
          </Button>,
          <Button 
            key="home" 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={handleModalOk}
          >
            Bosh sahifaga o'tish
          </Button>
        ]}
        centered
        width={520}
        maskClosable={false}
        className="permission-guard-modal"
      >
        <Result
          icon={<LockOutlined style={{ color: '#ff4d4f', fontSize: '48px' }} />}
          title="Bu sahifaga kirish uchun sizda ruxsat yo'q"
          subTitle="Quyida sahifa va ruxsat haqida batafsil ma'lumot keltirilgan"
        />
        
        <div className="permission-details">
          <div className="permission-details-title">📋 Sahifa ma'lumotlari:</div>
          
          <div className="permission-details-item">
            <span className="permission-details-label">📍 Sahifa:</span>
            <span className="permission-details-value">{location.pathname}</span>
          </div>
          
          {permission && (
            <div className="permission-details-item">
              <span className="permission-details-label">🔑 Kerakli ruxsat:</span>
              <span className="permission-details-value">{permission}</span>
            </div>
          )}
          
          {requiredRole && (
            <div className="permission-details-item">
              <span className="permission-details-label">👤 Kerakli rol:</span>
              <span className="permission-details-value">{requiredRole}</span>
            </div>
          )}
          
          <div className="permission-details-item">
            <span className="permission-details-label">🎭 Sizning rolingiz:</span>
            <span className="permission-details-value">
              {user?.role?.display_name || user?.role?.name || 'Aniqlanmagan'}
            </span>
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#fff2e8', 
            borderRadius: '4px',
            borderLeft: '4px solid #fa8c16'
          }}>
            💡 <strong>Maslahat:</strong> Agar sizga bu sahifaga kirish kerak bo'lsa, 
            administrator bilan bog'laning va kerakli ruxsatlarni so'rang.
          </div>
        </div>
      </Modal>

      {/* Loading holatida bo'sh sahifa */}
      <div className="permission-guard-loading">
        <LockOutlined style={{ fontSize: '48px', color: '#ccc' }} />
        <div style={{ color: '#999', fontSize: '16px' }}>🔒 Ruxsat tekshirilmoqda...</div>
        <div style={{ color: '#bbb', fontSize: '14px' }}>
          Iltimos kuting, sizning huquqlaringiz tekshirilmoqda
        </div>
      </div>
    </>
  );
};

export default PermissionGuard;

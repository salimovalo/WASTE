import React, { useEffect } from 'react';
import { Select, message } from 'antd';
import { BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { companiesAPI, districtsAPI } from '../../services/api';
import { create } from 'zustand';

const { Option } = Select;

// Company/District selector uchun store
const useCompanySelectorStore = create((set, get) => ({
  selectedCompany: null,
  selectedDistrict: null,
  companies: [],
  districts: [],
  loading: false,
  
  setSelectedCompany: (company) => {
    set({ selectedCompany: company, selectedDistrict: null });
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    localStorage.removeItem('selectedDistrict');
  },
  
  setSelectedDistrict: (district) => {
    set({ selectedDistrict: district });
    localStorage.setItem('selectedDistrict', JSON.stringify(district));
  },
  
  setCompanies: (companies) => set({ companies }),
  setDistricts: (districts) => set({ districts }),
  setLoading: (loading) => set({ loading }),
  
  // Local storage dan ma'lumotlarni tiklash
  restoreFromStorage: () => {
    try {
      const savedCompany = localStorage.getItem('selectedCompany');
      const savedDistrict = localStorage.getItem('selectedDistrict');
      
      if (savedCompany) {
        set({ selectedCompany: JSON.parse(savedCompany) });
      }
      
      if (savedDistrict) {
        set({ selectedDistrict: JSON.parse(savedDistrict) });
      }
    } catch (error) {
      console.error('Storage dan ma\'lumotlarni tiklashda xatolik:', error);
    }
  }
}));

const CompanySelector = () => {
  const { user } = useAuthStore();
  const {
    selectedCompany,
    selectedDistrict,
    companies,
    districts,
    loading,
    setSelectedCompany,
    setSelectedDistrict,
    setCompanies,
    setDistricts,
    setLoading,
    restoreFromStorage
  } = useCompanySelectorStore();

  // Komponent yuklanishida ma'lumotlarni tiklash
  useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  // Korxonalarni yuklash
  useEffect(() => {
    const loadCompanies = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Super admin bo'lsa barcha korxonalarni ko'radi
        // Boshqalar faqat o'z korxonasini ko'radi
        if (user.role?.name === 'super_admin') {
          const response = await companiesAPI.getAll({ limit: 100 });
          setCompanies(response.data.companies);
          
          // Agar avval tanlangan korxona bo'lmasa, birinchisini tanlash
          if (!selectedCompany && response.data.companies.length > 0) {
            setSelectedCompany(response.data.companies[0]);
          }
        } else if (user.company) {
          // Foydalanuvchining o'z korxonasi
          setCompanies([user.company]);
          if (!selectedCompany) {
            setSelectedCompany(user.company);
          }
        }
      } catch (error) {
        console.error('Korxonalarni yuklashda xatolik:', error);
        message.error('Korxonalar ma\'lumotini yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [user, setLoading, setCompanies, selectedCompany, setSelectedCompany]);

  // Tumanlarni yuklash
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedCompany) return;
      
      try {
        const response = await districtsAPI.getAll({ 
          company_id: selectedCompany.id,
          limit: 100 
        });
        setDistricts(response.data.districts);
        
        // Agar avval tanlangan tuman bo'lmasa yoki u boshqa korxonaga tegishli bo'lsa
        if (selectedDistrict) {
          const isDistrictValid = response.data.districts.some(d => d.id === selectedDistrict.id);
          if (!isDistrictValid) {
            setSelectedDistrict(null);
          }
        }
      } catch (error) {
        console.error('Tumanlarni yuklashda xatolik:', error);
        message.error('Tumanlar ma\'lumotini yuklashda xatolik');
      }
    };

    loadDistricts();
  }, [selectedCompany, setDistricts, selectedDistrict, setSelectedDistrict]);

  // Korxona o'zgarganda
  const handleCompanyChange = (value) => {
    const company = companies.find(c => c.id === value);
    if (company) {
      setSelectedCompany(company);
    }
  };

  // Tuman o'zgarganda
  const handleDistrictChange = (value) => {
    if (value === null) {
      setSelectedDistrict(null);
      return;
    }
    
    const district = districts.find(d => d.id === value);
    if (district) {
      setSelectedDistrict(district);
    }
  };

  // Foydalanuvchi faqat o'zi ruxsat etilgan tumanlarni ko'rishi kerak
  const filteredDistricts = districts.filter(district => {
    if (user.role?.name === 'super_admin') return true;
    return user.district_access?.includes(district.id);
  });

  if (!user || companies.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {/* Korxona tanlash */}
      <Select
        value={selectedCompany?.id}
        onChange={handleCompanyChange}
        loading={loading}
        style={{ minWidth: 200 }}
        placeholder="Korxonani tanlang"
        suffixIcon={<BankOutlined />}
        disabled={companies.length === 1 && user.role?.name !== 'super_admin'}
      >
        {companies.map(company => (
          <Option key={company.id} value={company.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BankOutlined style={{ color: '#1890ff' }} />
              <span>{company.name}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>({company.code})</span>
            </div>
          </Option>
        ))}
      </Select>

      {/* Tuman tanlash (ixtiyoriy) */}
      {filteredDistricts.length > 0 && (
        <Select
          value={selectedDistrict?.id || null}
          onChange={handleDistrictChange}
          style={{ minWidth: 180 }}
          placeholder="Tumanni tanlang"
          suffixIcon={<EnvironmentOutlined />}
          allowClear
        >
          {filteredDistricts.map(district => (
            <Option key={district.id} value={district.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                <span>{district.name}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>({district.code})</span>
              </div>
            </Option>
          ))}
        </Select>
      )}
    </div>
  );
};

// Hook to get selected company and district in other components
export const useSelectedCompany = () => {
  const { selectedCompany, selectedDistrict } = useCompanySelectorStore();
  return { selectedCompany, selectedDistrict };
};

export default CompanySelector;

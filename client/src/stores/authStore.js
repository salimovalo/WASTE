import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ loading: true, error: null });
        
        try {
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          
          // Token ni API headerga qo'shish
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Tizimga kirishda xatolik';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        // API headerdan tokenni o'chirish
        delete api.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null
        });
      },

      updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        
        try {
          const response = await api.put(`/users/${get().user.id}`, profileData);
          const updatedUser = response.data.user;
          
          set({
            user: updatedUser,
            loading: false,
            error: null
          });
          
          return { success: true, user: updatedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Profilni yangilashda xatolik';
          set({
            loading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (passwordData) => {
        set({ loading: true, error: null });
        
        try {
          await api.put('/auth/change-password', passwordData);
          
          set({
            loading: false,
            error: null
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Parolni o\'zgartirishda xatolik';
          set({
            loading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          return false;
        }
        
        try {
          // Token ni API headerga qo'shish
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/auth/verify');
          
          // Agar token yaroqli bo'lsa, foydalanuvchi ma'lumotlarini yangilash
          if (response.data.user) {
            const profileResponse = await api.get('/auth/profile');
            set({
              user: profileResponse.data.user,
              isAuthenticated: true
            });
          }
          
          return true;
        } catch (error) {
          // Token yaroqsiz bo'lsa, logout qilish
          get().logout();
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Ruxsatlarni tekshirish
      hasPermission: (permission) => {
        const user = get().user;
        if (!user || !user.role) return false;
        
        // Super admin barcha ruxsatlarga ega
        if (user.role.name === 'super_admin') return true;
        
        // Ruxsatlarni tekshirish
        return user.role.permissions?.[permission] === true;
      },

      // Tumanga ruxsat tekshirish
      hasDistrictAccess: (districtId) => {
        const user = get().user;
        if (!user) return false;
        
        // Super admin barcha tumanlarga kirishi mumkin
        if (user.role.name === 'super_admin') return true;
        
        // Tuman ruxsatlarini tekshirish
        return user.district_access?.includes(districtId) === true;
      },

      // Korxonaga ruxsat tekshirish
      hasCompanyAccess: (companyId) => {
        const user = get().user;
        if (!user) return false;
        
        // Super admin barcha korxonalarga kirishi mumkin
        if (user.role.name === 'super_admin') return true;
        
        // Foydalanuvchi o'z korxonasiga kirishi mumkin
        return user.company_id === companyId;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Performance indexes - critical for RBAC system

const { QueryInterface, Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🚀 Performance indexlar qo\'shilmoqda...');

      // User table indexes
      await queryInterface.addIndex('users', ['company_id'], {
        name: 'idx_users_company_id',
        where: {
          company_id: {
            [Sequelize.Op.ne]: null
          }
        }
      });

      await queryInterface.addIndex('users', ['role_id'], {
        name: 'idx_users_role_id'
      });

      // JSONB indexes for permissions and district access
      await queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_district_access 
        ON users USING gin(district_access);
      `);

      await queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_permissions 
        ON roles USING gin(permissions);
      `);

      // Vehicle table indexes
      await queryInterface.addIndex('vehicles', ['company_id'], {
        name: 'idx_vehicles_company_id'
      });

      await queryInterface.addIndex('vehicles', ['district_id'], {
        name: 'idx_vehicles_district_id'
      });

      await queryInterface.addIndex('vehicles', ['company_id', 'district_id'], {
        name: 'idx_vehicles_company_district'
      });

      await queryInterface.addIndex('vehicles', ['is_active'], {
        name: 'idx_vehicles_active'
      });

      // Daily work status indexes
      await queryInterface.addIndex('vehicle_work_statuses', ['date'], {
        name: 'idx_daily_work_date'
      });

      await queryInterface.addIndex('vehicle_work_statuses', ['date', 'vehicle_id'], {
        name: 'idx_daily_work_date_vehicle'
      });

      await queryInterface.addIndex('vehicle_work_statuses', ['status'], {
        name: 'idx_daily_work_status'
      });

      // Search optimization indexes
      await queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_search 
        ON vehicles (plate_number, brand, model);
      `);

      await queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search 
        ON companies (name, code);
      `);

      // District table indexes
      await queryInterface.addIndex('districts', ['company_id'], {
        name: 'idx_districts_company_id'
      });

      console.log('✅ Performance indexlar muvaffaqiyatli qo\'shildi');
    } catch (error) {
      console.error('❌ Index qo\'shishda xatolik:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🗑️ Performance indexlar o\'chirilmoqda...');

      // Remove all indexes
      const indexesToRemove = [
        'idx_users_company_id',
        'idx_users_role_id',
        'idx_users_district_access',
        'idx_roles_permissions',
        'idx_vehicles_company_id',
        'idx_vehicles_district_id',
        'idx_vehicles_company_district',
        'idx_vehicles_active',
        'idx_daily_work_date',
        'idx_daily_work_date_vehicle',
        'idx_daily_work_status',
        'idx_vehicles_search',
        'idx_companies_search',
        'idx_districts_company_id'
      ];

      for (const indexName of indexesToRemove) {
        try {
          await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${indexName};`);
          console.log(`✅ Index ${indexName} o'chirildi`);
        } catch (error) {
          console.warn(`⚠️ Index ${indexName} o'chirishda xatolik:`, error.message);
        }
      }

      console.log('✅ Barcha indexlar o\'chirildi');
    } catch (error) {
      console.error('❌ Index o\'chirishda xatolik:', error);
      throw error;
    }
  }
};

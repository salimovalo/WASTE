/**
 * Employee API endpoint'ni sinash
 */

const request = require('supertest');
const app = require('../server');
const { User, Role, Employee } = require('../models');

const testEmployeeAPI = async () => {
  try {
    console.log('🧪 Employee API ni sinamoqda...\n');
    
    // Super admin login qilish
    console.log('1. Super admin login...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login xatolik:', loginResponse.body);
      return;
    }
    
    console.log('✅ Login muvaffaqiyatli');
    const token = loginResponse.body.token;
    const user = loginResponse.body.user;
    console.log(`   User: ${user.username} (${user.role.name})`);
    
    // Employee yaratish API call
    console.log('\n2. Employee yaratish API call...');
    const employeeData = {
      first_name: 'API',
      last_name: 'Test',
      phone: '+998991234568',
      passport: 'API123456',
      position: 'driver',
      company_id: 1,
      district_id: 1,
      status: 'active'
    };
    
    console.log('   Yuborilayotgan data:', JSON.stringify(employeeData, null, 2));
    
    const createResponse = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(employeeData);
    
    console.log(`\n   Status: ${createResponse.status}`);
    console.log(`   Body:`, JSON.stringify(createResponse.body, null, 2));
    
    if (createResponse.status === 201 || createResponse.status === 200) {
      console.log('✅ Employee API muvaffaqiyatli yaratildi!');
      
      // Cleanup - yaratilgan employee'ni o'chirish
      const createdEmployee = await Employee.findOne({ 
        where: { passport: 'API123456' } 
      });
      if (createdEmployee) {
        await createdEmployee.destroy();
        console.log('🗑️  Test employee o\'chirildi (cleanup)');
      }
    } else {
      console.log('❌ Employee API yaratishda xatolik');
    }
    
  } catch (error) {
    console.error('❌ Test xatolik:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Script ishga tushirish
if (require.main === module) {
  testEmployeeAPI()
    .then(() => {
      console.log('\n✅ API Test tugadi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 API Test xatolik:', error);
      process.exit(1);
    });
}

module.exports = testEmployeeAPI;

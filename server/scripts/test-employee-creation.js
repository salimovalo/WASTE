/**
 * Employee yaratishni sinash scripti
 */

const { Employee, Company, District } = require('../models');

const testEmployeeCreation = async () => {
  try {
    console.log('🧪 Employee yaratishni sinamoqda...\n');
    
    // Korxonani topish
    const company = await Company.findOne();
    if (!company) {
      console.log('❌ Korxona topilmadi');
      return;
    }
    
    console.log(`✅ Korxona topildi: ${company.name} (ID: ${company.id})`);
    
    // Tumanni topish
    const district = await District.findOne();
    console.log(district ? `✅ Tuman topildi: ${district.name} (ID: ${district.id})` : '⚠️  Tuman topilmadi');
    
    // Test Employee ma'lumotlari
    const testEmployeeData = {
      first_name: 'Test',
      last_name: 'Employee',
      middle_name: 'Testovich',
      phone: '+998991234567',
      passport: 'TEST123456',
      position: 'driver',
      hire_date: new Date(),
      birth_date: '1990-01-01',
      address: 'Test Address 123',
      emergency_contact: '+998991234999',
      emergency_contact_name: 'Test Emergency',
      salary: 3000000,
      company_id: company.id,
      district_id: district?.id || null,
      vehicle_id: null,
      is_active: true,
      notes: 'Test employee yaratilgan script orqali'
    };
    
    console.log('\n📝 Employee ma\'lumotlari:');
    console.log(JSON.stringify(testEmployeeData, null, 2));
    
    // Employee yaratish
    console.log('\n⚙️  Employee yaratilmoqda...');
    const employee = await Employee.create(testEmployeeData);
    
    console.log('✅ Employee muvaffaqiyatli yaratildi!');
    console.log(`   ID: ${employee.id}`);
    console.log(`   Full Name: ${employee.getFullName()}`);
    console.log(`   Position: ${employee.getPositionName()}`);
    console.log(`   Company ID: ${employee.company_id}`);
    console.log(`   District ID: ${employee.district_id}`);
    console.log(`   Active: ${employee.is_active}`);
    
    // Created employee'ni delete qilish (cleanup)
    await employee.destroy();
    console.log('🗑️  Test employee o\'chirildi (cleanup)');
    
  } catch (error) {
    console.error('❌ Employee yaratishda xatolik:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Validation errors detail
    if (error.name === 'SequelizeValidationError') {
      console.log('\n🔍 Validation Errors:');
      error.errors.forEach(err => {
        console.log(`  - ${err.path}: ${err.message}`);
      });
    }
    
    // Database errors detail  
    if (error.name === 'SequelizeDatabaseError') {
      console.log('\n🔍 Database Error:');
      console.log(`  SQL: ${error.sql}`);
      console.log(`  Parameters: ${JSON.stringify(error.parameters)}`);
    }
  }
};

// Script ishga tushirish
if (require.main === module) {
  testEmployeeCreation()
    .then(() => {
      console.log('\n✅ Test tugadi');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test xatolik:', error);
      process.exit(1);
    });
}

module.exports = testEmployeeCreation;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 100],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.VIRTUAL,
    allowNull: true,
    validate: {
      len: [6, 100]
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  middle_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\-\(\)\s]+$/
    }
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  district_access: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isValidDistrictAccess(value) {
        if (!Array.isArray(value)) {
          throw new Error('Tuman ruxsatlari massiv ko\'rinishida bo\'lishi kerak');
        }
        for (let item of value) {
          if (!Number.isInteger(item) || item <= 0) {
            throw new Error('Tuman ID lari musbat butun son bo\'lishi kerak');
          }
        }
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {},
    validate: {
      isValidPermissions(value) {
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error('Ruxsatlar obyekt ko\'rinishida bo\'lishi kerak');
        }
      }
    }
  },
  full_name: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.last_name || ''} ${this.first_name || ''}`.trim();
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: async (user) => {
      if (user.password) {
        try {
          user.password_hash = await bcrypt.hash(user.password, 12);
          // Virtual field'ni o'chirish
          if (user.dataValues) {
            delete user.dataValues.password;
          }
        } catch (error) {
          console.error('Password hash error in beforeValidate:', error);
          throw error;
        }
      }
    },
    beforeCreate: async (user) => {
      if (user.password) {
        try {
          user.password_hash = await bcrypt.hash(user.password, 12);
          // Virtual field'ni o'chirish
          if (user.dataValues) {
            delete user.dataValues.password;
          }
        } catch (error) {
          console.error('Password hash error in beforeCreate:', error);
          throw error;
        }
      }
    },
    beforeUpdate: async (user) => {
      if (user.password) {
        try {
          user.password_hash = await bcrypt.hash(user.password, 12);
          // Virtual field'ni o'chirish  
          if (user.dataValues) {
            delete user.dataValues.password;
          }
        } catch (error) {
          console.error('Password hash error in beforeUpdate:', error);
          throw error;
        }
      }
    }
  }
});

// Parolni tekshirish metodi
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// To'liq ismni olish metodi
User.prototype.getFullName = function() {
  return `${this.last_name} ${this.first_name}${this.middle_name ? ' ' + this.middle_name : ''}`;
};

// Ruxsatni tekshirish metodi (role + individual permissions)
User.prototype.hasPermission = function(permission) {
  // Individual permissions (user-specific)
  const userPermissions = this.permissions || {};
  if (userPermissions[permission] === true) {
    return true;
  }
  if (userPermissions[permission] === false) {
    return false; // explicitly denied
  }
  
  // Role permissions (inherited from role)
  if (this.role && this.role.permissions) {
    const rolePermissions = this.role.permissions;
    return rolePermissions[permission] === true;
  }
  
  return false;
};

// JSON'da parolni yashirish
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password_hash;
  return values;
};

module.exports = User;

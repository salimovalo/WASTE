const express = require('express');
const { User, Role, Company } = require('../models');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Foydalanuvchi nomi va parol talab qilinadi'
      });
    }
    
    // Foydalanuvchini topish
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: Company,
          as: 'company'
        }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Foydalanuvchi nomi yoki parol noto\'g\'ri'
      });
    }
    
    // Parolni tekshirish
    const isPasswordValid = await user.checkPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Foydalanuvchi nomi yoki parol noto\'g\'ri'
      });
    }
    
    // Faol foydalanuvchini tekshirish
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Foydalanuvchi faol emas'
      });
    }
    
    // So'nggi kirish vaqtini yangilash
    await user.update({ last_login: new Date() });
    
    // Token yaratish
    const token = generateToken(user.id);
    
    res.json({
      message: 'Muvaffaqiyatli tizimga kirdi',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.getFullName(),
        role: user.role,
        company: user.company,
        district_access: user.district_access
      }
    });
    
  } catch (error) {
    console.error('Login xatoligi:', error);
    res.status(500).json({
      error: 'Tizimga kirishda xatolik'
    });
  }
});

// Profil ma'lumotlarini olish
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        full_name: req.user.getFullName(),
        phone: req.user.phone,
        role: req.user.role,
        company: req.user.company,
        district_access: req.user.district_access,
        last_login: req.user.last_login
      }
    });
  } catch (error) {
    console.error('Profil xatoligi:', error);
    res.status(500).json({
      error: 'Profil ma\'lumotlarini olishda xatolik'
    });
  }
});

// Parolni o'zgartirish
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Joriy va yangi parol talab qilinadi'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak'
      });
    }
    
    // Joriy parolni tekshirish
    const isCurrentPasswordValid = await req.user.checkPassword(current_password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Joriy parol noto\'g\'ri'
      });
    }
    
    // Yangi parolni o'rnatish
    await req.user.update({ password: new_password });
    
    res.json({
      message: 'Parol muvaffaqiyatli o\'zgartirildi'
    });
    
  } catch (error) {
    console.error('Parol o\'zgartirish xatoligi:', error);
    res.status(500).json({
      error: 'Parolni o\'zgartirishda xatolik'
    });
  }
});

// Token yaroqliligini tekshirish
router.get('/verify', authenticate, (req, res) => {
  res.json({
    message: 'Token yaroqli',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role?.name
    }
  });
});

// Logout (client tomonda token o'chiriladi)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    message: 'Muvaffaqiyatli tizimdan chiqdi'
  });
});

module.exports = router;

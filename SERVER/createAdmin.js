const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/adminDB')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

async function createAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const existing = await User.findOne({ email: "admin@gmail.com" });
    if (existing) {
        console.log("Admin already exists");
        process.exit();
    }

    const admin = new User({
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
        approved: true
    });

    await admin.save();
    console.log("✅ Admin created successfully");
    process.exit();
}

createAdmin();
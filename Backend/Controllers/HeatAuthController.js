
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/HeatUser.js"); // Sequelize Model එක require කරන්න

// 1. User registration logic
const register = async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // Check existence using Sequelize findOne
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User using Sequelize .create()
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      location,
    });

    // Remove password from response
    const { password: _, ...userResponse } = user.toJSON();

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// 2. User login logic
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        location: user.location,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};


module.exports = {
  register,
  login
};
// controllers/authController.js
const User = require('../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
        expiresIn: '7d'
    });
};

exports.registerUser = async (req, res) => {
    // Destructure new fields too
    const { name, email, password, role, latitude, longitude, city, risk_topic } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user with all fields
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            latitude,
            longitude,
            city,
            risk_topic
        });

        // Generate token
        const token = generateToken(user.id);

        // Send response
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                latitude: user.latitude,
                longitude: user.longitude,
                city: user.city,
                risk_topic: user.risk_topic
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
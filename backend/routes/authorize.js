import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    console.log('Rgister endppoint hit', req.body);

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        if (password.length < 6) {
            console.log("Password too short");
            return res.status(400).json({
                success: false,
                error: "Password must be at least 6 characters long"
            });
        }

        const userCheck = await pool.query(
            `SELECT id FROM users WHERE email = $1`,[email]
        );

        if (userCheck.rows.length > 0) {
            console.log('User already exists:', email);
            return res.status(409).json({
                success: false,
                error: 'User already exists'
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Password hashed suscessfully');

        const result = await pool.query(
            `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email`, [name, email, hashedPassword]
        );

        const newUser = result.rows[0];
        console.log('User created with ID: ', newUser.id);

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User Created Successfully',
            token, 
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    } catch (error) {
        console.error('Unexpected error in registration: ', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and Password are required'
            });
        }

        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`, [email]
        );

        if (result.rows.length === 0) {
            console.log('User not found: ', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid Creditianls'
            });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            console.log('Invalid password for user: ', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user: '. email);
        res.json({
            success: true,
            message: 'Login Successful',
            token, 
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.log('Unexpected error in login: ', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server error'
        });
    }
});

export default router;
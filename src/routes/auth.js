import db from '../lib/db.js';
import { Router } from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const privateKey = fs.readFileSync(path.resolve(__dirname, '../keys/private-key.pem'), 'utf8');
const publicKey = fs.readFileSync(path.resolve(__dirname, '../keys/public-key.pem'), 'utf8');

// Sign up Route
router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: "User created", userId: newUser.id });
    } catch (err) {
        res.status(500).json({ error: "Email already in use" });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Current timestamp and expiration time
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 60 * 60; // Token valid for 1 hour

        // Create access token with custom claims
        const accessToken = jwt.sign({
            sub: user.id,
            iat: iat,
            exp: exp,
            jti: uuidv4(),  // Unique token identifier
            token_type: "access"  // Custom token type
        }, privateKey, {
            algorithm: 'RS256',
            header: {
                alg: 'RS256',
                typ: 'JWT',
                kid: uuidv4()  // Unique key identifier
            }
        });

        // Create refresh token
        const refreshToken = jwt.sign({
            sub: user.id,
            iat: iat,
            exp: iat + 60 * 60 * 24,  // Token valid for 1 day
            jti: uuidv4(),  // Unique token identifier for refresh token
            token_type: "refresh"
        }, privateKey, {
            algorithm: 'RS256',
            header: {
                alg: 'RS256',
                typ: 'JWT',
                kid: uuidv4()  // Unique key identifier for refresh token
            }
        });

        // Set cookies for access and refresh tokens
        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60, // 1 hour
        });
        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });

        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        res.status(500).json({ error: "Error logging in" });
    }
});

// Logout Route
router.post("/logout", (req, res) => {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(200).json({ message: "Logout successful" });
});

// Token Refresh Route
router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, publicKey, { algorithms: ['RS256'] });

        // Generate new access token
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 60 * 60; // Token valid for 1 hour

        const accessToken = jwt.sign({
            sub: decoded.sub,
            iat: iat,
            exp: exp,
            jti: uuidv4(),  // Unique token identifier
            token_type: "access"
        }, privateKey, {
            algorithm: 'RS256',
            header: {
                alg: 'RS256',
                typ: 'JWT',
                kid: uuidv4()  // Unique key identifier
            }
        });

        // Set new access token cookie
        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60, // 1 hour
        });

        res.status(200).json({ access_token: accessToken });
    } catch (err) {
        res.status(401).json({ error: "Invalid refresh token" });
    }
});

export default router;

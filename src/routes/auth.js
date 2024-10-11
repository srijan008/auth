import db from '../lib/db.js';
import e, { Router } from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const privateKey = fs.readFileSync(path.resolve(__dirname, '../keys/private-key.pem'), 'utf8');
const publicKey = fs.readFileSync(path.resolve(__dirname, '../keys/public-key.pem'), 'utf8');


passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists in database
          let user = await db.user.findUnique({
            where: { email: profile.emails[0].value }
          });
  
          if (!user) {
            // If user doesn't exist, create new user and store googleId
            user = await db.user.create({
              data: {
                googleId: profile.id,  // Store Google ID
                email: profile.emails[0].value,
                name: profile.displayName
                // No password needed for OAuth users
              }
            });
          } else if (!user.googleId) {
            // If user exists but googleId is missing, update the user
            user = await db.user.update({
              where: { email: profile.emails[0].value },
              data: { googleId: profile.id }
            });
          }
  
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    const user = await db.user.findUnique({ where: { id } });
    done(null, user);
});


// Sign up Route
// router.post('/signup', async (req, res) => {
//     const { name, email, password, googleId } = req.body;

//     // Hash the password before saving
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create the user in your database
//     const user = await db.user.create({
//         data: {
//             name,
//             email,
//             password: hashedPassword,
//             googleId // save the Google ID for future logins
//         },
//     });

//     res.status(201).json({ message: 'User created successfully', userId: user.id });
// });



// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    // console.log(email, password);
    try {
        const user = await db.user.findUnique({ where: { email } });
        if(user && user.password == null) {
            return res.status(402).json({ error: "Login with google" });
        }
            
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
            secure: true,
            maxAge: 1000 * 60 * 60, // 1 hour
            sameSite: "Strict",
        });
        res.cookie("refresh_token", refreshToken, {
            secure: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            sameSite: "Strict",
        });

        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        res.status(500).json({ error: "Error logging in" });
    }
});

// SSO Login with Google
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Google OAuth callback
router.get("/google/callback", passport.authenticate("google", {  failureRedirect: "/login"}), (req, res) => {
    // Create JWT token after successful login
    const user = req.user;

    // Current timestamp and expiration time
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60; // Token valid for 1 hour

    const accessToken = jwt.sign({
        sub: user.id,
        iat: iat,
        exp: exp,
        jti: uuidv4(),
        token_type: "access"
    }, privateKey, {
        algorithm: 'RS256',
        header: {
            alg: 'RS256',
            typ: 'JWT',
            kid: uuidv4()
        }
    });

    const refreshToken = jwt.sign({
        sub: user.id,
        iat: iat,
        exp: iat + 60 * 60 * 24,
        jti: uuidv4(),
        token_type: "refresh"
    }, privateKey, {
        algorithm: 'RS256',
        header: {
            alg: 'RS256',
            typ: 'JWT',
            kid: uuidv4()
        }
    });

    // Set cookies for access and refresh tokens
    res.cookie("access_token", accessToken, {
        secure: true,
        maxAge: 1000 * 60 * 60, // 1 hour
        sameSite: "Strict",
    });
    res.cookie("refresh_token", refreshToken, {
        secure: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        sameSite: "Strict",
    });

    // Redirect or respond with success
    res.status(200).json({ message: "Login successful", userId: user.id });
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
            jti: uuidv4(),
            token_type: "access"
        }, privateKey, {
            algorithm: 'RS256',
            header: {
                alg: 'RS256',
                typ: 'JWT',
                kid: uuidv4()
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

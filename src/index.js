import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import routes from "./routes/auth.js";
import cors from "cors";
import session from "express-session"; // Import express-session
import passport from "passport"; // Import passport
import db from './lib/db.js'; // Make sure to import your database connection

dotenv.config();
const app = express();

// CORS Configuration to allow all origins
const corsOptions = {
    origin: true, // Allow requests from all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    credentials: true, // Allow cookies to be sent with requests
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());





// Set up your routes
app.use('/auth', routes);

// Uncomment if you have a protected route
// app.get("/protected", authMiddleware, (req, res) => {
//     res.status(200).json({ message: "Access granted", userId: req.user.id });
// });

// Start the server
app.listen(8000, () => console.log("Server running on port 8000"));

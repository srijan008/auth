import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import routes from "./routes/auth.js";
import cors from "cors";

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

app.use(express.json());
app.use(cookieParser());

app.use('/auth', routes);

// Uncomment if you have a protected route
// app.get("/protected", authMiddleware, (req, res) => {
//     res.status(200).json({ message: "Access granted", userId: req.user_id });
// });

app.listen(8000, () => console.log("Server running on port 8000"));

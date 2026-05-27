const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Local backup string agar .env load na ho sake
const dbURI = process.env.MONGO_URI || "mongodb+srv://amitgaurav429_db_user:JkLVuo35TucUiPZu@cluster0.icpw85s.mongodb.net/agencyDB?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch(err => console.log("Database Connection Error:", err));
// Request Schema (Data Format)
const RequestSchema = new mongoose.Schema({
    title: String,
    projectType: String,
    description: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const WebRequest = mongoose.model('WebRequest', RequestSchema);

// API Route: Form Data Save Karne Ke Liye
app.post('/api/requests', async (req, res) => {
    try {
        const { title, projectType, description } = req.body;
        const newRequest = new WebRequest({ title, projectType, description });
        await newRequest.save();
        res.status(201).json({ success: true, message: 'Request submitted successfully!', data: newRequest });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

const PORT = process.env.PORT || 5000;
// Database se saari requests ko nikal kar frontend par bhejna
app.get('/api/requests', async (req, res) => {
    try {
        const allRequests = await Request.find().sort({ createdAt: -1 }); // Nayi requests sabse upar dikhenge
        res.status(200).json({ success: true, data: allRequests });
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ success: false, message: "Server error while fetching data" });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

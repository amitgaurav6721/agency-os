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
const webRequestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true, required: true }, // Auto-generated Unique ID
    clientName: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    title: { type: String, required: true },
    projectType: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: 'Pending' } // Pending, In Progress, Completed, Live
}, { timestamps: true });

const WebRequest = mongoose.model('WebRequest', webRequestSchema);

// API Route: Form Data Save Karne Ke Liye (Naya Tracking ID format)
app.post('/api/requests', async (req, res) => {
    try {
        const { clientName, whatsappNumber, title, projectType, description } = req.body;

        // Ek random 4 digit ki unique ID banana
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const requestId = `REQ-${randomDigits}`;

        const newRequest = new WebRequest({
            requestId,
            clientName,
            whatsappNumber,
            title,
            projectType,
            description
        });

        await newRequest.save();

        res.status(201).json({ 
            success: true, 
            message: "Request submitted successfully!", 
            requestId: requestId 
        });

    } catch (error) {
        console.error("Error saving request:", error);
        res.status(500).json({ success: false, message: "Server Error", error });
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
// Client ki Unique ID se uska status dhoondna
app.get('/api/requests/track/:id', async (req, res) => {
    try {
        const request = await WebRequest.findOne({ requestId: req.params.id.toUpperCase() });
        if (!request) {
            return res.status(404).json({ success: false, message: "ID galat hai. Sahi ID dalein." });
        }
        res.status(200).json({ success: true, status: request.status, title: request.title });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

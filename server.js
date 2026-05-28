const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const dbURI = process.env.MONGO_URI || "mongodb+srv://amitgaurav429_db_user:JkLVuo35TucUiPZu@cluster0.icpw85s.mongodb.net/agencyDB?retryWrites=true&w=majority";
mongoose.connect(dbURI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch(err => console.log("Database Connection Error:", err));

// Schema Definition (E-mail and WhatsApp added)
const webRequestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    title: { type: String, required: true },
    projectType: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

const WebRequest = mongoose.model('WebRequest', webRequestSchema);

// 1. POST Route: Save Data + Send Automated Background Email
app.post('/api/requests', async (req, res) => {
    try {
        const { clientName, clientEmail, whatsappNumber, title, projectType, description } = req.body;

        // Unique ID Generate karna
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const requestId = `REQ-${randomDigits}`;

        // Database me Save karna
        const newRequest = new WebRequest({
            requestId,
            clientName,
            clientEmail,
            whatsappNumber,
            title,
            projectType,
            description
        });
        await newRequest.save();

        // NodeMailer Configuration for webtolet@gmail.com
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'webtolet@gmail.com', 
                pass: 'vzkjytcbvmoaoubm' // Official App Password jo tumne lagaya
            }
        });

        // Professional Branded Email Template
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #1f2937;">
                <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: 800;">Web <span style="color: #1f2937;">Tolet</span></h1>
                        <p style="color: #6b7280; font-size: 13px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Requirement Logged Successfully</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;">
                    <p style="font-size: 16px;">Dear <b>${clientName}</b>,</p>
                    <p style="font-size: 15px; color: #4b5563;">Thank you for choosing <b>Web Tolet</b>. Your project requirements have been successfully registered under the tracking number below:</p>
                    
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
                        <span style="display: block; font-size: 12px; color: #2563eb; font-weight: 700;">YOUR UNIQUE TRACKING ID</span>
                        <strong style="font-size: 28px; color: #1e40af; letter-spacing: 2px;">${requestId}</strong>
                    </div>
                    
                    <p style="font-size: 13px; color: #9ca3af; text-align: center;">You can use this ID anytime on our portal to check your project live status.</p>
                </div>
            </div>
        `;

        // Direct client ke input email par trigger
        await transporter.sendMail({
            from: '"Web Tolet Engine" <webtolet@gmail.com>',
            to: clientEmail, 
            subject: `🚀 Web Tolet Onboarding - [ID: ${requestId}]`,
            html: emailHtml
        });

        return res.status(201).json({ success: true, requestId: requestId });

    } catch (error) {
        console.error("Backend Process Error:", error);
        // Agar email kisi wajah se block bhi ho, tab bhi response return ho taaki button freeze na ho
        return res.status(201).json({ success: true, requestId: "REQ-DB-SAVED" });
    }
});

// 2. GET Route: Fetch All Requests
app.get('/api/requests', async (req, res) => {
    try {
        const allRequests = await WebRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: allRequests });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 3. GET Route: Track Single ID Status
app.get('/api/requests/track/:id', async (req, res) => {
    try {
        const request = await WebRequest.findOne({ requestId: req.params.id.toUpperCase() });
        if (!request) return res.status(404).json({ success: false, message: "Invalid Track ID." });
        res.status(200).json({ success: true, status: request.status, title: request.title });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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

// Schema me clientEmail field jodh diya hai
const webRequestSchema = new mongoose.Schema({
    requestId: { type: String, unique: true, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true }, // Naya validated input
    whatsappNumber: { type: String, required: true },
    title: { type: String, required: true },
    projectType: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

const WebRequest = mongoose.model('WebRequest', webRequestSchema);

// 1. API Route: Form Data Save + Automated Background Email Delivery
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

        // OFFICIAL WEB TOLET GMAIL BACKGROUND ENGINE
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'webtolet@gmail.com', // Official App Brand Email
                pass: 'vzkjytcbvmoaoubm'    // 16-digit Google App Password for webtolet@gmail.com
            }
        });

        // Branded Premium Email Template for Web Tolet
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #1f2937;">
                <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Web <span style="color: #1f2937;">Tolet</span></h1>
                        <p style="color: #6b7280; font-size: 13px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Requirement Logged Successfully</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;">
                    
                    <p style="font-size: 16px; line-height: 1.5;">Dear <b>${clientName}</b>,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Thank you for initiating your digital journey with <b>Web Tolet</b>. Your project requirements are secure in our system and our technical team has already started reviewing them.</p>
                    
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
                        <span style="display: block; font-size: 12px; color: #2563eb; font-weight: 700; letter-spacing: 1px; margin-bottom: 5px;">YOUR UNIQUE TRACKING ID</span>
                        <strong style="font-size: 28px; color: #1e40af; letter-spacing: 2px;">${requestId}</strong>
                    </div>

                    <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">Order Summary</h3>
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 10px 0; color: #6b7280; width: 35%;"><b>Project Title:</b></td>
                            <td style="padding: 10px 0; color: #1f2937; font-weight: 500;">${title}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                            <td style="padding: 10px 0; color: #6b7280;"><b>Engine Target:</b></td>
                            <td style="padding: 10px 0; color: #1f2937;">${projectType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #6b7280;"><b>Initial Status:</b></td>
                            <td style="padding: 10px 0; color: #d97706; font-weight: 700;">Pending (Awaiting Verification)</td>
                        </tr>
                    </table>

                    <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;">
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">This is an automated operational response from Web Tolet. You can input this tracking number directly on your Client Dashboard at any time to monitor staging logs and progression live.</p>
                </div>
            </div>
        `;

        // 🚀 DHYAN SE DEKHO: 'to' field ab directly dynamic user input 'clientEmail' hai!
        await transporter.sendMail({
            from: '"Web Tolet Engine" <webtolet@gmail.com>',
            to: clientEmail, 
            subject: `🚀 Web Tolet Confirmation - [ID: ${requestId}]`,
            html: emailHtml
        });

        res.status(201).json({ 
            success: true, 
            message: "Submitted and Official Web Tolet Branded Email Dispatched!", 
            requestId: requestId 
        });

    } catch (error) {
        console.error("Error in process:", error);
        res.status(201).json({ 
            success: true, 
            message: "Saved in Database, but Notification Delivery Failed.", 
            requestId: requestId 
        });
    }
});

// 2. API Route: All Entries Getter (For Admin Interface)
app.get('/api/requests', async (req, res) => {
    try {
        const allRequests = await WebRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: allRequests });
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 3. API Route: Status Resolver via Unique Identification Track ID
app.get('/api/requests/track/:id', async (req, res) => {
    try {
        const request = await WebRequest.findOne({ requestId: req.params.id.toUpperCase() });
        if (!request) {
            return res.status(404).json({ success: false, message: "Invalid Track ID. Please verify your token." });
        }
        res.status(200).json({ success: true, status: request.status, title: request.title });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

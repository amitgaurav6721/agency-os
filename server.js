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
// API Route: Form Data Save Karna + Automatic Email Confirmation Bhejna
app.post('/api/requests', async (req, res) => {
    try {
        const { clientName, whatsappNumber, title, projectType, description } = req.body;

        // 1. Unique ID Generate karna
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const requestId = `REQ-${randomDigits}`;

        // 2. Database me Save karna
        const newRequest = new WebRequest({
            requestId,
            clientName,
            whatsappNumber,
            title,
            projectType,
            description
        });
        await newRequest.save();

        // 3. AUTOMATED GMAIL/EMAIL LOGIC
        // Yahan tum apni Gmail details daloge (Password me normal password nahi, Google App Password dalna hoga)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'amitgaurav6721@gmail.com', // Tera email ID
                pass: 'xxxx xxxx xxxx xxxx' // Tera 16-digit ka Google App Password (Mai batata hu kaise milega)
            }
        });

        // Client ke liye ek shaandar HTML email template
        const emailHtml = `
            <div style="font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; padding: 30px; color: #1f2937;">
                <div style="max-width: 600px; background-color: #fff; margin: 0 auto; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #3b82f6; margin-bottom: 5px;">DevAgency</h2>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 0;">Order Confirmation</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p>Hello <b>${clientName}</b>,</p>
                    <p>Thank you for choosing DevAgency! Your project requirements have been successfully logged into our system.</p>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center;">
                        <span style="display: block; font-size: 13px; color: #16a34a; font-weight: 600;">YOUR UNIQUE TRACKING ID</span>
                        <strong style="font-size: 26px; color: #15803d; letter-spacing: 1px;">${requestId}</strong>
                    </div>

                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; width: 30%;"><b>Project Title:</b></td>
                            <td style="padding: 8px 0; color: #1f2937;">${title}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><b>Type:</b></td>
                            <td style="padding: 8px 0; color: #1f2937;">${projectType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><b>Status:</b></td>
                            <td style="padding: 8px 0; color: #d97706; font-weight: 600;">Pending (Awaiting Review)</td>
                        </tr>
                    </table>

                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="font-size: 13px; color: #9ca3af; text-align: center;">You can use this Tracking ID on our client portal anytime to see live development logs.</p>
                </div>
            </div>
        `;

        // Mail Bhejna trigger karo
        await transporter.sendMail({
            from: '"DevAgency Support" <amitgaurav6721@gmail.com>',
            to: 'amitgaurav6721@gmail.com', // Abhi testing ke liye teri hi ID par bhej rahe hain, baad me client ki email field se sync kar denge
            subject: `🎉 Project Registered Successfully! [ID: ${requestId}]`,
            html: emailHtml
        });

        res.status(201).json({ 
            success: true, 
            message: "Submitted and Professional Automation Email Sent!", 
            requestId: requestId 
        });

    } catch (error) {
        console.error("Error in process:", error);
        res.status(201).json({ 
            success: true, 
            message: "Saved in DB, but Email Automation failed.", 
            requestId: requestId 
        });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

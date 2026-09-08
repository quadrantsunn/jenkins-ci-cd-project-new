const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Parse JSON bodies sent from the contact form
app.use(express.json());

// Serve website files from public folder
app.use(express.static("public"));

// Health check for Jenkins
app.get("/health", (req, res) => {
    res.json({
        status: "UP"
    });
});

// Where submitted "Get In Touch" entries are stored
const DATA_DIR = path.join(__dirname, "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");

function readContacts() {
    try {
        const raw = fs.readFileSync(CONTACTS_FILE, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        return [];
    }
}

function writeContacts(contacts) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
}

// Handle "Get In Touch" form submissions
app.post("/api/contact", (req, res) => {
    const { name, email, company, message } = req.body || {};

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            error: "Name and email are required."
        });
    }

    const entry = {
        name: String(name).trim(),
        email: String(email).trim(),
        company: company ? String(company).trim() : "",
        message: message ? String(message).trim() : "",
        submittedAt: new Date().toISOString()
    };

    const contacts = readContacts();
    contacts.push(entry);
    writeContacts(contacts);

    res.status(201).json({
        success: true,
        message: "Thanks! We've received your details and will be in touch."
    });
});

// Simple listing of submissions (e.g. for an internal admin view)
app.get("/api/contacts", (req, res) => {
    res.json(readContacts());
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Application running on port ${PORT}`);
});

module.exports = app;

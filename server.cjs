const express = require('express');
const path = require('path');
const mssql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

const baseConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function initDb() {
    try {
        console.log('⚡ Initializing Asset Command Center DB...');
        let pool = await mssql.connect({ ...baseConfig, database: 'master' });
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${process.env.DB_DATABASE}')
            CREATE DATABASE ${process.env.DB_DATABASE}
        `);
        await pool.close();

        pool = await mssql.connect({ ...baseConfig, database: process.env.DB_DATABASE });

        // Assets / Equipment
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Assets]', 'U') IS NULL
            CREATE TABLE Assets (
                id NVARCHAR(50) PRIMARY KEY,
                assetTag NVARCHAR(50) UNIQUE,
                type NVARCHAR(100),
                brand NVARCHAR(100),
                model NVARCHAR(100),
                serialNumber NVARCHAR(100) UNIQUE,
                dept NVARCHAR(50), -- IT or Engineering
                location NVARCHAR(255),
                status NVARCHAR(50), -- Active, Under Repair, Retired
                warrantyExpiry DATETIME
            )
        `);

        // Users / Staff
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Users]', 'U') IS NULL
            CREATE TABLE Users (
                id NVARCHAR(50) PRIMARY KEY,
                name NVARCHAR(100),
                role NVARCHAR(50), -- Requester, Provider, Staff
                dept NVARCHAR(50) -- IT, Engineering, Admin
            )
        `);

        // Service Requests
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Requests]', 'U') IS NULL
            CREATE TABLE Requests (
                id NVARCHAR(50) PRIMARY KEY,
                title NVARCHAR(255),
                description NVARCHAR(MAX),
                dept NVARCHAR(50),
                priority NVARCHAR(20), -- Low, Medium, High
                location NVARCHAR(255),
                status NVARCHAR(50), -- Pending, Accepted, In Progress, Resolved, Disputed, Closed
                requesterId NVARCHAR(50),
                assetId NVARCHAR(50) FOREIGN KEY REFERENCES Assets(id),
                createdAt DATETIME DEFAULT GETDATE(),
                acceptedAt DATETIME,
                resolvedAt DATETIME,
                closedAt DATETIME,
                slaDeadline DATETIME,
                rejectionReason NVARCHAR(MAX)
            )
        `);

        // Staff Assignments
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Assignments]', 'U') IS NULL
            CREATE TABLE Assignments (
                requestId NVARCHAR(50) FOREIGN KEY REFERENCES Requests(id) ON DELETE CASCADE,
                userId NVARCHAR(50) FOREIGN KEY REFERENCES Users(id),
                assignedAt DATETIME DEFAULT GETDATE()
            )
        `);

        // Findings / Pre-Inspection
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Findings]', 'U') IS NULL
            CREATE TABLE Findings (
                id NVARCHAR(50) PRIMARY KEY,
                requestId NVARCHAR(50) FOREIGN KEY REFERENCES Requests(id),
                entry NVARCHAR(MAX),
                createdBy NVARCHAR(50),
                createdAt DATETIME DEFAULT GETDATE(),
                isFinalized BIT DEFAULT 0
            )
        `);

        // Resolutions & Parts Traceability
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Resolutions]', 'U') IS NULL
            CREATE TABLE Resolutions (
                id NVARCHAR(50) PRIMARY KEY,
                requestId NVARCHAR(50) FOREIGN KEY REFERENCES Requests(id),
                actionTaken NVARCHAR(MAX),
                materialsUsed NVARCHAR(MAX),
                oldPartSerial NVARCHAR(100),
                newPartSerial NVARCHAR(100),
                resolvedBy NVARCHAR(50),
                resolvedAt DATETIME DEFAULT GETDATE()
            )
        `);

        // Satisfaction Surveys
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Surveys]', 'U') IS NULL
            CREATE TABLE Surveys (
                requestId NVARCHAR(50) PRIMARY KEY FOREIGN KEY REFERENCES Requests(id),
                rating INT, -- 1-5
                comments NVARCHAR(MAX),
                submittedAt DATETIME DEFAULT GETDATE()
            )
        `);

        // Audit Trail
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[AuditLogs]', 'U') IS NULL
            CREATE TABLE AuditLogs (
                id INT IDENTITY(1,1) PRIMARY KEY,
                requestId NVARCHAR(50),
                userId NVARCHAR(50),
                action NVARCHAR(100),
                details NVARCHAR(MAX),
                timestamp DATETIME DEFAULT GETDATE()
            )
        `);

        console.log('✅ Asset Management DB Ready');
    } catch (err) {
        console.error('❌ DB Init Error:', err);
    }
}

initDb();

const dbConfig = { ...baseConfig, database: process.env.DB_DATABASE };

// --- API Endpoints ---

// Get all requests with related data
app.get('/api/requests', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT r.*, a.assetTag, a.model, u.name as requesterName
            FROM Requests r
            LEFT JOIN Assets a ON r.assetId = a.id
            LEFT JOIN Users u ON r.requesterId = u.id
            ORDER BY r.createdAt DESC
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// Get a single request lifecycle
app.get('/api/requests/:id', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const request = await pool.request().input('id', mssql.NVarChar, req.params.id).query('SELECT * FROM Requests WHERE id = @id');
        const assignments = await pool.request().input('id', mssql.NVarChar, req.params.id).query('SELECT u.name, u.id FROM Assignments a JOIN Users u ON a.userId = u.id WHERE a.requestId = @id');
        const findings = await pool.request().input('id', mssql.NVarChar, req.params.id).query('SELECT * FROM Findings WHERE requestId = @id ORDER BY createdAt DESC');
        const resolution = await pool.request().input('id', mssql.NVarChar, req.params.id).query('SELECT * FROM Resolutions WHERE requestId = @id');
        
        res.json({
            ...request.recordset[0],
            staff: assignments.recordset,
            findings: findings.recordset,
            resolution: resolution.recordset[0]
        });
    } catch (err) { res.status(500).send(err.message); }
});

// Create Request
app.post('/api/requests', async (req, res) => {
    const { id, title, description, dept, priority, location, requesterId, assetId } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.NVarChar, id)
            .input('title', mssql.NVarChar, title)
            .input('description', mssql.NVarChar, description)
            .input('dept', mssql.NVarChar, dept)
            .input('priority', mssql.NVarChar, priority)
            .input('location', mssql.NVarChar, location)
            .input('requesterId', mssql.NVarChar, requesterId)
            .input('assetId', mssql.NVarChar, assetId)
            .query(`
                INSERT INTO Requests (id, title, description, dept, priority, location, status, requesterId, assetId, createdAt)
                VALUES (@id, @title, @description, @dept, @priority, @location, 'Pending', @requesterId, @assetId, GETDATE())
            `);
        io.emit('db-change', { table: 'Requests', action: 'INSERT' });
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

// Staff Assignment
app.post('/api/requests/:id/assign', async (req, res) => {
    const { staffIds } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request().input('rid', mssql.NVarChar, req.params.id).query('DELETE FROM Assignments WHERE requestId = @rid');
        for (const sid of staffIds) {
            await pool.request()
                .input('rid', mssql.NVarChar, req.params.id)
                .input('sid', mssql.NVarChar, sid)
                .query('INSERT INTO Assignments (requestId, userId) VALUES (@rid, @sid)');
        }
        await pool.request().input('rid', mssql.NVarChar, req.params.id).query("UPDATE Requests SET status = 'In Progress', acceptedAt = GETDATE() WHERE id = @rid");
        io.emit('db-change', { table: 'Assignments', action: 'INSERT' });
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// Submit Findings
app.post('/api/findings', async (req, res) => {
    const { id, requestId, entry, createdBy } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.NVarChar, id)
            .input('rid', mssql.NVarChar, requestId)
            .input('entry', mssql.NVarChar, entry)
            .input('uid', mssql.NVarChar, createdBy)
            .query('INSERT INTO Findings (id, requestId, entry, createdBy) VALUES (@id, @rid, @entry, @uid)');
        io.emit('db-change', { table: 'Findings', action: 'INSERT' });
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

// Finalize Resolution (with Parts Swap)
app.post('/api/resolutions', async (req, res) => {
    const { id, requestId, actionTaken, materialsUsed, oldPartSerial, newPartSerial, resolvedBy } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.NVarChar, id)
            .input('rid', mssql.NVarChar, requestId)
            .input('action', mssql.NVarChar, actionTaken)
            .input('mats', mssql.NVarChar, materialsUsed)
            .input('oldSN', mssql.NVarChar, oldPartSerial)
            .input('newSN', mssql.NVarChar, newPartSerial)
            .input('uid', mssql.NVarChar, resolvedBy)
            .query(`
                INSERT INTO Resolutions (id, requestId, actionTaken, materialsUsed, oldPartSerial, newPartSerial, resolvedBy)
                VALUES (@id, @rid, @action, @mats, @oldSN, @newSN, @uid);
                UPDATE Requests SET status = 'Resolved', resolvedAt = GETDATE() WHERE id = @rid;
            `);
        io.emit('db-change', { table: 'Resolutions', action: 'INSERT' });
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

// Asset Management API
app.get('/api/assets', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Assets');
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Operational Server with Real-time Sync running on port ${PORT}`));

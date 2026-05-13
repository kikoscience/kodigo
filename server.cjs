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
app.use(express.static(path.join(__dirname, 'dist')));

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
        console.log('⚡ Initializing DocPlaybook Clinical DB...');
        let pool = await mssql.connect({ ...baseConfig, database: 'master' });
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${process.env.DB_DATABASE}')
            CREATE DATABASE ${process.env.DB_DATABASE}
        `);
        await pool.close();

        pool = await mssql.connect({ ...baseConfig, database: process.env.DB_DATABASE });

        // Clinical Templates
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Templates]', 'U') IS NULL
            CREATE TABLE Templates (
                id NVARCHAR(50) PRIMARY KEY,
                name NVARCHAR(255),
                category NVARCHAR(100), -- Cardiology, Pediatrics, etc.
                content NVARCHAR(MAX), -- JSON or Markdown structure
                createdBy NVARCHAR(100),
                updatedAt DATETIME DEFAULT GETDATE()
            )
        `);

        // Patient Encodings (Live Data)
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Encodings]', 'U') IS NULL
            CREATE TABLE Encodings (
                id NVARCHAR(50) PRIMARY KEY,
                patientName NVARCHAR(255),
                templateId NVARCHAR(50) FOREIGN KEY REFERENCES Templates(id),
                doctorName NVARCHAR(100),
                data NVARCHAR(MAX), -- The encoded findings
                status NVARCHAR(50), -- Draft, Finalized
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);

        console.log('✅ DocPlaybook Clinical Schema Ready');
    } catch (err) {
        console.error('❌ DB Init Error:', err);
    }
}

initDb();

const dbConfig = { ...baseConfig, database: process.env.DB_DATABASE };

// --- API Endpoints ---

app.get('/ping', (req, res) => res.send('pong'));

// Get all templates
app.get('/api/templates', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Templates ORDER BY name ASC');
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// Get recent encodings
app.get('/api/encodings', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT e.*, t.name as templateName 
            FROM Encodings e 
            JOIN Templates t ON e.templateId = t.id 
            ORDER BY e.createdAt DESC
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

// Create new encoding
app.post('/api/encodings', async (req, res) => {
    const { id, patientName, templateId, doctorName, data } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.NVarChar, id)
            .input('pname', mssql.NVarChar, patientName)
            .input('tid', mssql.NVarChar, templateId)
            .input('dname', mssql.NVarChar, doctorName)
            .input('data', mssql.NVarChar, data)
            .query(`
                INSERT INTO Encodings (id, patientName, templateId, doctorName, data, status, createdAt)
                VALUES (@id, @pname, @tid, @dname, @data, 'Finalized', GETDATE())
            `);
        
        io.emit('db-change', { type: 'ENCODING', id });
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

// Catch-all for Frontend
app.use((req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
            res.status(500).send('Frontend build missing.');
        }
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`🚀 DocPlaybook Operational on port ${PORT}`));

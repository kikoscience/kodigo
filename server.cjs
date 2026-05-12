const express = require('express');
const path = require('path');

const mssql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
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
        console.log('Connecting to master to verify database...');
        let pool = await mssql.connect({ ...baseConfig, database: 'master' });
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${process.env.DB_DATABASE}')
            BEGIN
                CREATE DATABASE ${process.env.DB_DATABASE}
            END
        `);
        await pool.close();

        console.log(`Connecting to ${process.env.DB_DATABASE}...`);
        pool = await mssql.connect({ ...baseConfig, database: process.env.DB_DATABASE });

        // Protocols
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Protocols]', 'U') IS NULL
            CREATE TABLE Protocols (
                id NVARCHAR(50) PRIMARY KEY,
                diagnosis NVARCHAR(255) NOT NULL,
                description NVARCHAR(MAX)
            )
        `);

        // ProtocolDays
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[ProtocolDays]', 'U') IS NULL
            CREATE TABLE ProtocolDays (
                id NVARCHAR(50) PRIMARY KEY,
                protocolId NVARCHAR(50) FOREIGN KEY REFERENCES Protocols(id) ON DELETE CASCADE,
                dayNumber INT NOT NULL,
                note NVARCHAR(MAX)
            )
        `);

        // Templates
        await pool.request().query(`
            IF OBJECT_ID('[dbo].[Templates]', 'U') IS NULL
            CREATE TABLE Templates (
                id NVARCHAR(50) PRIMARY KEY,
                title NVARCHAR(255) NOT NULL,
                category NVARCHAR(50),
                content NVARCHAR(MAX),
                lastUsed NVARCHAR(50)
            )
        `);

        console.log('✅ Database production-ready');
    } catch (err) {
        console.error('❌ Database Init Error:', err);
    }
}

initDb();

const dbConfig = { ...baseConfig, database: process.env.DB_DATABASE };

app.get('/api/protocols', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const protocols = await pool.request().query('SELECT * FROM Protocols');
        const days = await pool.request().query('SELECT * FROM ProtocolDays ORDER BY dayNumber');
        const result = protocols.recordset.map(p => ({
            ...p,
            days: days.recordset.filter(d => d.protocolId === p.id)
        }));
        res.json(result);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/protocols', async (req, res) => {
    const { id, diagnosis, description, days } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.NVarChar, id)
            .input('diagnosis', mssql.NVarChar, diagnosis)
            .input('description', mssql.NVarChar, description)
            .query(`
                IF EXISTS (SELECT 1 FROM Protocols WHERE id = @id)
                    UPDATE Protocols SET diagnosis = @diagnosis, description = @description WHERE id = @id
                ELSE
                    INSERT INTO Protocols (id, diagnosis, description) VALUES (@id, @diagnosis, @description)
            `);

        await pool.request().input('protoId', mssql.NVarChar, id).query('DELETE FROM ProtocolDays WHERE protocolId = @protoId');
        for (const day of (days || [])) {
            await pool.request()
                .input('id', mssql.NVarChar, day.id)
                .input('protoId', mssql.NVarChar, id)
                .input('dayNum', mssql.Int, day.dayNumber || day.day)
                .input('note', mssql.NVarChar, day.note)
                .query('INSERT INTO ProtocolDays (id, protocolId, dayNumber, note) VALUES (@id, @protoId, @dayNum, @note)');
        }
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/protocols/:id', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request().input('id', mssql.NVarChar, req.params.id).query('DELETE FROM Protocols WHERE id = @id');
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/templates', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Templates');
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/templates', async (req, res) => {
    const { id, title, category, content, lastUsed } = req.body;
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.NVarChar, id.toString())
            .input('title', mssql.NVarChar, title)
            .input('category', mssql.NVarChar, category)
            .input('content', mssql.NVarChar, content)
            .input('lastUsed', mssql.NVarChar, lastUsed)
            .query(`
                IF EXISTS (SELECT 1 FROM Templates WHERE id = @id)
                    UPDATE Templates SET title = @title, category = @category, content = @content, lastUsed = @lastUsed WHERE id = @id
                ELSE
                    INSERT INTO Templates (id, title, category, content, lastUsed) VALUES (@id, @title, @category, @content, @lastUsed)
            `);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/templates/:id', async (req, res) => {
    try {
        let pool = await mssql.connect(dbConfig);
        await pool.request().input('id', mssql.NVarChar, req.params.id.toString()).query('DELETE FROM Templates WHERE id = @id');
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3001;

// Production Static Serving
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => console.log(`🚀 Production server running on port ${PORT}`));

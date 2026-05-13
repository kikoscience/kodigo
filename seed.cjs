const mssql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function seed() {
    try {
        console.log('🌱 Seeding Asset Command Center...');
        let pool = await mssql.connect(dbConfig);

        // Clear existing data (caution: dev only)
        await pool.request().query('DELETE FROM Surveys');
        await pool.request().query('DELETE FROM Resolutions');
        await pool.request().query('DELETE FROM Findings');
        await pool.request().query('DELETE FROM Assignments');
        await pool.request().query('DELETE FROM Requests');
        await pool.request().query('DELETE FROM Assets');
        await pool.request().query('DELETE FROM Users');

        // Seed Users
        const users = [
            { id: 'u1', name: 'John Requester', role: 'Requester', dept: 'Admin' },
            { id: 'u2', name: 'Sarah IT Supervisor', role: 'Provider', dept: 'IT' },
            { id: 'u3', name: 'Mike IT Tech', role: 'Staff', dept: 'IT' },
            { id: 'u4', name: 'Robert Eng Supervisor', role: 'Provider', dept: 'Engineering' },
            { id: 'u5', name: 'David Eng Tech', role: 'Staff', dept: 'Engineering' }
        ];

        for (const u of users) {
            await pool.request()
                .input('id', mssql.NVarChar, u.id)
                .input('name', mssql.NVarChar, u.name)
                .input('role', mssql.NVarChar, u.role)
                .input('dept', mssql.NVarChar, u.dept)
                .query('INSERT INTO Users (id, name, role, dept) VALUES (@id, @name, @role, @dept)');
        }

        // Seed Assets
        const assets = [
            { id: 'a1', tag: 'IT-001', type: 'Laptop', brand: 'Dell', model: 'Latitude 5420', serial: 'SN-99881', dept: 'IT', loc: 'HR Office' },
            { id: 'a2', tag: 'ENG-102', type: 'HVAC', brand: 'Carrier', model: 'Infinity 26', serial: 'SN-HV-772', dept: 'Engineering', loc: 'Roof Deck' },
            { id: 'a3', tag: 'IT-005', type: 'Switch', brand: 'Cisco', model: 'Catalyst 9300', serial: 'SN-CS-441', dept: 'IT', loc: 'Server Room' }
        ];

        for (const a of assets) {
            await pool.request()
                .input('id', mssql.NVarChar, a.id)
                .input('tag', mssql.NVarChar, a.tag)
                .input('type', mssql.NVarChar, a.type)
                .input('brand', mssql.NVarChar, a.brand)
                .input('model', mssql.NVarChar, a.model)
                .input('serial', mssql.NVarChar, a.serial)
                .input('dept', mssql.NVarChar, a.dept)
                .input('loc', mssql.NVarChar, a.loc)
                .query(`
                    INSERT INTO Assets (id, assetTag, type, brand, model, serialNumber, dept, location, status)
                    VALUES (@id, @tag, @type, @brand, @model, @serial, @dept, @loc, 'Active')
                `);
        }

        // Seed initial Requests
        const requests = [
            { id: 'r1', title: 'System Crashing', desc: 'Laptop keeps freezing on boot.', dept: 'IT', prio: 'High', loc: 'HR Office', aid: 'a1', rid: 'u1' },
            { id: 'r2', title: 'AC Leakage', desc: 'Water dripping from the unit.', dept: 'Engineering', prio: 'Medium', loc: 'Roof Deck', aid: 'a2', rid: 'u1' }
        ];

        for (const r of requests) {
            await pool.request()
                .input('id', mssql.NVarChar, r.id)
                .input('title', mssql.NVarChar, r.title)
                .input('desc', mssql.NVarChar, r.desc)
                .input('dept', mssql.NVarChar, r.dept)
                .input('prio', mssql.NVarChar, r.prio)
                .input('loc', mssql.NVarChar, r.loc)
                .input('aid', mssql.NVarChar, r.aid)
                .input('rid', mssql.NVarChar, r.rid)
                .query(`
                    INSERT INTO Requests (id, title, description, dept, priority, location, status, requesterId, assetId, createdAt)
                    VALUES (@id, @title, @desc, @dept, @prio, @loc, 'Pending', @rid, @aid, GETDATE())
                `);
        }

        console.log('✨ Seeding Complete');
        await pool.close();
    } catch (err) {
        console.error('❌ Seed Error:', err);
    }
}

seed();

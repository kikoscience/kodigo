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
        console.log('🌱 Seeding DocPlaybook Clinical Data...');
        let pool = await mssql.connect(dbConfig);

        // Clear existing data
        await pool.request().query('DELETE FROM Encodings');
        await pool.request().query('DELETE FROM Templates');

        // Seed Templates
        const templates = [
            { id: 't1', name: 'Standard Adult Physical Exam', cat: 'General Medicine', content: '{}' },
            { id: 't2', name: 'Pediatric Developmental Milestone', cat: 'Pediatrics', content: '{}' },
            { id: 't3', name: 'Cardiac Stress Test Protocol', cat: 'Cardiology', content: '{}' },
            { id: 't4', name: 'Post-Operative Recovery Note', cat: 'Surgery', content: '{}' }
        ];

        for (const t of templates) {
            await pool.request()
                .input('id', mssql.NVarChar, t.id)
                .input('name', mssql.NVarChar, t.name)
                .input('cat', mssql.NVarChar, t.cat)
                .input('cont', mssql.NVarChar, t.content)
                .query('INSERT INTO Templates (id, name, category, content) VALUES (@id, @name, @cat, @cont)');
        }

        // Seed initial Encodings
        const encodings = [
            { id: 'e1', patient: 'John Doe', tid: 't1', doctor: 'Dr. House', data: '{}' },
            { id: 'e2', patient: 'Jane Watson', tid: 't3', doctor: 'Dr. Strange', data: '{}' }
        ];

        for (const e of encodings) {
            await pool.request()
                .input('id', mssql.NVarChar, e.id)
                .input('pname', mssql.NVarChar, e.patient)
                .input('tid', mssql.NVarChar, e.tid)
                .input('dname', mssql.NVarChar, e.doctor)
                .input('data', mssql.NVarChar, e.data)
                .query(`
                    INSERT INTO Encodings (id, patientName, templateId, doctorName, data, status, createdAt)
                    VALUES (@id, @pname, @tid, @dname, @data, 'Finalized', GETDATE())
                `);
        }

        console.log('✨ Clinical Seeding Complete');
        await pool.close();
    } catch (err) {
        console.error('❌ Seed Error:', err);
    }
}

seed();

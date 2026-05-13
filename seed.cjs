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

const PROTOCOLS = [
    {
        id: 'seed-1',
        diagnosis: 'Dengue Fever (Warning Signs)',
        description: 'Standard fluid management and monitoring for Dengue with warning signs.',
        days: [
            { id: 's1-d1', day: 1, note: 'Admit to ward. Start IVF {{iv_fluid_type}} at {{maintenance_rate}} ml/hr. Monitor BP/HR every 4 hours. Baseline CBC with Platelet count.' },
            { id: 's1-d2', day: 2, note: 'Monitor for defervescence. Current Temp: {{temp}} C. Repeat CBC/Platelet every 12-24 hours. Watch for abdominal pain or persistent vomiting.' },
            { id: 's1-d3', day: 3, note: 'Critical phase management. Ensure urine output >{{target_uop}} ml/kg/hr. Hematocrit monitoring every 8 hours if rising.' },
            { id: 's1-d4', day: 4, note: 'Recovery phase. Taper IVF gradually to {{taper_rate}} ml/hr. Watch for signs of fluid overload.' },
            { id: 's1-d5', day: 5, note: 'Stable for 24h without fever. Platelet count showing upward trend at {{current_plt}}k. Plan for discharge.' }
        ]
    },
    {
        id: 'seed-2',
        diagnosis: 'Pneumonia (Adult)',
        description: 'Management for Moderate Risk Community Acquired Pneumonia.',
        days: [
            { id: 's2-d1', day: 1, note: 'Start IV {{antibiotic_1}} 2g OD + {{antibiotic_2}} 500mg OD. Oxygen support if sat <{{target_sat}}%. Chest X-ray/Sputum Culture requested.' },
            { id: 's2-d2', day: 2, note: 'Continue IV {{antibiotic_1}}. Monitor respiratory rate (Current: {{rr}} bpm) and work of breathing.' },
            { id: 's2-d3', day: 3, note: 'Evaluate for clinical stability. If afebrile for 24h, consider shift to oral {{oral_antibiotic}} {{oral_dose}}.' }
        ]
    },
    {
        id: 'seed-4',
        diagnosis: 'Congestive Heart Failure',
        description: 'Diuretic optimization and congestion management.',
        days: [
            { id: 's4-d1', day: 1, note: 'Start IV {{loop_diuretic}} {{dose}} BID. Strict fluid restriction to {{fluid_limit}} ml/day. Daily weight monitoring.' },
            { id: 's4-d2', day: 2, note: 'Monitor potassium levels (Current: {{k_level}}). Adjust diuretic based on net output (Target: {{target_net_uop}} ml).' }
        ]
    }
];

const TEMPLATES = [
    {
        id: 't1',
        title: 'Standard Ward SOAP',
        category: 'soap',
        content: 'S: Patient comfortable, no new complaints.\nO: Stable Vitals. HR: {{hr}} bpm, BP: {{bp}} mmHg, Temp: {{temp}} C. Chest: {{chest_exam}}. Abdomen: {{abd_exam}}.\nA: {{diagnosis}} - Stable.\nP: Continue current management. Monitor for {{watch_for}}.'
    },
    {
        id: 't2',
        title: 'Discharge Summary',
        category: 'discharge',
        content: 'Final Diagnosis: {{diagnosis}}.\nCourse in the ward: Patient was admitted for {{complaint}}. Started on {{antibiotic}} for {{duration}} days. Clinical improvement noted.\nHome Medications: {{home_meds}}.\nFollow-up: Visit OPD in {{weeks}} week(s).'
    },
    {
        id: 't3',
        title: 'H&P Admission Note',
        category: 'history',
        content: 'Chief Complaint: {{complaint}}.\nHistory of Present Illness: {{hpi}}.\nPhysical Exam: BP: {{bp}}, HR: {{hr}}, RR: {{rr}}, Sat: {{sat}}%.\nAssessment: {{assessment}}.\nInitial Plan: Admit to {{ward_type}}. Start {{initial_ivf}}.'
    }
];

async function seed() {
    try {
        console.log('🌱 Seeding database with Smart Placeholders...');
        let pool = await mssql.connect(dbConfig);

        await pool.request().query("DELETE FROM ProtocolDays WHERE id LIKE 's%'");
        await pool.request().query("DELETE FROM Protocols WHERE id LIKE 'seed%'");
        await pool.request().query("DELETE FROM Templates WHERE id LIKE 't%'");

        for (const p of PROTOCOLS) {
            await pool.request()
                .input('id', mssql.NVarChar, p.id)
                .input('diag', mssql.NVarChar, p.diagnosis)
                .input('desc', mssql.NVarChar, p.description)
                .query('INSERT INTO Protocols (id, diagnosis, description) VALUES (@id, @diag, @desc)');
            
            for (const d of p.days) {
                await pool.request()
                    .input('id', mssql.NVarChar, d.id)
                    .input('protoId', mssql.NVarChar, p.id)
                    .input('dayNum', mssql.Int, d.day)
                    .input('note', mssql.NVarChar, d.note)
                    .query('INSERT INTO ProtocolDays (id, protocolId, dayNumber, note) VALUES (@id, @protoId, @dayNum, @note)');
            }
        }

        for (const t of TEMPLATES) {
            await pool.request()
                .input('id', mssql.NVarChar, t.id)
                .input('title', mssql.NVarChar, t.title)
                .input('cat', mssql.NVarChar, t.category)
                .input('content', mssql.NVarChar, t.content)
                .input('lastUsed', mssql.NVarChar, 'Smart Seed')
                .query('INSERT INTO Templates (id, title, category, content, lastUsed) VALUES (@id, @title, @cat, @content, @lastUsed)');
        }

        console.log('✅ Database populated with Smart Placeholders!');
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
}

seed();

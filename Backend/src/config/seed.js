// src/config/seed.js
'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding database...');

    // Admin user
    const adminHash = await bcrypt.hash('Admin1234', 12);
    const { rows: [admin] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Super Admin', 'admin@queueless.app', $1, 'ADMIN')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      [adminHash]
    );
    console.log(`  ✅ Admin: ${admin.email}`);

    // Staff user
    const staffHash = await bcrypt.hash('Staff1234', 12);
    const { rows: [staff] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Jane Staff', 'staff@queueless.app', $1, 'STAFF')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      [staffHash]
    );
    console.log(`  ✅ Staff: ${staff.email}`);

    // Regular user
    const userHash = await bcrypt.hash('User1234', 12);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('John Doe', 'user@queueless.app', $1, 'USER')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, email`,
      [userHash]
    );
    console.log(`  ✅ User: ${user.email}`);

    // Services
    const services = [
      { name: 'General Consultation', description: 'General medical consultation', location: 'Block A, Room 101', duration: 15 },
      { name: 'Eye Clinic',           description: 'Ophthalmology services',       location: 'Block B, Room 201', duration: 20 },
      { name: 'Dental Care',          description: 'Dental examination and care',  location: 'Block C, Room 301', duration: 30 },
      { name: 'Pharmacy',             description: 'Prescription pickup',          location: 'Ground Floor',     duration: 5  },
    ];

    const serviceIds = [];
    for (const svc of services) {
      const { rows: [s] } = await client.query(
        `INSERT INTO services (name, description, location, avg_service_duration_min)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [svc.name, svc.description, svc.location, svc.duration]
      );
      if (s) {
        serviceIds.push(s.id);
        await client.query(
          `INSERT INTO queue_settings (service_id, avg_service_duration_min)
           VALUES ($1, $2)
           ON CONFLICT (service_id) DO NOTHING`,
          [s.id, svc.duration]
        );
        console.log(`  ✅ Service: ${svc.name}`);
      }
    }

    // Assign staff to first two services
    for (const svcId of serviceIds.slice(0, 2)) {
      await client.query(
        `INSERT INTO staff_assignments (staff_id, service_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [staff.id, svcId]
      );
    }
    console.log(`  ✅ Staff assigned to 2 services`);

    await client.query('COMMIT');
    console.log('\n✅  Seed completed successfully!');
    console.log('\nSeed credentials:');
    console.log('  Admin : admin@queueless.app / Admin1234');
    console.log('  Staff : staff@queueless.app / Staff1234');
    console.log('  User  : user@queueless.app  / User1234');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

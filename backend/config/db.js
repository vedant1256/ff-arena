// backend/config/db.js
require('dotenv').config(); // Guarantee environment variables are loaded
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// 1. Create a native PostgreSQL connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap the pool in Prisma's new adapter
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma using the adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
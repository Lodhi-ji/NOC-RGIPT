/**
 * Wipes the database and loads fresh demo data.
 * Usage: npm run seed   (uses MONGO_URI / MONGO_DB_NAME from .env)
 *
 * In local demo mode (no MONGO_URI) you don't need this: the server seeds itself
 * on first start. Use `npm run demo:reset` to start over.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const { seedDemoData, DEMO_ACCOUNTS, DEMO_PASSWORD } = require('./utils/demoSeed');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is not set. In local demo mode just run `npm run demo:reset` instead.');
      process.exit(1);
    }
    await mongoose.connect(uri.trim(), { dbName: process.env.MONGO_DB_NAME || undefined });
    console.log(`Seeding database "${mongoose.connection.name}" (existing data will be wiped)...`);
    await seedDemoData({ reset: true });
    console.log(`Demo data loaded. Password for every account: ${DEMO_PASSWORD}`);
    DEMO_ACCOUNTS.forEach((a) => console.log(`  ${a.role.padEnd(15)} ${a.email}`));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

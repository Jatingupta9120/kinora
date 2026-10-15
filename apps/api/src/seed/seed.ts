/**
 * Resets the catalog (titles, collections) and creates two demo accounts.
 * Usage: npm run seed   (reads MONGODB_URI, defaults to the docker-compose instance)
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AccountSchema, ProfileSchema } from '../schemas/account.schema.js';
import { CollectionSchema } from '../schemas/collection.schema.js';
import { TitleSchema } from '../schemas/title.schema.js';
import { COLLECTIONS, TITLES } from './data.js';

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/kinora';
const dbName = process.env.MONGODB_DB ?? 'kinora';

const DEMO_ACCOUNTS = [
  { email: 'demo@kinora.test', password: 'kinora-demo', plan: 'basic' as const,
    profiles: [{ name: 'Alex', kids: false, avatarColor: '#1a98ff' }, { name: 'Kids', kids: true, avatarColor: '#ffb703' }] },
  { email: 'premium@kinora.test', password: 'kinora-demo', plan: 'premium' as const,
    profiles: [{ name: 'Sam', kids: false, avatarColor: '#2ec4b6' }] },
];

async function main() {
  await mongoose.connect(uri, { dbName });
  const Title = mongoose.model('Title', TitleSchema);
  const Collection = mongoose.model('Collection', CollectionSchema);
  const Account = mongoose.model('Account', AccountSchema);
  const Profile = mongoose.model('Profile', ProfileSchema);

  // Validate rails before writing anything: every slug must exist.
  const known = new Set(TITLES.map((t) => t.slug));
  for (const c of COLLECTIONS) {
    const missing = c.titleSlugs.filter((s) => !known.has(s));
    if (missing.length) throw new Error(`Collection ${c.slug} references unknown titles: ${missing.join(', ')}`);
  }

  await Title.deleteMany({});
  await Title.insertMany(TITLES);
  await Collection.deleteMany({});
  await Collection.insertMany(COLLECTIONS);
  await Promise.all([Title.syncIndexes(), Collection.syncIndexes(), Account.syncIndexes(), Profile.syncIndexes()]);

  for (const demo of DEMO_ACCOUNTS) {
    const existing = await Account.findOne({ email: demo.email });
    if (existing) {
      await Profile.deleteMany({ accountId: existing._id });
      await existing.deleteOne();
    }
    const account = await Account.create({
      email: demo.email,
      passwordHash: await bcrypt.hash(demo.password, 10),
      plan: demo.plan,
      planRenewsAt: demo.plan === 'premium' ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : undefined,
    });
    await Profile.insertMany(demo.profiles.map((p) => ({ ...p, accountId: account._id })));
  }

  console.log(`Seeded ${TITLES.length} titles, ${COLLECTIONS.length} collections, ${DEMO_ACCOUNTS.length} demo accounts into database "${dbName}" at ${uri.replace(/\/\/[^@]*@/, '//***@')}`);
  for (const d of DEMO_ACCOUNTS) console.log(`  ${d.email} / ${d.password}  (${d.plan})`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

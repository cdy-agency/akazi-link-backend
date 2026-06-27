/**
 * Backfill emailVerified for users created before Auth V2 OTP onboarding.
 *
 * Usage:
 *   npm run migrate:email-verified
 *   npm run migrate:email-verified -- --all-unverified
 *
 * Default mode (legacy-fields) is idempotent and safe to re-run.
 * --all-unverified is a ONE-TIME pre-launch backfill; do not re-run after V2 registrations.
 */
import dotenv from 'dotenv';
import mongoose, { FilterQuery } from 'mongoose';
import User from '../models/User';
import type { IUser } from '../types/models';

dotenv.config();

type MigrationMode = 'legacy-fields' | 'all-unverified';

function parseMode(argv: string[]): MigrationMode {
  if (argv.includes('--all-unverified')) {
    return 'all-unverified';
  }
  return 'legacy-fields';
}

function buildFilter(mode: MigrationMode): FilterQuery<IUser> {
  if (mode === 'all-unverified') {
    return { emailVerified: { $ne: true } };
  }

  return {
    $or: [{ emailVerified: { $exists: false } }, { emailVerified: null }],
  };
}

async function migrateEmailVerified(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }

  const mode = parseMode(process.argv.slice(2));
  const filter = buildFilter(mode);
  const now = new Date();

  await mongoose.connect(mongoUri);

  const matchedBefore = await User.countDocuments(filter);

  const result = await User.updateMany(filter, {
    $set: {
      emailVerified: true,
      emailVerifiedAt: now,
    },
  });

  console.log('Auth V2 email verification migration');
  console.log(`Mode: ${mode}`);
  console.log(`Matched (pre-update): ${matchedBefore}`);
  console.log(`Matched (driver): ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);

  if (mode === 'all-unverified') {
    console.log(
      'WARNING: --all-unverified marks every unverified user as verified. Run only once before enabling AUTH_V2_LOGIN_GATE.'
    );
  } else {
    console.log(
      'legacy-fields mode is idempotent; re-runs only affect users without emailVerified set.'
    );
  }

  await mongoose.disconnect();
}

migrateEmailVerified().catch((error: Error) => {
  console.error('Migration failed:', error.message);
  void mongoose.disconnect();
  process.exit(1);
});

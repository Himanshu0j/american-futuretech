#!/usr/bin/env node
/**
 * Admin credential rotation + leaked-default scan.
 *
 *   # List every account still using the old published default password
 *   node scripts/rotate-admin-credentials.js --scan
 *
 *   # Rotate one account (random strong password, printed once)
 *   node scripts/rotate-admin-credentials.js --email admin@americanfuturetech.com
 *
 *   # Rotate with a password you choose
 *   node scripts/rotate-admin-credentials.js --email admin@... --password 'MyNewPass!2026'
 *
 *   # Target a specific database (otherwise server/.env MONGODB_URI is used)
 *   node scripts/rotate-admin-credentials.js --scan --uri "mongodb+srv://..."
 *
 * Rotating a password also stamps `passwordChangedAt`, which immediately
 * invalidates every JWT issued before the change.
 */

const path = require('path');
const fs = require('fs');

module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

const SERVER_DIR = path.join(__dirname, '..', 'server');
dotenv.config({ path: path.join(SERVER_DIR, '.env') });

const { validatePassword, describePasswordPolicy, generateSecurePassword } = require(
  path.join(SERVER_DIR, 'utils', 'passwords'),
);

// The value that was committed to source control and is therefore public.
const LEAKED_DEFAULTS = ['admin123', 'Password@123'];

const parseArgs = (argv) => {
  const args = { scan: false, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--scan') args.scan = true;
    else if (token === '--force') args.force = true;
    else if (token === '--email') args.email = argv[++i];
    else if (token === '--password') args.password = argv[++i];
    else if (token === '--uri') args.uri = argv[++i];
  }
  return args;
};

const resolveUri = (args) => {
  const uri = args.uri || process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      'No database URI. Pass --uri "mongodb+srv://..." or set MONGODB_URI in server/.env',
    );
    process.exit(1);
  }
  return uri;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const uri = resolveUri(args);

  if (!args.scan && !args.email) {
    console.error('Nothing to do. Use --scan or --email <address>.');
    process.exit(1);
  }

  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  console.log(`\nDatabase: ${safeUri}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

  const User = require(path.join(SERVER_DIR, 'models', 'User'));
  const AuditLog = require(path.join(SERVER_DIR, 'models', 'AuditLog'));

  // ── Scan mode: who is still on a password that is published in the repo? ──
  if (args.scan) {
    const users = await User.find().select('+password');
    const compromised = [];

    for (const user of users) {
      for (const leaked of LEAKED_DEFAULTS) {
        // eslint-disable-next-line no-await-in-loop
        if (await bcrypt.compare(leaked, user.password)) {
          compromised.push({ user, leaked });
          break;
        }
      }
    }

    console.log(`\nScanned ${users.length} accounts.`);
    if (!compromised.length) {
      console.log('✅ No account is using a published default password.\n');
    } else {
      console.log(`\n🚨 ${compromised.length} account(s) still use a PUBLISHED default password:\n`);
      compromised.forEach(({ user, leaked }) => {
        console.log(`   ${user.role.padEnd(11)} ${user.email}   (matches "${leaked}")`);
      });
      console.log('\n   Rotate them now:');
      compromised.forEach(({ user }) => {
        console.log(`     node scripts/rotate-admin-credentials.js --email ${user.email}`);
      });
      console.log('');
    }

    await mongoose.disconnect();
    process.exit(compromised.length ? 1 : 0);
  }

  // ── Rotate mode ──
  const user = await User.findOne({ email: String(args.email).toLowerCase().trim() }).select('+password');
  if (!user) {
    console.error(`\n❌ No account found for ${args.email}\n`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const newPassword = args.password || generateSecurePassword();
  const strength = validatePassword(newPassword, { email: user.email, name: user.name });

  if (!strength.valid && !args.force) {
    console.error(`\n❌ New password rejected: ${strength.errors.join(' ')}`);
    console.error(`   Policy: ${describePasswordPolicy()}\n`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = newPassword; // hashed by the model, stamps passwordChangedAt
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await AuditLog.create({
    actorName: 'Credential rotation script',
    actorRole: 'SYSTEM',
    action: 'PASSWORD_ROTATED',
    entity: 'User',
    entityId: user._id.toString(),
    details: `Password rotated for ${user.email} (${user.role}) via scripts/rotate-admin-credentials.js. All previously issued tokens are now invalid.`,
  }).catch(() => {});

  console.log(
    `\n✅ Password rotated for ${user.name} <${user.email}> (${user.role})\n` +
    `   New password: ${newPassword}\n` +
    '   Every JWT issued before now is invalid — users will be asked to log in again.\n' +
    '   Save this password somewhere safe; it cannot be recovered.\n',
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(`\nFailed: ${error.message}\n`);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});

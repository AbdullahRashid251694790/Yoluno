/**
 * Seed Script
 *
 * Creates a test user with a child profile for development.
 */

import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { pool, query, queryOne } from './config/database.js';
import { hashPassword } from './utils/password.js';

interface User {
  id: string;
  email: string;
}

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
};

const TEST_CHILD = {
  name: 'Alex',
  age: 7,
  gender: 'prefer_not_to_say',
};

async function seed() {
  console.log('Starting seed...\n');

  try {
    // Check if user already exists
    const existingUser = await queryOne<User>(
      'SELECT id, email FROM users WHERE email = $1',
      [TEST_USER.email]
    );

    let userId: string;

    if (existingUser) {
      console.log(`User already exists: ${existingUser.email} (${existingUser.id})`);
      userId = existingUser.id;

      // Check if child profile exists
      const existingChild = await queryOne<{ id: string }>(
        'SELECT id FROM child_profiles WHERE user_id = $1',
        [userId]
      );

      if (!existingChild) {
        const childId = uuidv4();
        await query(
          `INSERT INTO child_profiles (id, user_id, name, age, gender)
           VALUES ($1, $2, $3, $4, $5)`,
          [childId, userId, TEST_CHILD.name, TEST_CHILD.age, TEST_CHILD.gender]
        );
        console.log(`Created child profile: ${TEST_CHILD.name} (${childId})`);
      } else {
        console.log('Child profile already exists');
      }

      console.log('\nTo login, use:');
      console.log(`  Email: ${TEST_USER.email}`);
      console.log(`  Password: ${TEST_USER.password}`);
      return;
    }

    // Create user
    userId = uuidv4();
    const passwordHash = await hashPassword(TEST_USER.password);

    await query(
      `INSERT INTO users (id, email, password_hash, email_verified)
       VALUES ($1, $2, $3, $4)`,
      [userId, TEST_USER.email, passwordHash, true]
    );
    console.log(`Created user: ${TEST_USER.email} (${userId})`);

    // Create subscription
    await query(
      `INSERT INTO user_subscriptions (id, user_id, tier, stories_limit, chat_messages_limit)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), userId, 'free', 10, 100]
    );
    console.log('Created subscription (free tier)');

    // Create child profile
    const childId = uuidv4();
    await query(
      `INSERT INTO child_profiles (id, user_id, name, age, gender)
       VALUES ($1, $2, $3, $4, $5)`,
      [childId, userId, TEST_CHILD.name, TEST_CHILD.age, TEST_CHILD.gender]
    );
    console.log(`Created child profile: ${TEST_CHILD.name} (${childId})`);

    console.log('\n--- Seed Complete ---');
    console.log('\nTo login, use:');
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();

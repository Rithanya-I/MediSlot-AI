import { db, isDatabaseConfigured } from './index.ts';
import { patientProfiles, users } from './schema.ts';
import { eq } from 'drizzle-orm';

const inMemoryUsers = new Map<string, any>();

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  const resolvedName =
    displayName && displayName.trim().length > 0
      ? displayName.trim()
      : email.split('@')[0] || 'Patient';

  if (!isDatabaseConfigured()) {
    if (!inMemoryUsers.has(uid)) {
      inMemoryUsers.set(uid, {
        id: inMemoryUsers.size + 1,
        uid,
        email,
        displayName: resolvedName,
        role: 'patient',
        createdAt: new Date(),
      });
    }
    return inMemoryUsers.get(uid);
  }

  try {

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: resolvedName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: resolvedName,
        },
      })
      .returning();

    const user = result[0];

    const existingProfile = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, user.id));

    if (existingProfile.length === 0) {
      await db
        .insert(patientProfiles)
        .values({
          userId: user.id,
          fullName: resolvedName,
        })
        .onConflictDoNothing();
    }

    return user;
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

import { db } from './index.ts';
import { patientProfiles, users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    const resolvedName =
      displayName && displayName.trim().length > 0
        ? displayName.trim()
        : email.split('@')[0] || 'Patient';

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

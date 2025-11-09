import { db } from '../db';
import { officerProfiles } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { searchOfficerInformation } from '../officerSearch';
import { compileOfficerData } from '../officerDataCollector';

async function main() {
  console.log('FINAL STORAGE VERIFICATION\n');
  
  const before = await db.select({ count: sql<number>`count(*)` }).from(officerProfiles);
  console.log(`Initial count: ${before[0].count}\n`);
  
  console.log('Searching Derek Chauvin...');
  await searchOfficerInformation({
    officerName: 'Derek Chauvin',
    city: 'Minneapolis',
    state: 'MN',
    officerType: 'police',
    badgeData: null,
    bypassCache: true
  }, 'final_verification');
  
  const profile = await compileOfficerData(
    'Derek Chauvin',
    'Minneapolis Police Department',
    'Minneapolis, MN',
    true
  );
  
  console.log(`Compiled - Quality: ${profile.dataQualityScore}/100\n`);
  
  console.log('Storing profile...');
  const stored = await db.insert(officerProfiles).values({
    officerName: profile.officerName,
    department: profile.department || 'Unknown',
    rank: profile.rank,
    badgeNumber: profile.badgeNumber,
    jurisdiction: profile.location,
    dataQualityScore: profile.dataQualityScore,
    sources: profile.sources,
    lastVerified: new Date()
  }).returning();
  
  console.log(`Stored! ID: ${stored[0].id}\n`);
  
  const after = await db.select({ count: sql<number>`count(*)` }).from(officerProfiles);
  console.log(`Final count: ${after[0].count}`);
  console.log(`New profiles: ${Number(after[0].count) - Number(before[0].count)}\n`);
  
  console.log('SUCCESS: Profile stored in database!');
}

main().then(() => process.exit(0));

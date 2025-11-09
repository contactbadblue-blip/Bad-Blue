// Officer Roster Management - CSV-based local storage for fast retrieval
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const ROSTER_DIR = path.join(process.cwd(), 'data', 'officer_roster');
const OFFICERS_CSV = path.join(ROSTER_DIR, 'officers.csv');
const DEPARTMENTS_CSV = path.join(ROSTER_DIR, 'departments.csv');

// Officer CSV schema: ID, name, city, state
interface OfficerRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  badgeNumber?: string;
  department?: string;
  addedAt?: string;
}

// Department CSV schema: state, city, department
interface DepartmentRecord {
  state: string;
  city: string;
  department: string;
  url?: string;
  addedAt?: string;
}

/**
 * Initialize roster CSV files if they don't exist
 */
export async function initializeRoster(): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(ROSTER_DIR, { recursive: true });

    // Initialize officers.csv if it doesn't exist
    try {
      await fs.access(OFFICERS_CSV);
    } catch {
      const headers = 'id,name,city,state,badgeNumber,department,addedAt\n';
      await fs.writeFile(OFFICERS_CSV, headers, 'utf-8');
      console.log('[Roster] Initialized officers.csv');
    }

    // Initialize departments.csv if it doesn't exist
    try {
      await fs.access(DEPARTMENTS_CSV);
    } catch {
      const headers = 'state,city,department,url,addedAt\n';
      await fs.writeFile(DEPARTMENTS_CSV, headers, 'utf-8');
      console.log('[Roster] Initialized departments.csv');
    }
  } catch (error) {
    console.error('[Roster] Error initializing roster:', error);
  }
}

/**
 * Search for an officer in the local roster
 */
export async function findOfficerInRoster(name: string, city?: string, state?: string): Promise<OfficerRecord | null> {
  try {
    const content = await fs.readFile(OFFICERS_CSV, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as OfficerRecord[];

    // Search by name (case-insensitive)
    const normalizedName = name.toLowerCase().trim();
    
    for (const record of records) {
      // Skip records with missing required fields
      if (!record.name) continue;
      
      const recordName = (record.name ?? '').toLowerCase().trim();
      const recordCity = (record.city ?? '').toLowerCase().trim();
      const recordState = (record.state ?? '').toLowerCase().trim();
      
      // Check if names match
      const nameMatches = recordName.includes(normalizedName) || normalizedName.includes(recordName);
      
      if (nameMatches) {
        // If city/state provided, verify they match
        if (city && recordCity !== city.toLowerCase()) continue;
        if (state && recordState !== state.toLowerCase()) continue;
        
        console.log(`[Roster] Found officer in roster: ${record.name} (${record.city || 'N/A'}, ${record.state || 'N/A'})`);
        return record;
      }
    }

    console.log(`[Roster] Officer not found in roster: ${name}`);
    return null;
  } catch (error) {
    console.error('[Roster] Error searching roster:', error);
    return null;
  }
}

/**
 * Add or update an officer in the roster
 */
export async function addOfficerToRoster(officer: Omit<OfficerRecord, 'id' | 'addedAt'>): Promise<void> {
  try {
    // Validate required fields before persisting
    if (!officer.name || !officer.city || !officer.state) {
      console.warn('[Roster] Skipping incomplete officer record - missing name, city, or state:', {
        name: officer.name,
        city: officer.city,
        state: officer.state
      });
      return;
    }

    const content = await fs.readFile(OFFICERS_CSV, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as OfficerRecord[];

    // Generate ID from name + city + state
    const id = `${officer.name}_${officer.city}_${officer.state}`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    // Check if officer already exists
    const existingIndex = records.findIndex(r => r.id === id);
    
    const newRecord: OfficerRecord = {
      id,
      name: officer.name,
      city: officer.city,
      state: officer.state,
      badgeNumber: officer.badgeNumber || '',
      department: officer.department || '',
      addedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = newRecord;
      console.log(`[Roster] Updated officer: ${officer.name}`);
    } else {
      // Add new record
      records.push(newRecord);
      console.log(`[Roster] Added new officer: ${officer.name}`);
    }

    // Write back to CSV
    const csv = stringify(records, {
      header: true,
      columns: ['id', 'name', 'city', 'state', 'badgeNumber', 'department', 'addedAt'],
    });
    await fs.writeFile(OFFICERS_CSV, csv, 'utf-8');
  } catch (error) {
    console.error('[Roster] Error adding officer to roster:', error);
  }
}

/**
 * Find department by city and state
 */
export async function findDepartmentInRoster(city: string, state: string): Promise<DepartmentRecord | null> {
  try {
    const content = await fs.readFile(DEPARTMENTS_CSV, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as DepartmentRecord[];

    const normalizedCity = city.toLowerCase().trim();
    const normalizedState = state.toLowerCase().trim();

    const found = records.find(r => {
      // Null-safe comparison
      const recordCity = (r.city ?? '').toLowerCase().trim();
      const recordState = (r.state ?? '').toLowerCase().trim();
      return recordCity === normalizedCity && recordState === normalizedState;
    });

    if (found) {
      console.log(`[Roster] Found department: ${found.department} (${found.city}, ${found.state})`);
      return found;
    }

    return null;
  } catch (error) {
    console.error('[Roster] Error searching departments:', error);
    return null;
  }
}

/**
 * Add or update a department in the roster
 */
export async function addDepartmentToRoster(department: DepartmentRecord): Promise<void> {
  try {
    // Validate required fields before persisting
    if (!department.state || !department.city || !department.department) {
      console.warn('[Roster] Skipping incomplete department record - missing state, city, or department:', {
        state: department.state,
        city: department.city,
        department: department.department
      });
      return;
    }

    const content = await fs.readFile(DEPARTMENTS_CSV, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as DepartmentRecord[];

    const normalizedCity = department.city.toLowerCase().trim();
    const normalizedState = department.state.toLowerCase().trim();

    // Check if department already exists (null-safe)
    const existingIndex = records.findIndex(r => {
      const recordCity = (r.city ?? '').toLowerCase().trim();
      const recordState = (r.state ?? '').toLowerCase().trim();
      return recordCity === normalizedCity && recordState === normalizedState;
    });

    const newRecord: DepartmentRecord = {
      state: department.state,
      city: department.city,
      department: department.department,
      url: department.url || '',
      addedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = newRecord;
      console.log(`[Roster] Updated department: ${department.department}`);
    } else {
      // Add new record
      records.push(newRecord);
      console.log(`[Roster] Added new department: ${department.department}`);
    }

    // Write back to CSV
    const csv = stringify(records, {
      header: true,
      columns: ['state', 'city', 'department', 'url', 'addedAt'],
    });
    await fs.writeFile(DEPARTMENTS_CSV, csv, 'utf-8');
  } catch (error) {
    console.error('[Roster] Error adding department to roster:', error);
  }
}

/**
 * Get all departments for a specific state
 */
export async function getDepartmentsByState(state: string): Promise<DepartmentRecord[]> {
  try {
    const content = await fs.readFile(DEPARTMENTS_CSV, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as DepartmentRecord[];

    const normalizedState = state.toLowerCase().trim();
    return records.filter(r => {
      const recordState = (r.state ?? '').toLowerCase().trim();
      return recordState === normalizedState;
    });
  } catch (error) {
    console.error('[Roster] Error getting departments by state:', error);
    return [];
  }
}

// Initialize roster on module load
initializeRoster().catch(console.error);

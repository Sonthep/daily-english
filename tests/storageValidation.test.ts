import { describe, it, expect } from 'vitest';
import { StorageService } from '../src/lib/storage/repositories';
import { SEED_RESOURCES } from '../src/data/seedResources';

const makeValidExport = () => ({
  schemaVersion: 1,
  exportedAt: '2026-09-14T10:00:00.000Z',
  profile: {
    id: 'default-user',
    displayName: 'ผู้เรียน',
    goals: ['work'],
    dailyMinutes: 5,
    confidence: 'intermediate',
    timezone: 'Asia/Bangkok',
    onboardingCompleted: true,
    createdAt: '2026-09-14T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
  },
  sessions: [],
  phrases: [],
  reviewEvents: [],
});

describe('Storage & Import Validation', () => {
  const service = new StorageService();

  it('validates and accepts a correct database export payload', () => {
    const validPayload = {
      schemaVersion: 1,
      exportedAt: '2026-09-14T10:00:00.000Z',
      profile: {
        id: 'default-user',
        displayName: 'ปุ๊ก',
        goals: ['work'],
        dailyMinutes: 5,
        confidence: 'intermediate',
        timezone: 'Asia/Bangkok',
        onboardingCompleted: true,
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
      },
      sessions: [],
      phrases: [],
      reviewEvents: [],
    };

    const res = service.validateImportData(JSON.stringify(validPayload));
    expect(res.valid).toBe(true);
    expect(res.data?.profile.displayName).toBe('ปุ๊ก');
  });

  it('rejects malformed JSON strings', () => {
    const res = service.validateImportData('{ invalid json');
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('rejects payloads missing schemaVersion', () => {
    const invalid = {
      exportedAt: '2026-09-14T10:00:00.000Z',
      profile: { id: '1', displayName: 'Pook' },
      sessions: [],
      phrases: [],
      reviewEvents: [],
    };
    const res = service.validateImportData(JSON.stringify(invalid));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('schemaVersion');
  });

  it('rejects payloads missing valid profile displayName', () => {
    const invalid = {
      schemaVersion: 1,
      exportedAt: '2026-09-14T10:00:00.000Z',
      profile: { id: '1' }, // missing displayName
      sessions: [],
      phrases: [],
      reviewEvents: [],
    };
    const res = service.validateImportData(JSON.stringify(invalid));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Profile');
  });

  it('rejects payloads where sessions or phrases are not arrays', () => {
    const invalid = {
      schemaVersion: 1,
      exportedAt: '2026-09-14T10:00:00.000Z',
      profile: {
        id: 'default-user',
        displayName: 'Pook',
        goals: ['work'],
        dailyMinutes: 5,
        confidence: 'intermediate',
        timezone: 'Asia/Bangkok',
        onboardingCompleted: true,
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
      },
      sessions: 'not an array',
      phrases: [],
      reviewEvents: [],
    };
    const res = service.validateImportData(JSON.stringify(invalid));
    expect(res.valid).toBe(false);
    expect(res.error).toContain('sessions');
  });

  it('rejects unsupported schema versions', () => {
    const payload = { ...makeValidExport(), schemaVersion: 3 };
    const res = service.validateImportData(JSON.stringify(payload));

    expect(res.valid).toBe(false);
    expect(res.error).toContain('schemaVersion');
  });

  it('rejects profiles with an invalid IANA timezone', () => {
    const payload = {
      ...makeValidExport(),
      profile: { ...makeValidExport().profile, timezone: 'Not/A-Timezone' },
    };
    const res = service.validateImportData(JSON.stringify(payload));

    expect(res.valid).toBe(false);
    expect(res.error).toContain('Profile');
  });

  it('accepts v2 exports containing the app seed resources', () => {
    const payload = {
      ...makeValidExport(),
      schemaVersion: 2,
      resources: SEED_RESOURCES,
      customLessons: [],
    };
    const res = service.validateImportData(JSON.stringify(payload));

    expect(res.valid).toBe(true);
  });

  it('rejects malformed records inside collections', () => {
    const payload = { ...makeValidExport(), sessions: [{ id: 'incomplete-session' }] };
    const res = service.validateImportData(JSON.stringify(payload));

    expect(res.valid).toBe(false);
    expect(res.error).toContain('sessions');
  });

  it('rejects invalid data before opening IndexedDB for import', async () => {
    const payload = { ...makeValidExport(), phrases: [{ id: 'incomplete-phrase' }] };

    await expect(service.importDatabase(payload as never)).rejects.toThrow('phrases');
  });
});

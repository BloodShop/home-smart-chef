import Constants from 'expo-constants';
import { getSeedRecipePack } from '../data/recipes';
import {
  ContentManifest,
  ContentSyncState,
  Recipe,
  RecipePack,
} from '../types';
import {
  loadCachedRecipePacks,
  loadContentSyncState,
  saveCachedRecipePacks,
  saveContentSyncState,
} from '../utils/storage';

const MIN_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

function getConfigValue(key: string): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const envValue = process.env[key];
  const extraValue = extra[key] ?? extra[key.toLowerCase()];
  return (envValue || extraValue || '').toString().trim();
}

export function getContentBaseUrl(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const configured = getConfigValue('EXPO_PUBLIC_CONTENT_BASE_URL')
    || (extra.contentBaseUrl ? String(extra.contentBaseUrl).trim() : '');
  if (!configured) return null;
  return configured.replace(/\/+$/, '');
}

function mergeRecipesFromPacks(packs: RecipePack[]): Recipe[] {
  const byId = new Map<string, Recipe>();
  for (const pack of packs) {
    for (const recipe of pack.recipes) {
      byId.set(recipe.id, recipe);
    }
  }
  return Array.from(byId.values());
}

function mergePacks(seedPack: RecipePack, cachedPacks: RecipePack[]): RecipePack[] {
  const byId = new Map<string, RecipePack>();
  byId.set(seedPack.id, seedPack);
  for (const pack of cachedPacks) {
    byId.set(pack.id, pack);
  }
  return Array.from(byId.values());
}

function resolvePackUrl(baseUrl: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl}/${url.replace(/^\/+/, '')}`;
}

function shouldSync(state: ContentSyncState, force: boolean): boolean {
  if (force) return true;
  if (!state.lastSuccessfulSyncAt) return true;
  const lastSyncTime = Date.parse(state.lastSuccessfulSyncAt);
  if (Number.isNaN(lastSyncTime)) return true;
  return Date.now() - lastSyncTime > MIN_SYNC_INTERVAL_MS;
}

export async function loadRecipeCatalogFromStorage(): Promise<{
  recipes: Recipe[];
  packs: RecipePack[];
  syncState: ContentSyncState;
}> {
  const seedPack = getSeedRecipePack();
  const [cachedPacks, syncState] = await Promise.all([
    loadCachedRecipePacks(),
    loadContentSyncState(),
  ]);

  const packs = cachedPacks.length > 0
    ? mergePacks(seedPack, cachedPacks)
    : [seedPack];
  const source = cachedPacks.length > 0
    ? (syncState.source === 'remote' ? 'remote' : 'cache')
    : 'bundled';

  return {
    recipes: mergeRecipesFromPacks(packs),
    packs,
    syncState: {
      ...syncState,
      source,
      catalogVersion: syncState.catalogVersion || seedPack.version,
      packIds: syncState.packIds.length ? syncState.packIds : packs.map((pack) => pack.id),
    },
  };
}

export async function syncRemoteContent(options?: {
  force?: boolean;
}): Promise<{
  recipes: Recipe[];
  packs: RecipePack[];
  syncState: ContentSyncState;
}> {
  const force = options?.force ?? false;
  const baseUrl = getContentBaseUrl();
  const seedPack = getSeedRecipePack();

  if (!baseUrl) {
    return loadRecipeCatalogFromStorage();
  }

  const currentState = await loadContentSyncState();
  if (!shouldSync(currentState, force)) {
    return loadRecipeCatalogFromStorage();
  }

  try {
    const manifestResponse = await fetch(`${baseUrl}/manifest.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!manifestResponse.ok) {
      throw new Error(`Manifest request failed: ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json() as ContentManifest;
    const remotePacks = await Promise.all(
      manifest.packs.map(async (packRef) => {
        const packResponse = await fetch(resolvePackUrl(baseUrl, packRef.url), {
          headers: { Accept: 'application/json' },
        });
        if (!packResponse.ok) {
          throw new Error(`Pack request failed: ${packResponse.status}`);
        }
        return await packResponse.json() as RecipePack;
      })
    );

    await saveCachedRecipePacks(remotePacks);
    const syncState: ContentSyncState = {
      catalogVersion: manifest.version,
      source: 'remote',
      lastSuccessfulSyncAt: new Date().toISOString(),
      packIds: remotePacks.map((pack) => pack.id),
    };
    await saveContentSyncState(syncState);

    const packs = mergePacks(seedPack, remotePacks);
    return {
      recipes: mergeRecipesFromPacks(packs),
      packs,
      syncState,
    };
  } catch {
    return loadRecipeCatalogFromStorage();
  }
}

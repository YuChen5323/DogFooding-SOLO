import { openDB, IDBPDatabase } from 'idb';
import { PersonalNote, IngredientAdjustment, Recipe } from '@/types';

const DB_NAME = 'CookAlongDB';
const DB_VERSION = 1;

export interface CookAlongDB extends IDBPDatabase {
  getFromIndex: (storeName: string, indexName: string, key: any) => Promise<any>;
  getAllFromIndex: (storeName: string, indexName: string, key?: any) => Promise<any[]>;
}

let dbInstance: CookAlongDB | null = null;

export async function getDB(): Promise<CookAlongDB> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('recipeId', 'recipeId', { unique: false });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('adjustments')) {
        const adjustmentsStore = db.createObjectStore('adjustments', { keyPath: 'id' });
        adjustmentsStore.createIndex('recipeId', 'recipeId', { unique: false });
        adjustmentsStore.createIndex('ingredientId', 'ingredientId', { unique: false });
      }

      if (!db.objectStoreNames.contains('cachedRecipes')) {
        const cachedRecipesStore = db.createObjectStore('cachedRecipes', { keyPath: 'recipe.id' });
        cachedRecipesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('viewedRecipes')) {
        const viewedStore = db.createObjectStore('viewedRecipes', { keyPath: 'recipeId' });
        viewedStore.createIndex('viewedAt', 'viewedAt', { unique: false });
      }
    },
  });

  dbInstance = db as CookAlongDB;
  return dbInstance;
}

export async function addNote(note: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonalNote> {
  const db = await getDB();
  const now = Date.now();
  const newNote: PersonalNote = {
    ...note,
    id: `note-${now}`,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.add('notes', newNote);
  return newNote;
}

export async function updateNote(note: Partial<PersonalNote> & Pick<PersonalNote, 'id'>): Promise<PersonalNote | undefined> {
  const db = await getDB();
  const existingNote = await db.get('notes', note.id);
  
  if (!existingNote) {
    return undefined;
  }
  
  const updatedNote: PersonalNote = {
    ...existingNote,
    ...note,
    updatedAt: Date.now(),
  };
  
  await db.put('notes', updatedNote);
  return updatedNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', noteId);
}

export async function getNotesByRecipe(recipeId: string): Promise<PersonalNote[]> {
  const db = await getDB();
  const index = db.transaction('notes').store.index('recipeId');
  return index.getAll(IDBKeyRange.only(recipeId));
}

export async function getAllNotes(): Promise<PersonalNote[]> {
  const db = await getDB();
  return db.getAll('notes');
}

export async function addAdjustment(adjustment: Omit<IngredientAdjustment, 'id'>): Promise<IngredientAdjustment> {
  const db = await getDB();
  const newAdjustment: IngredientAdjustment = {
    ...adjustment,
    id: `adj-${Date.now()}`,
  };
  
  await db.put('adjustments', newAdjustment);
  return newAdjustment;
}

export async function getAdjustmentsByRecipe(recipeId: string): Promise<IngredientAdjustment[]> {
  const db = await getDB();
  const index = db.transaction('adjustments').store.index('recipeId');
  return index.getAll(IDBKeyRange.only(recipeId));
}

export async function deleteAdjustment(adjustmentId: string): Promise<void> {
  const db = await getDB();
  await db.delete('adjustments', adjustmentId);
}

export async function cacheRecipe(recipe: Recipe): Promise<void> {
  const db = await getDB();
  const cachedRecipe = {
    recipe,
    cachedAt: Date.now(),
  };
  await db.put('cachedRecipes', cachedRecipe);
}

export async function getCachedRecipe(recipeId: string): Promise<Recipe | undefined> {
  const db = await getDB();
  const cached = await db.get('cachedRecipes', recipeId);
  return cached?.recipe;
}

export async function getAllCachedRecipes(): Promise<Recipe[]> {
  const db = await getDB();
  const cached = await db.getAll('cachedRecipes');
  return cached.map(c => c.recipe);
}

export async function markRecipeViewed(recipeId: string): Promise<void> {
  const db = await getDB();
  const viewed = {
    recipeId,
    viewedAt: Date.now(),
  };
  await db.put('viewedRecipes', viewed);
}

export async function getViewedRecipes(): Promise<string[]> {
  const db = await getDB();
  const viewed = await db.getAll('viewedRecipes');
  return viewed.sort((a, b) => b.viewedAt - a.viewedAt).map(v => v.recipeId);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['notes', 'adjustments', 'cachedRecipes', 'viewedRecipes'], 'readwrite');
  await Promise.all([
    tx.store.clear(),
    tx.objectStore('adjustments').clear(),
    tx.objectStore('cachedRecipes').clear(),
    tx.objectStore('viewedRecipes').clear(),
  ]);
  await tx.done;
}

export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

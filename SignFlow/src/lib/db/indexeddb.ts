import { openDB, type IDBPDatabase } from 'idb'
import type { SignWord, PracticeProgress } from '../types'

const DB_NAME = 'SignFlowDB'
const DB_VERSION = 1

const STORES = {
  DICTIONARY: 'dictionary',
  PROGRESS: 'progress',
  SETTINGS: 'settings',
  CACHE: 'cache'
} as const

interface DBSchema {
  dictionary: SignWord
  progress: PracticeProgress
  settings: { id: string; key: string; value: any }
  cache: { id: string; key: string; value: any; expiresAt: number }
}

let db: IDBPDatabase<DBSchema> | null = null

export async function initDB(): Promise<IDBPDatabase<DBSchema>> {
  if (db) return db
  
  db = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`)
      
      if (!db.objectStoreNames.contains(STORES.DICTIONARY)) {
        const dictStore = db.createObjectStore(STORES.DICTIONARY, { keyPath: 'id' })
        dictStore.createIndex('word', 'word', { unique: false })
        dictStore.createIndex('pinyin', 'pinyin', { unique: false })
        dictStore.createIndex('category', 'category', { unique: false })
        dictStore.createIndex('difficulty', 'difficulty', { unique: false })
        dictStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
      }
      
      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PROGRESS, { keyPath: 'wordId' })
        progressStore.createIndex('nextReview', 'nextReview', { unique: false })
        progressStore.createIndex('lastPractice', 'lastPractice', { unique: false })
        progressStore.createIndex('streak', 'streak', { unique: false })
      }
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' })
      }
      
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'id' })
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false })
      }
    }
  })
  
  await seedDictionary()
  
  return db
}

async function seedDictionary(): Promise<void> {
  const database = await initDB()
  const count = await database.count(STORES.DICTIONARY)
  
  if (count > 0) {
    console.log('Dictionary already seeded')
    return
  }
  
  const sampleWords: SignWord[] = [
    {
      id: '1',
      word: '你好',
      pinyin: 'nǐ hǎo',
      description: '伸出右手，掌心向外，轻轻挥动，表示打招呼或问候。',
      category: '问候',
      difficulty: 'beginner',
      tags: ['基础', '问候', '日常'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '2',
      word: '谢谢',
      pinyin: 'xiè xiè',
      description: '伸出拇指，从下巴向外划动，表示感谢。',
      category: '礼貌',
      difficulty: 'beginner',
      tags: ['基础', '礼貌', '感谢'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '3',
      word: '对不起',
      pinyin: 'duì bù qǐ',
      description: '右手握拳，拇指放在食指上，轻轻点头。',
      category: '礼貌',
      difficulty: 'beginner',
      tags: ['基础', '礼貌', '道歉'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '4',
      word: '请',
      pinyin: 'qǐng',
      description: '右手掌心向上，向前伸出，表示邀请或请求。',
      category: '礼貌',
      difficulty: 'beginner',
      tags: ['基础', '礼貌', '请求'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '5',
      word: '再见',
      pinyin: 'zài jiàn',
      description: '右手掌心向外，手指自然弯曲，轻轻挥动。',
      category: '问候',
      difficulty: 'beginner',
      tags: ['基础', '问候', '告别'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '6',
      word: '我',
      pinyin: 'wǒ',
      description: '右手指向自己的胸口，表示自己。',
      category: '代词',
      difficulty: 'beginner',
      tags: ['基础', '代词', '人称'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '7',
      word: '你',
      pinyin: 'nǐ',
      description: '右手指向对方，表示第二人称。',
      category: '代词',
      difficulty: 'beginner',
      tags: ['基础', '代词', '人称'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '8',
      word: '爱',
      pinyin: 'ài',
      description: '双手握拳，拇指伸出，在胸前交叉。',
      category: '情感',
      difficulty: 'intermediate',
      tags: ['情感', '表达'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '9',
      word: '喜欢',
      pinyin: 'xǐ huān',
      description: '双手拇指伸出，在胸前轻轻抚摸表示喜欢。',
      category: '情感',
      difficulty: 'intermediate',
      tags: ['情感', '表达'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '10',
      word: '帮助',
      pinyin: 'bāng zhù',
      description: '右手握住左手手腕，向前伸出，表示帮助。',
      category: '动作',
      difficulty: 'intermediate',
      tags: ['动作', '动词'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '11',
      word: '学习',
      pinyin: 'xué xí',
      description: '双手手掌相对，在额头前方翻动，表示看书学习。',
      category: '动作',
      difficulty: 'intermediate',
      tags: ['动作', '动词', '教育'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '12',
      word: '工作',
      pinyin: 'gōng zuò',
      description: '双手握拳，一上一下，像锤子敲击的动作。',
      category: '动作',
      difficulty: 'intermediate',
      tags: ['动作', '动词', '职业'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '13',
      word: '吃饭',
      pinyin: 'chī fàn',
      description: '右手弯曲，像拿筷子往嘴里送的动作。',
      category: '生活',
      difficulty: 'beginner',
      tags: ['生活', '饮食', '动词'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '14',
      word: '喝水',
      pinyin: 'hē shuǐ',
      description: '右手像拿杯子往嘴边倾斜。',
      category: '生活',
      difficulty: 'beginner',
      tags: ['生活', '饮食', '动词'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '15',
      word: '今天',
      pinyin: 'jīn tiān',
      description: '右手伸出食指，指向面前，表示当前一天。',
      category: '时间',
      difficulty: 'beginner',
      tags: ['时间', '日期'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '16',
      word: '明天',
      pinyin: 'míng tiān',
      description: '右手伸向身体右侧，表示未来的一天。',
      category: '时间',
      difficulty: 'beginner',
      tags: ['时间', '日期'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '17',
      word: '昨天',
      pinyin: 'zuó tiān',
      description: '右手伸向身体左侧，表示过去的一天。',
      category: '时间',
      difficulty: 'beginner',
      tags: ['时间', '日期'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '18',
      word: '家',
      pinyin: 'jiā',
      description: '双手手掌呈屋顶形状，在胸前合拢。',
      category: '地点',
      difficulty: 'beginner',
      tags: ['地点', '名词', '居住'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '19',
      word: '学校',
      pinyin: 'xué xiào',
      description: '双手手掌相对，像翻开的书放在面前。',
      category: '地点',
      difficulty: 'intermediate',
      tags: ['地点', '名词', '教育'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: '20',
      word: '医院',
      pinyin: 'yī yuàn',
      description: '右手食指和中指伸出，放在胸口，表示医疗。',
      category: '地点',
      difficulty: 'intermediate',
      tags: ['地点', '名词', '医疗'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]
  
  const tx = database.transaction(STORES.DICTIONARY, 'readwrite')
  for (const word of sampleWords) {
    await tx.store.put(word)
  }
  await tx.done
  
  console.log('Dictionary seeded with', sampleWords.length, 'words')
}

export async function getDictionaryWords(options?: {
  category?: string
  difficulty?: SignWord['difficulty']
  search?: string
  limit?: number
  offset?: number
}): Promise<SignWord[]> {
  const database = await initDB()
  const tx = database.transaction(STORES.DICTIONARY, 'readonly')
  let words = await tx.store.getAll()
  
  if (options?.category) {
    words = words.filter(w => w.category === options.category)
  }
  
  if (options?.difficulty) {
    words = words.filter(w => w.difficulty === options.difficulty)
  }
  
  if (options?.search) {
    const searchLower = options.search.toLowerCase()
    words = words.filter(w => 
      w.word.includes(options.search) ||
      w.pinyin.toLowerCase().includes(searchLower) ||
      w.description.includes(options.search) ||
      w.tags.some(t => t.toLowerCase().includes(searchLower))
    )
  }
  
  if (options?.offset) {
    words = words.slice(options.offset)
  }
  
  if (options?.limit) {
    words = words.slice(0, options.limit)
  }
  
  return words
}

export async function getWordById(id: string): Promise<SignWord | undefined> {
  const database = await initDB()
  return database.get(STORES.DICTIONARY, id)
}

export async function getWordByWord(word: string): Promise<SignWord | undefined> {
  const database = await initDB()
  const index = database.transaction(STORES.DICTIONARY).store.index('word')
  const results = await index.getAll(word)
  return results[0]
}

export async function saveWord(word: SignWord): Promise<string> {
  const database = await initDB()
  word.updatedAt = Date.now()
  const id = await database.put(STORES.DICTIONARY, word)
  return id as string
}

export async function deleteWord(id: string): Promise<void> {
  const database = await initDB()
  await database.delete(STORES.DICTIONARY, id)
}

export async function getCategories(): Promise<string[]> {
  const database = await initDB()
  const words = await database.getAll(STORES.DICTIONARY)
  const categories = new Set(words.map(w => w.category))
  return Array.from(categories)
}

export async function getProgress(wordId: string): Promise<PracticeProgress | undefined> {
  const database = await initDB()
  return database.get(STORES.PROGRESS, wordId)
}

export async function getAllProgress(): Promise<PracticeProgress[]> {
  const database = await initDB()
  return database.getAll(STORES.PROGRESS)
}

export async function getDueProgress(): Promise<PracticeProgress[]> {
  const database = await initDB()
  const index = database.transaction(STORES.PROGRESS).store.index('nextReview')
  const now = Date.now()
  return index.getAll(IDBKeyRange.upperBound(now))
}

export async function saveProgress(progress: PracticeProgress): Promise<string> {
  const database = await initDB()
  const id = await database.put(STORES.PROGRESS, progress)
  return id as string
}

export async function updateProgressAfterPractice(
  wordId: string,
  correct: boolean,
  confidence: number,
  feedback: string = ''
): Promise<PracticeProgress> {
  let progress = await getProgress(wordId)
  
  if (!progress) {
    const word = await getWordById(wordId)
    progress = {
      wordId,
      word: word?.word || '',
      streak: 0,
      correctCount: 0,
      incorrectCount: 0,
      lastPractice: 0,
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      performanceHistory: []
    }
  }
  
  const now = Date.now()
  
  if (correct) {
    progress.streak++
    progress.correctCount++
    
    if (progress.streak === 1) {
      progress.interval = 1
    } else if (progress.streak === 2) {
      progress.interval = 6
    } else {
      progress.interval = Math.round(progress.interval * progress.easeFactor)
    }
    
    progress.easeFactor = Math.max(1.3, progress.easeFactor + (0.1 - (5 - Math.min(5, Math.round(confidence * 5))) * (0.08 + (5 - Math.min(5, Math.round(confidence * 5))) * 0.02)))
  } else {
    progress.streak = 0
    progress.incorrectCount++
    progress.interval = 1
    progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.2)
  }
  
  progress.lastPractice = now
  progress.nextReview = now + progress.interval * 24 * 60 * 60 * 1000
  
  progress.performanceHistory.push({
    timestamp: now,
    correct,
    confidence,
    feedback
  })
  
  if (progress.performanceHistory.length > 100) {
    progress.performanceHistory = progress.performanceHistory.slice(-100)
  }
  
  await saveProgress(progress)
  
  return progress
}

export async function clearProgress(wordId?: string): Promise<void> {
  const database = await initDB()
  
  if (wordId) {
    await database.delete(STORES.PROGRESS, wordId)
  } else {
    const tx = database.transaction(STORES.PROGRESS, 'readwrite')
    const keys = await tx.store.getAllKeys()
    for (const key of keys) {
      await tx.store.delete(key)
    }
    await tx.done
  }
}

export async function getStats(): Promise<{
  totalWords: number
  learnedWords: number
  dueToday: number
  streakDays: number
  accuracy: number
}> {
  const database = await initDB()
  const totalWords = await database.count(STORES.DICTIONARY)
  const progressList = await getAllProgress()
  
  let learnedWords = 0
  let correctTotal = 0
  let incorrectTotal = 0
  let dueToday = 0
  let streakDays = 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()
  
  for (const progress of progressList) {
    if (progress.streak > 0) {
      learnedWords++
    }
    
    correctTotal += progress.correctCount
    incorrectTotal += progress.incorrectCount
    
    const nextReviewDate = new Date(progress.nextReview)
    nextReviewDate.setHours(0, 0, 0, 0)
    
    if (nextReviewDate.getTime() <= todayStart) {
      dueToday++
    }
  }
  
  const accuracy = correctTotal + incorrectTotal > 0
    ? Math.round((correctTotal / (correctTotal + incorrectTotal)) * 100)
    : 0
  
  return {
    totalWords,
    learnedWords,
    dueToday,
    streakDays,
    accuracy
  }
}

export async function closeDB(): Promise<void> {
  if (db) {
    db.close()
    db = null
  }
}

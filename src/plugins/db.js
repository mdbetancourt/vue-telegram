import { openDB } from 'idb'

/**
 * @typedef {import('idb').IDBPDatabase} IDBPDatabase
 * @type {IDBPDatabase | null} db
 */
let db = null

export async function init() {
  db = await openDB('tdlib', 2, {
    blocked() {
      console.warn('isblocked')
    },
    blocking() {
      console.warn('blocking')
    }
  })
  if (process.env.NODE_ENV !== 'production') window.db = db
  return db
}

export async function getObject(obj) {
  if (!db) {
    db = await init()
  }
  const obSt = await db
    .transaction('keyvaluepairs')
    .objectStore('keyvaluepairs')
  return obSt.get(obj)
}

export { db }

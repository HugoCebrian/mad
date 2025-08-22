import Database from "./thesqlsheet/db"

const db = new Database({
  db: process.env.GOOGLE_SHEET_ID,
  table: 'Posts', // optional, default = Sheet1
  clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  cacheTimeoutMs: 5000, // optional, default = 5000
})

function extractId(url) {
  if (/^\d{8,}$/.test(url)) return url
  const id = url.match(/status\/(\d+)/i)
  return id ? id[1] : null
}

export async function postIds() {
  await db.load()
  const posts = await db.column('thread')

  //console.log(posts)

  const ids = []
  for (const post of posts) {
    const id = extractId(post)
    //console.log(id)
    ids.push(id)
  }
  return ids
}

// GET POSTS
// EXTRACT IDS
// RUN THROUGH API 
// MAP RESULTS
// PASS TO FRONT END
import Database from "./thesqlsheet/db"
import { syncPostData } from "./twitter"
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

const postCols = ['tweet', 'thread']
const idCols = ['tweet_id', 'thread_id']
const dataCols = ['tweet_data', 'thread_data']

const db = new Database({
  db: process.env.GOOGLE_SHEET_ID,
  table: 'Posts', // optional, default = Sheet1
  clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  cacheTimeoutMs: 5000, // optional, default = 5000
})

export async function extractIds() {
  await db.load()
  const con = mongoose.connect(MONGODB_URI)
  const newIds = []

  for (const col of postCols) {
    const urls = await db.column(col)

    for (const url of urls) {
      const id = extractId(url)
      await db.updateOne({ [col]: url }, { [`${col}_id`]: id })
      newIds.push(id)
    } 
  }
}

export async function getIds() {
  await db.load()

  const storedIds = await Promise.all(idCols.map(col => db.column(col)))

  return storedIds
}

export async function storeData(post, post_id, post_data) {
  await db.load()

  if(post) {
    await db.updateOne({ tweet_id : post_id }, { post_data: post_data })
    return 'done'
  }
  await db.updateOne({ thread_id : post_id }, { thread_data: post_data })

  return Response.json( {message: 'works '}, { status: 200 });
}

export async function editLike(id, isThread) {
  await db.load()

  let liked = null

  if(isThread) {
    liked = await db.findOne({ thread_id: id })
    const likeStatus = (liked.thread_like === 'TRUE')
    await db.updateOne({ thread_id: id }, { thread_like: likeStatus ? 'FALSE' : 'TRUE' })
    return console.log('Done Thread')
  }
  liked = await db.findOne({ tweet_id: id })
  const likeStatus = (liked.post_like === 'TRUE')
  await db.updateOne({ tweet_id: id }, { post_like: likeStatus ? 'FALSE' : 'TRUE' })

  return console.log('Done Post')
}

export async function getPostsData() {
  await db.load()

  const posts = await db.find({})

  if(posts[0].post_data === '') {
    await syncPostData()
    console.log('triggered')
  }

  const parsedPosts = posts.map((post) => {
    const obj = JSON.parse(post.post_data)
    obj.like = post.post_like
    return obj
  })

  const parsedThreads = posts.map((post) => {
    const obj = JSON.parse(post.thread_data)
    obj.like = post.thread_like
    return obj
  })


  //console.log(parsedPosts)

  // const parsedThreads = posts.thread_data.map(post => JSON.parse(post))


  //const posts = await db.column('post_data')
  //const posts_like = await db.column('post_data')
  //const threads = await db.column('thread_data')

  //const postsFull = posts.map(post => post.push())
  
  //return [...posts, ...threads]
  return [...parsedPosts, ...parsedThreads]
}

export async function checkIds() {
  await db.load()

  const storedIds = await Promise.all(idCols.map(col => db.column(col)))

  const countIds = storedIds.flatMap(
    col => col
    .map(x => (x ?? '').toString().trim())
    .filter(x => x.length > 0)
  )

  const storedUrls = await Promise.all(postCols.map(col => db.column(col)))

  const countUrls = storedUrls.flatMap(
    col => col
    .map(x => (x ?? '').toString().trim())
    .filter(x => x.length > 0)
  )

  return countIds.length === countUrls.length
}

export async function checkData() {
  const storedData = await Promise.all(dataCols.map(col => db.column(col)))
  const countData = storedData.flatMap(
    col => col
    .map(x => (x ?? '').toString().trim())
    .filter(x => x.length > 0)
  )
  const storedIds = await Promise.all(idCols.map(col => db.column(col)))
  const countIds = storedIds.flatMap(
    col => col
    .map(x => (x ?? '').toString().trim())
    .filter(x => x.length > 0)
  )
  return countIds.length === countData.length
}

function extractId(url) {
  if (/^\d{8,}$/.test(url)) return url
  const id = url.match(/status\/(\d+)/i)
  return id ? id[1] : null
}
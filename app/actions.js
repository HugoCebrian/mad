'use server'

import { checkData, checkIds, editLike, extractIds, getPostsData } from "@/lib/sheets"
import { syncPostData } from "@/lib/twitter"

export async function getPosts() {
  // Skip data fetching during build time to prevent SSL errors
  if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_PRIVATE_KEY) {
    console.log('Skipping data fetch during build - no credentials available')
    return []
  }

  try {
    //await extractIds()
    //await syncPostData()
    //const data = await checkData()
    //if(data > 0) return console.log('There`s data')

    const posts = await getPostsData()

    return posts
  } catch (error) {
    console.error('Error fetching posts:', error)
    // Return empty array during build to prevent build failure
    if (process.env.NODE_ENV === 'production') {
      return []
    }
    throw error
  }
}

export async function likePost(id, isThread) {
  editLike(id, isThread)
}

export async function syncPosts() {
  const storedIds = await checkIds()

  if(!storedIds){
    console.log('Couldn`t find IDs. Extracting...')
    await extractIds()
  }

  console.log('IDs in place. Pulling data...')
  await syncPostData()

  return Response.json('hey')
}
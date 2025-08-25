'use server'

import { editLike, extractIds, getPostsData } from "@/lib/sheets"
import { syncPostData } from "@/lib/twitter"

export async function getPosts() {



  await syncPostData()

  const posts = await getPostsData()

  return posts
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
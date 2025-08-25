'use client'

import { useState, useTransition } from "react"
import { getPosts, likePost, syncPosts } from "./actions"

export default function PostsGrid({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()

  const runSync = () => {
    startTransition(
      async () => {
        await syncPosts()
        await reload()
      }
    )
  }

  const like = async (id, isThread) => {
    await likePost(id, isThread)
    await reload()
  }

  const reload = async () => {
  const posts = await getPosts()
    setPosts(posts)
  }

  return (
    <div className="">
      <h1 className="">Submissions</h1>
      <button onClick={runSync} disabled={isPending} className="">
        {isPending ? 'Syncing' : 'Sync'}
      </button>
      <div>
        
        {posts.map(post => {
          return (
            <div className="grid gap-2 px-8" key={post.id}>
              <div className="flex justify-between">
                <h1 className="">{post.id}</h1>
                <button onClick={() => like(post.id, post.isThread)}>{post.like === 'TRUE' ? 'Liked' : 'Like'}</button>
                <p>{post.isThread ? "Thread" : ''}</p>
              </div>
              <div className="flex justify-between">
                <h1>Stats:</h1>
                <span>Likes: {post.stats.likes}</span>
                <span>RTs: {post.stats.retweets}</span>
                <span>Comments: {post.stats.replies}</span>
                <span>Views: {post.stats.views}</span>
              </div>
              <div className="">
                <p className="">
                  {post.text}
                </p>
                {post.media.videos.length > 0 
                  ? <video controls> <source src={post.media.videos[0].mp4} type="video/mp4"/></video>
                  : (
                    <img src={post.media.images[0]} alt="" />
                  )
                }
              </div>

              {post.thread.length > 0
                ? (post.thread.map(reply => {
                    return <div>{reply.text}There's a thread</div>
                  })
                )
                : <></>
              }

            </div>
          )
        })}
      </div>
    </div>
  )
}
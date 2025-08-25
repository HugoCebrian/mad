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
    <div className="grid gap-8">
      <h1 className="text-2xl font-bold pt-8 px-8">Ambassador Program Submissions</h1>
      <button onClick={runSync} disabled={isPending} className="hidden">
        {isPending ? 'Syncing' : 'Sync'}
      </button>
      <div>
        <div className="columns-3 gap-10 bg-[#171717] rounded-t-3xl p-8">
          {posts && posts.map(post => {
            return (

              <div key={post.id} className="break-inside-avoid h-auto grid place-content-start mb-4 gap-4 bg-[#262626] p-4 rounded-lg">
                <h1 className="font-bold">{post.user}</h1>
                <div className="flex justify-between text-sm items-center">
                  <p className={`border px-2 rounded-md ${post.isThread ? '' : 'hidden'}`}>{post.isThread ? "Thread" : ''}</p>
                  <div className="flex gap-2 text-center">
                    <div className="">
                      <p className="">Likes</p>
                      <p>{post.stats.likes}</p>
                    </div>
                    <div className="">
                      <p className="">RTs</p>
                      <p>{post.stats.retweets}</p>
                    </div>
                    <div className="">
                      <p className="">Replies</p>
                      <p>{post.stats.replies}</p>
                    </div>
                    <div className="">
                      <p className="">Views</p>
                      <p>{post.stats.views}</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button className={`font-bold p-2 rounded-md text-gray-600 border border-green-500 ${post.like === 'TRUE' ? 'bg-green-500' : 'text-green-500'}`} onClick={() => like(post.id, post.isThread)}>{post.like === 'TRUE' ? 'Liked' : 'Like'}</button>
                  </div>

                </div>
                <div className="border-2 border-gray-50/20 rounded-lg p-4 grid gap-2">
                  <p className="">
                    {post.text}
                  </p>
                  {post.media.videos.length > 0 
                    ? <video className="rounded-lg overflow-hidden" controls> <source src={post.media.videos[0].mp4} type="video/mp4"/></video>
                    : (
                      <img className="rounded-lg overflow-hidden" src={post.media.images[0]} alt="" />
                    )
                  }
                </div>

                {post.thread.length > 0
                  ? (post.thread.map(reply => {
                      return (
                        <div className="border-2 border-gray-50/20 rounded-lg p-4 grid gap-2" key={post.id}>
                          <p className="">{reply.text}</p>
                          <img src={reply.media.images[0]} alt="" />
                        </div>
                      )
                    })
                  )
                  : <></>
                }

              </div>
            
            )
          })}
        </div>
      </div>
    </div>
  )
}
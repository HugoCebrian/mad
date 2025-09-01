'use client'

import { useMemo, useState, useTransition } from 'react'
import { getPosts, likePost, syncPosts } from './actions'

const isLiked = (v) =>
  v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1'

export default function PostsGrid({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts || [])
  const [isPending, startTransition] = useTransition()

  // ---- Filters ----
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'post' | 'thread'
  const [likedOnly, setLikedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('none') // 'none' | 'views' | 'likes' | 'retweets' | 'replies'
  const [layoutType, setLayoutType] = useState('grid') // 'grid' | 'masonry'

  const filtered = useMemo(() => {
    return (posts || []).filter((p) => {
      if (typeFilter === 'post' && p.isThread) return false
      if (typeFilter === 'thread' && !p.isThread) return false
      if (likedOnly && !isLiked(p.like)) return false
      return true
    })
  }, [posts, typeFilter, likedOnly])

  const sorted = useMemo(() => {
    const out = [...filtered]
    const get = (p) => ({
      views: Number(p.stats?.views ?? 0),
      likes: Number(p.stats?.likes ?? 0),       // post likes
      retweets: Number(p.stats?.retweets ?? 0),
      replies: Number(p.stats?.replies ?? 0),
    })
    switch (sortBy) {
      case 'views':
        out.sort((a, b) => get(b).views - get(a).views)
        break
      case 'likes':
        out.sort((a, b) => get(b).likes - get(a).likes)
        break
      case 'retweets':
        out.sort((a, b) => get(b).retweets - get(a).retweets)
        break
      case 'replies':
        out.sort((a, b) => get(b).replies - get(a).replies)
        break
      case 'none':
      default:
        // keep original order
        break
    }
    return out
  }, [filtered, sortBy])

  // ---- Actions ----
  const runSync = () => {
    startTransition(async () => {
      await syncPosts()
      await reload()
    })
  }

  const like = async (id, isThread) => {
    // Optimistic update
    setPosts(prevPosts => {
      return prevPosts.map(post => {
        if ((post.id === id && !isThread) || (post.id === id && isThread && post.isThread)) {
          return {
            ...post,
            like: !isLiked(post.like) // Toggle like status
          };
        }
        return post;
      });
    });
    
    // Send request to server in background
    try {
      await likePost(id, isThread);
      // Sync with server after a short delay to ensure consistency
      setTimeout(async () => {
        await reload();
      }, 1000);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update if there's an error
      await reload();
    }
  }

  const reload = async () => {
    const next = await getPosts()
    setPosts(next || [])
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 rounded-b-3xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Ambassador Program</h1>
            <p className="text-blue-100 text-lg">Submissions Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
              <span className="text-sm font-medium">{sorted.length} posts</span>
            </div>
            <button 
              onClick={runSync} 
              disabled={isPending} 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
            >
              {isPending ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 sm:px-8 -mt-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl max-w-7xl mx-auto">
          <div className="space-y-4">
            {/* Type Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-white/80 whitespace-nowrap">Filter by Type</span>
              <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-sm overflow-x-auto">
                {[
                  { k: 'all', label: 'All', icon: '📋' },
                  { k: 'post', label: 'Posts', icon: '📝' },
                  { k: 'thread', label: 'Threads', icon: '🧵' },
                ].map(({ k, label, icon }) => (
                  <button
                    key={k}
                    onClick={() => setTypeFilter(k)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      typeFilter === k 
                        ? 'bg-white text-gray-900 shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-white/80 whitespace-nowrap">Sort by</span>
              <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-sm overflow-x-auto">
                {[
                  { k: 'none', label: 'Default', icon: '🔄' },
                  { k: 'views', label: 'Views', icon: '👁️' },
                  { k: 'likes', label: 'Likes', icon: '❤️' },
                  { k: 'retweets', label: 'RTs', icon: '🔁' },
                  { k: 'replies', label: 'Replies', icon: '💬' },
                ].map(({ k, label, icon }) => (
                  <button
                    key={k}
                    onClick={() => setSortBy(k)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      sortBy === k 
                        ? 'bg-white text-gray-900 shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{k === 'retweets' ? 'RT' : label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Row: Liked Toggle, Reset, Layout Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {/* Liked only */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={likedOnly}
                      onChange={(e) => setLikedOnly(e.target.checked)}
                    />
                    <div className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      likedOnly ? 'bg-red-500' : 'bg-white/20'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200 mt-0.5 ${
                        likedOnly ? 'translate-x-6 ml-1' : 'translate-x-1'
                      }`} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors whitespace-nowrap">❤️ Liked only</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                {/* Reset */}
                <button
                  onClick={() => {
                    setTypeFilter('all')
                    setLikedOnly(false)
                    setSortBy('none')
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                >
                  <span>🔄</span>
                  <span className="hidden sm:inline">Reset Filters</span>
                  <span className="sm:hidden">Reset</span>
                </button>
                
                {/* Layout Toggle */}
                <button
                  onClick={() => setLayoutType(layoutType === 'grid' ? 'masonry' : 'grid')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-all duration-200 font-medium text-sm whitespace-nowrap"
                >
                  <span>{layoutType === 'grid' ? '🧱' : '📐'}</span>
                  <span className="hidden sm:inline">{layoutType === 'grid' ? 'Masonry View' : 'Grid View'}</span>
                  <span className="sm:hidden">{layoutType === 'grid' ? 'Masonry' : 'Grid'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Layout */}
      <div className="px-4 sm:px-8">
        <div className={`${layoutType === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4'} gap-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-t-3xl p-6 sm:p-8 max-w-7xl mx-auto`}>
        {sorted.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
              <p className="text-gray-400">Try adjusting your filters to see more content</p>
            </div>
          </div>
        ) : (
          sorted.map((post) => (
            <div
              key={post.id}
              className={`${layoutType === 'grid' ? 'h-[600px] overflow-y-auto' : 'break-inside-avoid mb-8'} bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] hover:border-white/30`}
            >
              <div className="sticky top-0 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl pb-4 z-10 border-b border-white/20 shadow-lg rounded-t-xl -m-6 mb-4 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="font-bold text-xl text-white">{post.user}</h1>
                  {post.isThread && (
                    <span className="bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/50">
                      🧵 Thread
                    </span>
                  )}

                <button
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      isLiked(post.like) 
                        ? 'bg-green-500 text-white shadow-lg hover:bg-green-600' 
                        : 'bg-white/10 text-green-400 border border-green-500/50 hover:bg-green-500/20'
                    }`}
                    onClick={() => like(post.id, post.isThread)}
                  >
                    {isLiked(post.like) ? '✅ Liked' : '👍 Like'}
                  </button>
                </div>

                <div className="grid justify-between text-sm items-center gap-4">

                  <div className="flex gap-6 items-center text-center">
                    <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full">
                      <span className="text-red-400">❤️</span>
                      <span className="text-white font-medium">{post.stats?.likes ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                      <span className="text-green-400">🔁</span>
                      <span className="text-white font-medium">{post.stats?.retweets ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full">
                      <span className="text-blue-400">💬</span>
                      <span className="text-white font-medium">{post.stats?.replies ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-500/20 px-3 py-1 rounded-full">
                      <span className="text-gray-400">👁️</span>
                      <span className="text-white font-medium">{post.stats?.views ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3 mt-4">
                  {post.text && <p className="whitespace-pre-wrap text-white/90 leading-relaxed">{post.text}</p>}

                  {post?.media?.videos?.length > 0 
                  ? (
                    <video className="rounded-lg overflow-hidden w-full h-auto max-h-[200px] object-contain" controls>
                      <source src={`/api/proxy?url=${encodeURIComponent(post.media.videos[0]?.mp4)}`} type="video/mp4" />
                    </video>
                  ) : post?.media?.images?.length > 0 ? (
                    <img
                      className="rounded-lg overflow-hidden w-full h-auto max-h-[200px] object-contain"
                      src={`/api/proxy?url=${encodeURIComponent(post.media.images[0])}`}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        console.error('Image failed to load:', post.media.images[0]);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>

                {Array.isArray(post.thread) && post.thread.length > 0 ? (
                  <div className="mt-6 pl-6 border-l-2 border-gradient-to-b from-blue-400 to-purple-500">
                    <div className="flex items-center gap-3 mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl px-4 py-3 sticky top-[80px] z-10 border border-blue-500/30">
                      <span className="text-blue-400">💬</span>
                      <span className="font-semibold text-white">{post.thread.length} {post.thread.length === 1 ? 'Reply' : 'Replies'}</span>
                    </div>
                    
                    {post.thread.map((reply, index) => (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 mb-3 hover:bg-white/10 transition-all duration-200" key={reply.id}>
                        {reply.text && <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{reply.text}</p>}
                        {reply?.media?.images?.[0] && (
                          <img
                            className="rounded-lg overflow-hidden w-full h-auto max-h-[100px] object-contain"
                            src={`/api/proxy?url=${encodeURIComponent(reply.media.images[0])}`}
                            alt=""
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
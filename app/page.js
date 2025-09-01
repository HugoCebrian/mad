import { getPosts, toArray } from "./actions"
import PostsGrid from "./posts-grid"

export default async function Page() {
  const posts = await getPosts()
  return (
  
    <main className="">
      <PostsGrid initialPosts={posts} />
    </main>
  )
  
}




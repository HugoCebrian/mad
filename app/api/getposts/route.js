import { getPostsData } from "@/lib/sheets"



export async function GET() {

  const posts = await getPostsData()

  console.log(posts)

  return Response.json(posts)
}
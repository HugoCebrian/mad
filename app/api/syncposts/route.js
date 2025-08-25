import { checkIds, extractIds } from "@/lib/sheets";
import { syncPostData } from "@/lib/twitter";


export async function GET() {
  const storedIds = await checkIds()

  if(!storedIds){
    console.log('Couldn`t find IDs. Extracting...')
    await extractIds()
  }

  console.log('IDs in place. Pulling data...')
  await syncPostData()

  return Response.json('hey')
}
import Database from '@/lib/thesqlsheet/db'
import { postIds } from '@/lib/sheets'

const db = new Database({
  db: process.env.GOOGLE_SHEET_ID,
  table: 'Sheet1', // optional, default = Sheet1
  clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY,
  cacheTimeoutMs: 5000, // optional, default = 5000
})



export async function GET() {
  db.load()

  let posts = await postIds()


  let found = await db.findOneLike({ tweet: '1958471516258967653' })
  console.log(found)
  /*
  let docs = await db.insert([
    {
      name: 'test',
      age: 10,
    }
  ])


  await db.load();

  // 1) insert
  let docs = await db.insert([{ name: 'joway', age: 18 }]);
  console.log('Inserted:', docs);

  // 2) update
  docs = await db.update({ name: 'joway' }, { age: 100 });
  console.log('Updated:', docs);

  // 3) find one
  docs = await db.find({ name: 'joway' });
  console.log('Found:', docs);
  if (!docs.length || docs[0].age !== 100) {
    throw new Error('Find/Update failed');
  }

  // 4) find all
  const all = await db.find({});
  console.log('All docs:', all.length);

  // 5) remove
  const removed = await db.remove({ name: 'joway' });
  console.log('Removed:', removed);

  console.log('✅ Smoke test passed');


  console.log(all)
  */

  //console.log(posts)

  return Response.json({ res:'works?' })
}
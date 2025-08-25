import { checkData, extractIds, getPostsData, postIds, storeData } from '@/lib/sheets'
import { syncPostData } from '@/lib/twitter'

export async function GET() {

  //const data = await extractIds()

  const data = storeData(true, '1957676693512143223', 'hey')
  
  //const data = await getPostsData()

  //console.log(data[3].thread[0].text)

  /*
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

  return Response.json({ data })
}
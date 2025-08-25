import { checkData, getIds, storeData } from "@/lib/sheets"

const BASE = 'twitter-api45.p.rapidapi.com'
const HEADERS = {
  'x-rapidapi-key': process.env.RAPIDAPI_KEY,
  'x-rapidapi-host': BASE,
}

export async function syncPostData() {

  const postIds = await getIds()

  let tweetData = []

  const dataFound = checkData()

  if(!dataFound) {
    for (const id of postIds[0]) {
      const url = `https://${BASE}/tweet_thread.php?id=${encodeURIComponent(id)}`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
      if (!res.ok) return null;

      const data = await res.json()

      tweetData = extractForSheet(data)

      await storeData(true, id, JSON.stringify(tweetData))
    }

    for (const id of postIds[1]) {
      const url = `https://${BASE}/tweet_thread.php?id=${encodeURIComponent(id)}`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
      if (!res.ok) return null;

      const data = await res.json()

      tweetData = extractForSheet(data)

      await storeData(false, id, JSON.stringify(tweetData))
    }
    console.log('No data found. Pulling objects')
  }
  return 'Data stored'
}

function extractForSheet(root) {
  const toNum = (v) => (v == null ? 0 : Number(String(v).replace(/[^\d.-]/g, "")) || 0);

  const parseDate = (s) => {
    const d = s ? new Date(s) : null;
    return isNaN(d?.getTime?.()) ? 0 : d.getTime();
  };

  const collectMediaNodes = (node) => {
    const direct = Array.isArray(node?.media) ? node.media : [];
    const ents = node?.entities && Array.isArray(node.entities.media) ? node.entities.media : [];
    return [...direct, ...ents].filter(Boolean);
  };

  const bestMp4 = (variants = []) => {
    const mp4s = variants.filter((v) => (v?.content_type || "").includes("mp4"));
    if (mp4s.length === 0) return null;
    // Prefer highest bitrate; fall back to the last one if bitrate missing
    const withBitrate = mp4s.filter((v) => typeof v.bitrate === "number");
    return (withBitrate.length ? withBitrate.sort((a, b) => b.bitrate - a.bitrate)[0] : mp4s[mp4s.length - 1])?.url || null;
  };

  const firstHls = (variants = []) =>
    (variants.find((v) => (v?.content_type || "").includes("x-mpegURL"))?.url) || null;

  const pullMedia = (node) => {
    const images = [];
    const videos = [];

    for (const m of collectMediaNodes(node)) {
      const type = (m?.type || "").toLowerCase();
      if (type === "photo") {
        const url = m.media_url_https || m.media_url || m.url || m.expanded_url || m.display_url;
        if (url) images.push(url);
      } else if (type === "video" || type === "animated_gif") {
        const vi = m.video_info || {};
        const mp4 = bestMp4(vi.variants || []);
        const hls = firstHls(vi.variants || []);
        const thumb = m.media_url_https || null;
        const ar = Array.isArray(vi.aspect_ratio) && vi.aspect_ratio.length === 2 ? vi.aspect_ratio : null;
        videos.push({
          mp4,
          hls,
          thumb,
          aspect_ratio: ar,          // [w, h] if available
          duration_ms: vi.duration_millis ?? null,
        });
      }
    }
    return { images, videos };
  };

  const rootMedia = pullMedia(root);
  const authorId = root?.author?.rest_id;
  const isThreadRoot = String(root.id) === String(root.conversation_id);

  // Only author's own posts in the thread
  const selfThreadItems = Array.isArray(root.thread)
    ? root.thread.filter((t) => String(t?.author?.rest_id || "") === String(authorId || ""))
    : [];

  // Sort by posting time ascending
  selfThreadItems.sort((a, b) => parseDate(a?.created_at) - parseDate(b?.created_at));

  const thread = selfThreadItems.map((t) => ({
    id: t.id,
    created_at: t.created_at,
    text: t.display_text || t.text || "",
    media: pullMedia(t), // { images:[], videos:[] }
  }));

  return {
    id: root.id,
    conversation_id: root.conversation_id,
    isThread: isThreadRoot && thread.length > 0,
    text: root.display_text,
    stats: {
      likes: toNum(root.likes),
      retweets: toNum(root.retweets),
      replies: toNum(root.replies),
      views: toNum(root.views),
    },
    hasMedia: (rootMedia.images?.length || 0) > 0 || (rootMedia.videos?.length || 0) > 0,
    media: rootMedia,      // { images: string[], videos: { mp4, hls, thumb, aspect_ratio, duration_ms }[] }
    thread,                // author's own posts only, sorted, each with its media
  };
}



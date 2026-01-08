export default async (request, context) => {
  const url = new URL(request.url);
  const targetLink = url.searchParams.get("link");

  const response = await context.next();
  const page = await response.text();

  let finalTitle = "Loading...";
  let finalImage = "";
  let finalLink = "404";

  if (targetLink) {
    finalLink = targetLink;
    if (!finalLink.startsWith("http")) finalLink = "https://" + finalLink;

    try {
      // محاولة جلب البيانات بمهلة قصيرة جداً (1.5 ثانية فقط)
      // حتى لا يتأخر تحميل الصفحة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const targetResponse = await fetch(finalLink, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
      });
      
      if (targetResponse.ok) {
        const html = await targetResponse.text();
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
        if (titleMatch) finalTitle = titleMatch[1];
        
        const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
        if (imageMatch) finalImage = imageMatch[1];
      }
    } catch (error) {
      // تجاهل الأخطاء (المهم أن الرابط موجود)
    }
  }

  const updatedPage = page
    .replace(/{{TITLE}}/g, finalTitle)
    .replace(/{{IMAGE}}/g, finalImage)
    .replace(/{{LINK}}/g, finalLink);

  return new Response(updatedPage, response);
};

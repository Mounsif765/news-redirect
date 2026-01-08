export default async (request, context) => {
  const url = new URL(request.url);
  
  // 1. البحث عن الرابط
  const targetLink = url.searchParams.get("link");

  // الحصول على الصفحة الأصلية
  const response = await context.next();
  const page = await response.text();

  // إعدادات افتراضية (في حال عدم وجود رابط، نضع القيمة 404)
  let finalTitle = "الصفحة غير موجودة";
  let finalImage = ""; 
  // هنا التغيير: إذا لم يوجد رابط، القيمة ستكون 404
  let finalLink = "404"; 

  if (targetLink) {
    finalLink = targetLink;
    if (!finalLink.startsWith("http")) finalLink = "https://" + finalLink;

    // محاولة جلب البيانات (كما في السابق)
    try {
      const targetResponse = await fetch(finalLink, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
      });
      
      if (targetResponse.ok) {
        const html = await targetResponse.text();
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
        if (titleMatch) finalTitle = titleMatch[1];
        else {
            const titleTag = html.match(/<title>([^<]*)<\/title>/i);
            if (titleTag) finalTitle = titleTag[1];
        }
        const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
        if (imageMatch) finalImage = imageMatch[1];
      }
    } catch (error) {
      console.log("Error fetching target:", error);
    }
  }

  // استبدال القيم
  const updatedPage = page
    .replace(/{{TITLE}}/g, finalTitle)
    .replace(/{{IMAGE}}/g, finalImage)
    .replace(/{{LINK}}/g, finalLink);

  return new Response(updatedPage, response);
};

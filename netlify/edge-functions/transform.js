export default async (request, context) => {
  const url = new URL(request.url);
  
  // 1. البحث عن الرابط في العنوان ?link=
  const targetLink = url.searchParams.get("link");

  // الحصول على صفحة HTML الأصلية (index.html)
  const response = await context.next();
  const page = await response.text();

  // إعدادات افتراضية
  let finalTitle = "يرجى الانتظار...";
  let finalImage = "https://via.placeholder.com/1200x630?text=News"; // ضع رابط صورة شعار موقعك هنا
  let finalLink = "https://google.com";

  if (targetLink) {
    finalLink = targetLink;
    if (!finalLink.startsWith("http")) finalLink = "https://" + finalLink;

    try {
      // 2. محاولة جلب الموقع الأصلي لاستخراج البيانات
      const targetResponse = await fetch(finalLink, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        }
      });
      
      if (targetResponse.ok) {
        const html = await targetResponse.text();
        
        // استخراج العنوان باستخدام Regex
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
        if (titleMatch) finalTitle = titleMatch[1];
        else {
            const titleTag = html.match(/<title>([^<]*)<\/title>/i);
            if (titleTag) finalTitle = titleTag[1];
        }

        // استخراج الصورة باستخدام Regex
        const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
        if (imageMatch) finalImage = imageMatch[1];
      }
    } catch (error) {
      console.log("Error fetching target:", error);
    }
  }

  // 3. استبدال القيم في ملف HTML
  const updatedPage = page
    .replace(/{{TITLE}}/g, finalTitle)
    .replace(/{{IMAGE}}/g, finalImage)
    .replace(/{{LINK}}/g, finalLink);

  return new Response(updatedPage, response);
};

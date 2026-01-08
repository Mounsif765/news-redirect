export default async (request, context) => {
  const url = new URL(request.url);
  const targetLink = url.searchParams.get("link");

  // Get the original HTML
  const response = await context.next();
  const page = await response.text();

  // Defaults
  let finalTitle = "Loading...";
  let finalImage = "";
  let finalLink = "404"; // Default to 404 if no link provided

  if (targetLink) {
    // If a link exists, we USE IT, even if fetching metadata fails later
    finalLink = targetLink;
    if (!finalLink.startsWith("http")) finalLink = "https://" + finalLink;

    try {
      // Try to fetch metadata (Timeout 3 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

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
      // If fetch fails (timeout or block), we assume defaults but KEEP the link valid
      console.log("Fetch failed, using defaults");
    }
  }

  // Replace placeholders
  const updatedPage = page
    .replace(/{{TITLE}}/g, finalTitle)
    .replace(/{{IMAGE}}/g, finalImage)
    .replace(/{{LINK}}/g, finalLink);

  return new Response(updatedPage, response);
};

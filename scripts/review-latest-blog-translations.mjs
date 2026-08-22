import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const overrides = {
  "oman-business-launch-checklist": {
    ar: {
      heading: "قائمة التحقق لإطلاق مشروع في عُمان: ما يجب فعله خلال أول 90 يوماً",
      category: "دليل الأعمال في عُمان",
    },
    ml: {
      heading: "ഒമാനിൽ ബിസിനസ് ആരംഭിക്കാനുള്ള ചെക്ക്‌ലിസ്റ്റ്: ആദ്യ 90 ദിവസങ്ങളിൽ ചെയ്യേണ്ടത്",
      category: "ഒമാൻ ബിസിനസ് ഗൈഡ്",
    },
    hi: {
      heading: "ओमान में बिज़नेस लॉन्च चेकलिस्ट: पहले 90 दिनों में क्या करें",
      category: "ओमान बिज़नेस गाइड",
    },
  },
  "oman-e-invoicing-2026-guide": {
    ar: {
      heading: "الفوترة الإلكترونية في عُمان 2026: الجدول الزمني لنظام «فوترة» ودليل جاهزية الشركات",
      category: "الامتثال الضريبي",
    },
    ml: {
      heading: "ഒമാനിലെ ഇ-ഇൻവോയ്സിംഗ് 2026: ഫവ്തറ സമയക്രമവും ബിസിനസ് തയ്യാറെടുപ്പ് ഗൈഡും",
      category: "നികുതി പാലനം",
    },
    hi: {
      heading: "ओमान ई-इनवॉइसिंग 2026: फ़वतारा समयसीमा और बिज़नेस तैयारी गाइड",
      category: "टैक्स अनुपालन",
    },
  },
  "oman-data-privacy-marketing-guide": {
    ar: {
      heading: "خصوصية البيانات في عُمان للتسويق: دليل الموافقة وCRM والبريد الإلكتروني وWhatsApp",
      category: "خصوصية البيانات",
    },
    ml: {
      heading: "ഒമാനിലെ മാർക്കറ്റിംഗ് ഡാറ്റ സ്വകാര്യത: സമ്മതം, CRM, ഇമെയിൽ, WhatsApp ഗൈഡ്",
      category: "ഡാറ്റ സ്വകാര്യത",
    },
    hi: {
      heading: "ओमान में मार्केटिंग डेटा गोपनीयता: सहमति, CRM, ईमेल और WhatsApp गाइड",
      category: "डेटा गोपनीयता",
    },
  },
  "whatsapp-commerce-oman-2026": {
    ar: {
      heading: "تجارة WhatsApp في عُمان 2026: من استفسارات الدردشة إلى مبيعات قابلة للقياس",
      category: "التجارة عبر المحادثات",
    },
    ml: {
      heading: "ഒമാനിലെ WhatsApp കൊമേഴ്‌സ് 2026: ചാറ്റ് അന്വേഷണങ്ങളിൽ നിന്ന് അളക്കാവുന്ന വിൽപ്പനയിലേക്ക്",
      category: "സംഭാഷണ കൊമേഴ്‌സ്",
    },
    hi: {
      heading: "ओमान में WhatsApp कॉमर्स 2026: चैट पूछताछ से मापने योग्य बिक्री तक",
      category: "कन्वर्सेशनल कॉमर्स",
    },
  },
  "fifa-world-cup-2026-fixtures-marketing": {
    ar: {
      heading: "دليل مباريات FIFA World Cup 2026 لعلامات الخليج: تحويل اهتمام المباريات المباشرة إلى محتوى مفيد",
      category: "التسويق الرياضي",
    },
    ml: {
      heading: "GCC ബ്രാൻഡുകൾക്കുള്ള FIFA World Cup 2026 മത്സരക്രമ ഗൈഡ്: തത്സമയ മത്സരശ്രദ്ധയെ പ്രയോജനകരമായ ഉള്ളടക്കമാക്കാം",
      category: "സ്പോർട്സ് മാർക്കറ്റിംഗ്",
    },
    hi: {
      heading: "GCC ब्रांड्स के लिए FIFA World Cup 2026 फ़िक्स्चर गाइड: लाइव मैच की दिलचस्पी को उपयोगी कंटेंट में कैसे बदलें",
      category: "स्पोर्ट्स मार्केटिंग",
    },
  },
  "var-referee-rules-explained": {
    ar: {
      heading: "كيف يعمل VAR فعلياً في كرة القدم؟ لماذا يتخذ الحكم القرار النهائي وما الذي تتعلمه العلامات التجارية من الجدل",
      category: "قواعد كرة القدم",
    },
    ml: {
      heading: "ഫുട്ബോളിൽ VAR യഥാർത്ഥത്തിൽ എങ്ങനെ പ്രവർത്തിക്കുന്നു: അന്തിമ തീരുമാനം റഫറി എടുക്കുന്നതെന്തുകൊണ്ട്, വിവാദങ്ങളിൽ നിന്ന് ബ്രാൻഡുകൾക്ക് എന്ത് പഠിക്കാം",
      category: "ഫുട്ബോൾ നിയമങ്ങൾ",
    },
    hi: {
      heading: "फ़ुटबॉल में VAR वास्तव में कैसे काम करता है: अंतिम फ़ैसला रेफ़री क्यों करता है और विवाद से ब्रांड क्या सीख सकते हैं",
      category: "फ़ुटबॉल नियम",
    },
  },
  "fifa-world-cup-2026-marketing-gcc": {
    ar: {
      heading: "دليل تسويق FIFA World Cup 2026 لعلامات الخليج: مواكبة الحدث دون إهدار الميزانية",
      category: "التسويق الرياضي",
    },
    ml: {
      heading: "GCC ബ്രാൻഡുകൾക്കുള്ള FIFA World Cup 2026 മാർക്കറ്റിംഗ് പ്ലേബുക്ക്: ബജറ്റ് പാഴാക്കാതെ ട്രെൻഡ് പ്രയോജനപ്പെടുത്താം",
      category: "സ്പോർട്സ് മാർക്കറ്റിംഗ്",
    },
    hi: {
      heading: "GCC ब्रांड्स के लिए FIFA World Cup 2026 मार्केटिंग प्लेबुक: बजट बर्बाद किए बिना ट्रेंड का लाभ कैसे लें",
      category: "स्पोर्ट्स मार्केटिंग",
    },
  },
  "ai-search-visibility-2026": {
    ar: {
      heading: "كيف تجعل موقعك ظاهراً في ChatGPT وGemini وPerplexity وGoogle AI Overviews",
      category: "الظهور في بحث الذكاء الاصطناعي",
    },
    ml: {
      heading: "ChatGPT, Gemini, Perplexity, Google AI Overviews എന്നിവയിൽ നിങ്ങളുടെ വെബ്‌സൈറ്റ് ദൃശ്യമാക്കുന്നത് എങ്ങനെ",
      category: "AI സെർച്ച് വിസിബിലിറ്റി",
    },
    hi: {
      heading: "ChatGPT, Gemini, Perplexity और Google AI Overviews में अपनी वेबसाइट को कैसे दिखाएँ",
      category: "AI सर्च विज़िबिलिटी",
    },
  },
  "ai-max-search-campaigns-oman": {
    ar: {
      heading: "AI Max للحملات على شبكة البحث: ما يجب أن تعرفه الشركات العُمانية قبل تفعيله",
      category: "إعلانات Google",
    },
    ml: {
      heading: "AI Max for Search Campaigns: പ്രവർത്തനക്ഷമമാക്കുന്നതിന് മുമ്പ് ഒമാൻ ബിസിനസുകൾ അറിയേണ്ടത്",
      category: "Google Ads",
    },
    hi: {
      heading: "AI Max for Search Campaigns: चालू करने से पहले ओमान के बिज़नेस को क्या जानना चाहिए",
      category: "Google Ads",
    },
  },
  "server-side-tracking-ga4-oman": {
    ar: {
      heading: "التتبع من جانب الخادم لـ GA4: ترقية القياس التي تركز على الخصوصية وتحتاجها الشركات العُمانية",
      category: "التحليلات والقياس",
    },
    ml: {
      heading: "GA4-നുള്ള Server-Side Tracking: ഒമാൻ ബിസിനസുകൾക്ക് ആവശ്യമായ സ്വകാര്യത-പ്രഥമ മെഷർമെന്റ് അപ്‌ഗ്രേഡ്",
      category: "അനലിറ്റിക്സും മെഷർമെന്റും",
    },
    hi: {
      heading: "GA4 के लिए सर्वर-साइड ट्रैकिंग: ओमान के बिज़नेस के लिए ज़रूरी प्राइवेसी-फ़र्स्ट मेज़रमेंट अपग्रेड",
      category: "एनालिटिक्स और मेज़रमेंट",
    },
  },
  "helpful-content-google-people-first": {
    ar: { heading: "كيف تكتب محتوى مفيداً يضع الناس أولاً وتثق به Google", category: "استراتيجية المحتوى" },
    ml: { heading: "Google വിശ്വസിക്കുന്ന People-First Helpful Content എങ്ങനെ എഴുതാം", category: "Content Strategy" },
    hi: { heading: "Google के भरोसे लायक उपयोगी, People-First Content कैसे लिखें", category: "कंटेंट स्ट्रैटेजी" },
  },
  "topic-hub-seo-structure": {
    ar: { heading: "كيف تنشئ Topic Hubs تساعد Google على فهم موقعك", category: "هيكلة SEO" },
    ml: { heading: "നിങ്ങളുടെ Website Google-ന് വ്യക്തമായി മനസ്സിലാക്കാൻ സഹായിക്കുന്ന Topic Hubs എങ്ങനെ നിർമ്മിക്കാം", category: "SEO Structure" },
    hi: { heading: "ऐसे Topic Hubs कैसे बनाएँ जो Google को आपकी वेबसाइट समझने में मदद करें", category: "SEO स्ट्रक्चर" },
  },
  "analytics-growth-oman": {
    ar: { heading: "كيف تستخدم بيانات التحليلات لدفع النمو الرقمي في عُمان", category: "التحليلات والنمو" },
    ml: { heading: "ഒമാനിൽ Digital Growth നേടാൻ Analytics Data എങ്ങനെ ഉപയോഗിക്കാം", category: "Analytics & Growth" },
    hi: { heading: "ओमान में डिजिटल ग्रोथ बढ़ाने के लिए Analytics Data का उपयोग कैसे करें", category: "एनालिटिक्स और ग्रोथ" },
  },
  "google-ads-roi-campaigns-oman": {
    ar: { heading: "كيف تحقق أقصى ROI من حملات Google Ads في عُمان", category: "إعلانات Google" },
    ml: { heading: "ഒമാനിലെ Google Ads Campaigns-ൽ നിന്ന് പരമാവധി ROI എങ്ങനെ നേടാം", category: "Google Ads" },
    hi: { heading: "ओमान में Google Ads Campaigns से अधिकतम ROI कैसे पाएँ", category: "Google Ads" },
  },
  "seo-audit-checklist-small-businesses": {
    ar: { heading: "قائمة تدقيق SEO خطوة بخطوة للشركات الصغيرة", category: "تدقيق SEO" },
    ml: { heading: "Small Businesses-നുള്ള Step-by-Step SEO Audit Checklist", category: "SEO Audit" },
    hi: { heading: "छोटे बिज़नेस के लिए Step-by-Step SEO Audit Checklist", category: "SEO ऑडिट" },
  },
  "search-intent-seo-success": {
    ar: { heading: "فهم Search Intent: مفتاح تحقيق نتائج SEO أفضل", category: "استراتيجية SEO" },
    ml: { heading: "Search Intent മനസ്സിലാക്കാം: മികച്ച SEO Results-ന്റെ പ്രധാന താക്കോൽ", category: "SEO Strategy" },
    hi: { heading: "Search Intent को समझना: बेहतर SEO Results की अहम कुंजी", category: "SEO स्ट्रैटेजी" },
  },
};

const authorSuffix = {
  ar: " | حسان علي",
  ml: " | ഹിസാൻ അലി",
  hi: " | हिसान अली",
};
const publishedKeys = new Set([
  "title",
  "description",
  "breadcrumb",
  "category",
  "heading",
  "article",
  "changed",
]);

for (const [slug, localizedOverrides] of Object.entries(overrides)) {
  const file = path.join(root, "blog", slug, "languages.js");
  const htmlFile = path.join(root, "blog", slug, "index.html");
  const source = await fs.readFile(file, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const config = context.window.blogLanguagePage;
  const englishDescription =
    /<meta\s+name="description"\s+content="([^"]*)"/i.exec(
      await fs.readFile(htmlFile, "utf8"),
    )?.[1] || "";

  for (const [locale, values] of Object.entries(localizedOverrides)) {
    Object.assign(config.translations[locale], values, {
      title: values.heading + authorSuffix[locale],
      breadcrumb: values.category,
    });
    if (locale === "ml") {
      const copy = config.translations[locale];
      copy.article = copy.article
        .replaceAll(" ലോഡ് ചെയ്യുന്നു decoding=", ' loading="lazy" decoding=')
        .replaceAll("</5QLZXZ0", "</li>")
        .replaceAll("ZXQ0-യെ കുറിച്ച് സംസാരിക്കുമ്പോൾ ഇത് ഉപയോഗിക്കുക", "conversion measurement വിശദീകരിക്കുമ്പോൾ ഇത് ഉപയോഗിക്കുക.</li>")
        .replaceAll("അടുത്ത നടപടി ZXQ സെറ്റ് ആണ് ഏറ്റവും മികച്ചത് ZXZv എന്നതാണ് അടുത്ത നടപടി. ഏറ്റവും കൂടുതൽ ചാർട്ടുകളുള്ള ഒന്നല്ല.", "ഏറ്റവും മികച്ച analytics report കൂടുതൽ charts ഉള്ളതല്ല; വ്യക്തമായ next action നൽകുന്നതാണ്.")
        .replace(/ZXQ[A-Za-z0-9]*|ZXZ[A-Za-z0-9]*/g, "");
      copy.relatedMeta = (copy.relatedMeta || []).map((value) =>
        /ZXQ|ZXZ/.test(value) ? "5 min read" : value,
      );
    }
    const copy = config.translations[locale];
    if (!copy.description) copy.description = englishDescription;
    for (const key of ["description", "authorName", "authorTitle", "authorBio", "relatedHeading", "ctaHeading", "ctaText", "ctaButton"]) {
      if (!copy[key] || /data-key=|ZXQ|ZXZ/.test(copy[key])) delete copy[key];
    }
    for (const key of ["meta", "relatedTitles", "relatedMeta"]) {
      if (Array.isArray(copy[key])) {
        copy[key] = copy[key].map((value) =>
          value && !/data-key=|ZXQ|ZXZ/.test(value) ? value : null,
        );
      }
    }
    for (const key of Object.keys(copy)) {
      if (!publishedKeys.has(key)) delete copy[key];
    }
  }

  await fs.writeFile(
    file,
    `window.blogLanguagePage = ${JSON.stringify(config, null, 2)};\n`,
  );

  let html = await fs.readFile(htmlFile, "utf8");
  if (!html.includes('hreflang="ar"')) {
    html = html.replace(
      /(<link rel="canonical" href="([^"]+)">)/,
      (_, canonicalTag, canonicalUrl) =>
        `${canonicalTag}\n    <link rel="alternate" hreflang="en" href="${canonicalUrl}">\n    <link rel="alternate" hreflang="ar" href="${canonicalUrl}?lang=ar">\n    <link rel="alternate" hreflang="ml" href="${canonicalUrl}?lang=ml">\n    <link rel="alternate" hreflang="hi" href="${canonicalUrl}?lang=hi">\n    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">`,
    );
    await fs.writeFile(htmlFile, html);
  }
}

console.log(`Reviewed visible titles and terminology for ${Object.keys(overrides).length} blogs.`);

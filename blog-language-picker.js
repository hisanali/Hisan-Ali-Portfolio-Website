(function () {
    "use strict";

    var config = window.blogLanguagePage;
    var article = document.getElementById("blog-content");
    var header = document.querySelector(".blog-post-header");
    if (!config || !article || !header) return;

    var supported = ["en", "ar", "ml", "hi"];
    var names = { en: "English", ar: "العربية", ml: "മലയാളം", hi: "हिन्दी" };
    var englishNames = { en: "English", ar: "Arabic", ml: "Malayalam", hi: "Hindi" };
    var pickerMarkup = '<div class="article-language-switcher">' +
        '<div class="language-picker-kicker"><i class="fas fa-language" aria-hidden="true"></i><span>Read in</span></div>' +
        '<div class="language-picker"><button class="language-picker-button" type="button" aria-haspopup="listbox" aria-expanded="false">' +
        '<i class="fas fa-globe" aria-hidden="true"></i><span class="language-current">English</span><i class="fas fa-chevron-down" aria-hidden="true"></i></button>' +
        '<div class="language-picker-menu" role="listbox" aria-label="Choose article language" hidden>' +
        supported.map(function (language) {
            return '<button class="language-option" type="button" role="option" data-language="' + language + '" aria-selected="' + (language === "en") + '">' +
                '<span class="language-option-copy"><span class="language-option-native">' + names[language] + '</span><span class="language-option-english">' + englishNames[language] + '</span></span>' +
                '<span class="language-option-check"><i class="fas fa-check"></i></span></button>';
        }).join("") + '</div></div><span class="language-status" aria-live="polite"></span></div>';

    var metaRow = header.querySelector(".blog-post-meta");
    metaRow.insertAdjacentHTML("afterend", pickerMarkup);

    var pickerButton = header.querySelector(".language-picker-button");
    var pickerMenu = header.querySelector(".language-picker-menu");
    var currentLabel = header.querySelector(".language-current");
    var status = header.querySelector(".language-status");
    var options = Array.from(header.querySelectorAll(".language-option"));
    var storageKey = "blog-language:" + window.location.pathname;
    var original = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || "",
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || "",
        ogDescription: document.querySelector('meta[property="og:description"]')?.content || "",
        twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || "",
        twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content || "",
        breadcrumb: header.querySelector(".breadcrumb span")?.textContent || "",
        category: header.querySelector(".blog-category")?.textContent || "",
        heading: header.querySelector("h1")?.textContent || "",
        meta: Array.from(metaRow.querySelectorAll("span")).map(function (item) { return item.innerHTML; }),
        article: article.innerHTML,
        authorName: document.querySelector(".author-card h3")?.textContent || "",
        authorTitle: document.querySelector(".author-card .author-title")?.textContent || "",
        authorBio: document.querySelector(".author-card > p:last-of-type")?.textContent || "",
        relatedHeading: document.querySelector(".related-posts h3")?.textContent || "",
        relatedTitles: Array.from(document.querySelectorAll(".related-post-item h4")).map(function (item) { return item.textContent; }),
        relatedMeta: Array.from(document.querySelectorAll(".related-post-item .meta")).map(function (item) { return item.textContent; }),
        ctaHeading: document.querySelector(".cta-content h2")?.textContent || "",
        ctaText: document.querySelector(".cta-content > p")?.textContent || "",
        ctaButton: document.querySelector(".cta-content .btn-primary span")?.textContent || ""
    };
    var originalArticleSignature = articleSignature(original.article);

    function articleSignature(html) {
        if (typeof html !== "string" || /data-key|ZXQ|ZXZ/i.test(html)) return "";
        var template = document.createElement("template");
        template.innerHTML = html;
        return Array.from(template.content.querySelectorAll("*")).map(function (element) {
            return [
                element.tagName.toLowerCase(),
                element.getAttribute("class") || "",
                element.getAttribute("href") || "",
                element.getAttribute("src") || "",
                element.getAttribute("target") || "",
                element.getAttribute("rel") || ""
            ].join("~");
        }).join("|");
    }

    function safeArticle(value) {
        return typeof value === "string" &&
            articleSignature(value) === originalArticleSignature
            ? value
            : original.article;
    }

    function setText(selector, value) {
        var element = document.querySelector(selector);
        if (element && value != null && !/data-key|[<>]|ZXQ|ZXZ/i.test(String(value))) {
            element.textContent = value;
        }
    }

    function setMeta(selector, value) {
        var element = document.querySelector(selector);
        if (element && value) element.content = value;
    }

    function setList(selector, values) {
        if (!Array.isArray(values)) return;
        document.querySelectorAll(selector).forEach(function (element, index) {
            var value = values[index];
            if (value != null && !/data-key|[<>]|ZXQ|ZXZ/i.test(String(value))) {
                element.textContent = value;
            }
        });
    }

    function apply(language, announce) {
        if (!supported.includes(language)) language = "en";
        var localized = config.translations[language];
        document.documentElement.lang = language;
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
        currentLabel.textContent = names[language];
        pickerButton.setAttribute("lang", language);
        options.forEach(function (option) {
            option.setAttribute("aria-selected", String(option.dataset.language === language));
        });

        var copy = language === "en" ? original : Object.assign({}, original, localized || {});
        document.title = copy.title;
        setMeta('meta[name="description"]', copy.description);
        setMeta('meta[property="og:title"]', copy.ogTitle || copy.heading);
        setMeta('meta[property="og:description"]', copy.ogDescription || copy.description);
        setMeta('meta[name="twitter:title"]', copy.twitterTitle || copy.heading);
        setMeta('meta[name="twitter:description"]', copy.twitterDescription || copy.description);
        setText(".blog-post-header .breadcrumb span", copy.breadcrumb);
        setText(".blog-post-header .blog-category", copy.category);
        setText(".blog-post-header h1", copy.heading);
        metaRow.querySelectorAll("span").forEach(function (item, index) {
            var value = original.meta[index];
            if (value != null && !/data-key|[<>]|ZXQ|ZXZ/i.test(String(value))) {
                item.innerHTML = value;
            }
        });
        article.innerHTML = safeArticle(copy.article);
        setText(".author-card h3", original.authorName);
        setText(".author-card .author-title", original.authorTitle);
        setText(".author-card > p:last-of-type", original.authorBio);
        setText(".related-posts h3", original.relatedHeading);
        setList(".related-post-item h4", original.relatedTitles);
        setList(".related-post-item .meta", original.relatedMeta);
        setText(".cta-content h2", original.ctaHeading);
        setText(".cta-content > p", original.ctaText);
        setText(".cta-content .btn-primary span", original.ctaButton);

        var url = new URL(window.location.href);
        if (language === "en") url.searchParams.delete("lang");
        else url.searchParams.set("lang", language);
        history.replaceState({}, "", url.pathname + url.search + url.hash);
        try { localStorage.setItem(storageKey, language); } catch (error) { /* Storage may be unavailable. */ }
        status.textContent = announce && language !== "en" ? (localized?.changed || names[language]) : "";
    }

    function openMenu(open) {
        pickerButton.setAttribute("aria-expanded", String(open));
        pickerMenu.hidden = !open;
    }

    pickerButton.addEventListener("click", function () {
        var open = pickerButton.getAttribute("aria-expanded") !== "true";
        openMenu(open);
        if (open) pickerMenu.querySelector('[aria-selected="true"]')?.focus();
    });

    options.forEach(function (option) {
        option.addEventListener("click", function () {
            apply(option.dataset.language, true);
            openMenu(false);
            pickerButton.focus();
        });
        option.addEventListener("keydown", function (event) {
            if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
            event.preventDefault();
            var index = options.indexOf(option);
            var movement = event.key === "ArrowDown" ? 1 : -1;
            options[(index + movement + options.length) % options.length].focus();
        });
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".language-picker")) openMenu(false);
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && pickerButton.getAttribute("aria-expanded") === "true") {
            openMenu(false);
            pickerButton.focus();
        }
    });

    var requested = new URL(window.location.href).searchParams.get("lang");
    var saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (error) { /* Storage may be unavailable. */ }
    apply(supported.includes(requested) ? requested : (supported.includes(saved) ? saved : "en"), false);
}());

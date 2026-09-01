import random
from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand
from django.utils import timezone as dj_timezone
from django.utils.text import slugify
from wagtail.models import Page

from news.models import (
    ArticlePage, Author, Comment, FooterLink, InfoPage, MastheadMember, MenuItem, PageView,
    Poll, PollOption, Section, SiteSettings, SocialLink, TickerItem, TrendingTag,
)

SECTIONS = [
    ("UK / Bangladesh", "যুক্তরাজ্য-বাংলাদেশ", 0),
    ("UK", "যুক্তরাজ্য", 1),
    ("Bangladesh", "বাংলাদেশ", 2),
    ("World", "বিশ্ব", 3),
    ("Business", "বাণিজ্য", 4),
    ("Culture", "সংস্কৃতি", 5),
    ("Opinion", "মতামত", 6),
    ("Politics", "রাজনীতি", 7),
    ("Sports", "খেলাধুলা", 8),
    ("Lifestyle", "জীবনযাপন", 9),
    ("Environment", "পরিবেশ", 10),
    ("Infrastructure", "অবকাঠামো", 11),
]

AUTHORS = [
    ("Rahim Chowdhury", "রহিম চৌধুরী", "Senior Editor", "জ্যেষ্ঠ সম্পাদক"),
    ("Alexander Wright", "আলেকজান্ডার রাইট", "Political Correspondent", "রাজনৈতিক প্রতিবেদক"),
    ("Elena Rostova", "এলেনা রোস্তোভা", "Policy Correspondent", "নীতি বিষয়ক প্রতিবেদক"),
    ("Marcus Vance", "মার্কাস ভান্স", "Sports Reporter", "ক্রীড়া প্রতিবেদক"),
    ("Claire Beaumont", "ক্লেয়ার বোমন্ট", "Lifestyle Writer", "জীবনযাপন লেখক"),
    ("Sarah Jenkins", "সারা জেনকিন্স", "Education Correspondent", "শিক্ষা বিষয়ক প্রতিবেদক"),
    ("Tanvir Hossain", "তানভীর হোসেন", "Dhaka Correspondent", "ঢাকা প্রতিনিধি"),
    ("Nabila Rahman", "নাবিলা রহমান", "Business Correspondent", "বাণিজ্য প্রতিবেদক"),
    ("David Miller", "ডেভিড মিলার", "World Affairs Editor", "আন্তর্জাতিক সম্পাদক"),
    ("Anisul Huq", "আনিসুল হক", "Culture Writer", "সংস্কৃতি লেখক"),
    ("Dr. Evelyn Vance", "ড. এভলিন ভান্স", "Science Correspondent", "বিজ্ঞান প্রতিবেদক"),
    ("Marcus Sterling", "মার্কাস স্টার্লিং", "Markets Reporter", "বাজার প্রতিবেদক"),
    ("Sophia Chen", "সোফিয়া চেন", "Infrastructure Correspondent", "অবকাঠামো প্রতিবেদক"),
    ("Dr. Amina Rahman", "ড. আমিনা রহমান", "Opinion Columnist", "মতামত কলামিস্ট"),
    ("Biman & British-Bangla Bank Partner Services", "বিমান ও ব্রিটিশ-বাংলা ব্যাংক", "", ""),
]

def p(*blocks):
    parts = []
    for block in blocks:
        if block.startswith(("<h", "<blockquote", "<ul", "<ol", "<figure")):
            parts.append(block)
        else:
            parts.append(f"<p>{block}</p>")
    return "".join(parts)

STORIES = [
    {
        "slug": "hero-story", "section": "UK / Bangladesh", "author": "Rahim Chowdhury",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc), "featured": True,
        "image": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
        "title_en": "UK-Bangladesh Trade Partnership Reaches Landmark Bilateral Pact",
        "title_bn": "যুক্তরাজ্য-বাংলাদেশ বাণিজ্য অংশীদারিত্বে ঐতিহাসিক দ্বিপাক্ষিক চুক্তি স্বাক্ষরিত",
        "excerpt_en": "London and Dhaka have signed a comprehensive economic pact covering trade, maritime cooperation, and technological exchange.",
        "excerpt_bn": "লন্ডন ও ঢাকা বাণিজ্য, সামুদ্রিক সহযোগিতা ও প্রযুক্তি বিনিময় নিয়ে একটি বিস্তৃত অর্থনৈতিক চুক্তি স্বাক্ষর করেছে।",
        "body_en": p(
            "London and Dhaka have formally signed a comprehensive bilateral economic pact aimed at expanding trade, maritime cooperation, and technological exchange. The agreement opens direct channels for renewable energy investment and university partnerships.",
            "Officials on both sides described the deal as the most significant realignment of the relationship in a generation, with provisions that fast-track visa processing for skilled workers and students.",
            "<h2>What the pact covers</h2>",
            "The text commits both governments to a joint renewable energy fund, a maritime logistics corridor through the Bay of Bengal, and mutual recognition of higher-education qualifications.",
        ),
        "body_bn": p(
            "লন্ডন এবং ঢাকা একটি দ্বিপাক্ষিক অর্থনৈতিক চুক্তি স্বাক্ষর করেছে যার লক্ষ্য বাণিজ্য, সামুদ্রিক সহযোগিতা এবং প্রযুক্তিগত আদান-প্রদান ব্যাপকভাবে প্রসারিত করা।",
            "উভয় পক্ষের কর্মকর্তারা একে এক প্রজন্মের মধ্যে সম্পর্কের সবচেয়ে বড় পুনর্বিন্যাস হিসেবে বর্ণনা করেছেন।",
        ),
        "pull_quote_en": "This is the most significant realignment of the UK-Bangladesh relationship in a generation.",
        "pull_quote_bn": "এটি এক প্রজন্মের মধ্যে যুক্তরাজ্য-বাংলাদেশ সম্পর্কের সবচেয়ে গুরুত্বপূর্ণ পুনর্বিন্যাস।",
        "image_caption_en": "Delegates at the signing ceremony in London.",
        "image_caption_bn": "লন্ডনে চুক্তি স্বাক্ষর অনুষ্ঠানে প্রতিনিধিদল।",
        "image_credit": "UK Bangla Guardian",
    },
    {
        "slug": "pol-1", "section": "Politics", "author": "Alexander Wright",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=800&q=80",
        "title_en": "Emergency Sessions Called Across Continents",
        "title_bn": "বিশ্বজুড়ে জরুরি রাজনৈতিক অধিবেশন আহ্বান",
        "excerpt_en": "High-level diplomatic delegations convene for urgent discussions on multilateral security and economic stabilization.",
        "excerpt_bn": "বহুপাক্ষিক নিরাপত্তা ও আন্তর্জাতিক অর্থনৈতিক স্থিতিশীলতা নিয়ে উচ্চ পর্যায়ের প্রতিনিধিদল জরুরি বৈঠকে বসছেন।",
        "body_en": p("High-level diplomatic delegations convened for urgent discussions on multilateral security and international economic stabilization policies."),
        "body_bn": p("বহুপাক্ষিক নিরাপত্তা ও আন্তর্জাতিক অর্থনৈতিক স্থিতিশীলতা নিয়ে আলোচনার জন্য উচ্চ পর্যায়ের প্রতিনিধিদল জরুরি বৈঠকে যোগ দিয়েছেন।"),
    },
    {
        "slug": "pol-2", "section": "Politics", "author": "Elena Rostova",
        "date": datetime(2026, 10, 23, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80",
        "title_en": "New Regulatory Framework Proposed",
        "title_bn": "নতুন প্রস্তাবিত আইনি ও প্রশাসনিক কাঠামো",
        "excerpt_en": "Lawmakers unveil proposals to strengthen corporate governance, data protection, and digital trade guidelines.",
        "excerpt_bn": "কর্পোরেট শাসন, উপাত্ত সুরক্ষা ও ডিজিটাল বাণিজ্য নীতিমালা জোরদারে আইনপ্রণেতাদের নতুন প্রস্তাব।",
        "body_en": p("Lawmakers unveiled legislative proposals aimed at strengthening corporate governance, data protection, and digital trade guidelines."),
        "body_bn": p("কর্পোরেট শাসন, উপাত্ত সুরক্ষা এবং ডিজিটাল বাণিজ্য নীতিমালা জোরদারের লক্ষ্যে আইনপ্রণেতারা নতুন প্রস্তাব উপস্থাপন করেছেন।"),
    },
    {
        "slug": "sports-1", "section": "Sports", "author": "Marcus Vance",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=85",
        "title_en": "Underdog Team Claims Historic Victory in Championship Final",
        "title_bn": "চ্যাম্পিয়নশিপ ফাইনালে অনভিজ্ঞ দলের ঐতিহাসিক জয়",
        "excerpt_en": "In a finale that defied expert predictions, the underdog squad delivered a masterclass to claim the trophy.",
        "excerpt_bn": "বিশেষজ্ঞদের পূর্বাভাসকে ভুল প্রমাণ করে অনভিজ্ঞ দলটি ট্রফি জিতে নিয়েছে।",
        "body_en": p("In a thrilling finale that defied expert predictions, the underdog squad delivered a masterclass strategy to claim the championship trophy."),
        "body_bn": p("সমস্ত বিশেষজ্ঞ পূর্বাভাসকে ভুল প্রমাণ করে রোমাঞ্চকর খেলায় দলটি চ্যাম্পিয়নশিপ ট্রফি ছিনিয়ে নিয়েছে।"),
    },
    {
        "slug": "life-1", "section": "Lifestyle", "author": "Claire Beaumont",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        "title_en": "The Return of Slow Living: Reclaiming Modern Domestic Peace",
        "title_bn": "স্লো লিভিং-এর পুনর্জাগরণ: আধুনিক জীবনে মানসিক প্রশান্তির সন্ধান",
        "excerpt_en": "Exploring the growing movement towards mindful consumption, minimalist design, and balanced routines.",
        "excerpt_bn": "সচেতন জীবনযাপন, ন্যূনতম নকশা ও ভারসাম্যপূর্ণ দিনযাপনের ক্রমবর্ধমান আন্দোলন।",
        "body_en": p("Exploring the growing movement towards mindful consumption, minimalist architecture, and balanced work-life routines."),
        "body_bn": p("ব্যস্ত নাগরিক জীবনের বিপরীতে মানসিক শান্তি, সচেতন জীবনযাপন এবং ন্যূনতম আসবাবের নান্দনিক ব্যবহার বাড়ছে।"),
    },
    {
        "slug": "story-1", "section": "UK", "author": "Sarah Jenkins", "featured": True,
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80",
        "title_en": "British Universities Announce New Scholarships for International Students",
        "title_bn": "যুক্তরাজ্যের বিশ্ববিদ্যালয়গুলোতে আন্তর্জাতিক শিক্ষার্থীদের জন্য নতুন স্কলারশিপ ঘোষণা",
        "excerpt_en": "A coalition of UK universities has launched a merit scholarship programme for students from Commonwealth countries, including Bangladesh.",
        "excerpt_bn": "বাংলাদেশসহ কমনওয়েলথভুক্ত দেশের মেধাবী শিক্ষার্থীদের জন্য যুক্তরাজ্যের বিশ্ববিদ্যালয়গুলোর নতুন বৃত্তি।",
        "body_en": p("A coalition of UK universities has launched a merit scholarship program supporting outstanding students from Commonwealth countries, including Bangladesh."),
        "body_bn": p("যুক্তরাজ্যের বিশ্ববিদ্যালয়গুলোর একটি কনসোর্টিয়াম বাংলাদেশসহ কমনওয়েলথভুক্ত দেশের মেধাবী শিক্ষার্থীদের জন্য নতুন বৃত্তি কর্মসূচি চালু করেছে।"),
    },
    {
        "slug": "story-2", "section": "Bangladesh", "author": "Tanvir Hossain", "featured": True,
        "date": datetime(2026, 10, 23, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1609949279531-cf48d64bed89?auto=format&fit=crop&w=800&q=80",
        "title_en": "Cox's Bazar Eco-Tourism Corridor Opens to Global Travelers",
        "title_bn": "কক্সবাজারে পরিবেশবান্ধব ইকো-ট্যুরিজম করিডোর উদ্বোধন",
        "excerpt_en": "A landmark sustainable development project along the world's longest natural sea beach has officially opened.",
        "excerpt_bn": "বিশ্বের দীর্ঘতম প্রাকৃতিক সৈকতে একটি ঐতিহাসিক টেকসই উন্নয়ন প্রকল্প আনুষ্ঠানিকভাবে চালু হয়েছে।",
        "body_en": p("A landmark sustainable development project along the world's longest natural sea beach has officially opened with renewable transport and eco-resorts."),
        "body_bn": p("বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকতে একটি ঐতিহাসিক টেকসই উন্নয়ন প্রকল্প আনুষ্ঠানিকভাবে উদ্বোধন হয়েছে।"),
    },
    {
        "slug": "story-sponsor", "section": "Business", "author": "Biman & British-Bangla Bank Partner Services",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc), "sponsored": True,
        "image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85",
        "title_en": "Special Remittance & Direct Flight Packages Announced for Diaspora",
        "title_bn": "প্রবাসী সম্প্রদায়ের জন্য রেমিট্যান্স ও সরাসরি ফ্লাইট প্যাকেজ ঘোষণা",
        "excerpt_en": "Premium financial and travel services for Non-Resident Bangladeshis: zero-fee transfers, priority check-in, instant wallet deposits.",
        "excerpt_bn": "প্রবাসী বাংলাদেশিদের জন্য শূন্য ফি ট্রান্সফার, অগ্রাধিকার চেক-ইন ও তাৎক্ষণিক ওয়ালেট জমার সুবিধা।",
        "body_en": p("Premium financial and travel services for Non-Resident Bangladeshis include zero-fee transfers, priority check-in, and instant mobile wallet deposits."),
        "body_bn": p("যুক্তরাজ্যের প্রবাসীদের জন্য বিশেষ অর্থনৈতিক ও ভ্রমণ প্যাকেজে শূন্য ফি রেমিট্যান্স এবং তাৎক্ষণিক মোবাইল ওয়ালেট সুবিধা রয়েছে।"),
    },
    {
        "slug": "story-3", "section": "Business", "author": "Nabila Rahman",
        "date": datetime(2026, 10, 22, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
        "title_en": "London Tech Hub Highlights Diaspora Entrepreneurship Surge",
        "title_bn": "লন্ডন টেক হাব-এ প্রবাসী উদ্যোক্তাদের অভাবনীয় সাফল্য",
        "excerpt_en": "British-Bangladeshi entrepreneurs are breaking records in London's tech ecosystem, securing investment in AI, logistics, and fintech.",
        "excerpt_bn": "লন্ডনের প্রযুক্তি খাতে ব্রিটিশ-বাংলাদেশি উদ্যোক্তারা এআই, লজিস্টিকস ও ফিনটেকে বিনিয়োগ পেয়ে রেকর্ড গড়ছেন।",
        "body_en": p(
            "British-Bangladeshi entrepreneurs are breaking records in London's tech ecosystem, securing investments in AI, logistics, and fintech.",
            "<h2>A generational shift</h2>",
            "Founders who arrived as students a decade ago now run companies employing hundreds, and increasingly route contracts and hiring back to Dhaka and Sylhet.",
        ),
        "body_bn": p("লন্ডনের প্রযুক্তি খাতে ব্রিটিশ-বাংলাদেশি উদ্যোক্তারা নতুন রেকর্ড গড়ছেন।"),
        "pull_quote_en": "A decade ago they arrived as students; today they employ hundreds.",
        "pull_quote_bn": "এক দশক আগে তারা শিক্ষার্থী হিসেবে এসেছিলেন; আজ তারা শত শত মানুষের কর্মসংস্থান করছেন।",
    },
    {
        "slug": "story-4", "section": "World", "author": "David Miller", "featured": True,
        "date": datetime(2026, 10, 21, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
        "title_en": "Global Climate Accord Pledges $50 Billion Resilience Fund for Vulnerable Coasts",
        "title_bn": "উপকূলীয় সুরক্ষায় ৫০ বিলিয়ন ডলারের জলবায়ু তহবিল ঘোষণা",
        "excerpt_en": "Delegates approved an emergency climate adaptation framework aimed at mitigating sea-level rise risks across South Asia.",
        "excerpt_bn": "দক্ষিণ এশিয়ার উপকূলে সমুদ্রপৃষ্ঠের উচ্চতা বৃদ্ধির ঝুঁকি কমাতে জরুরি অভিযোজন কাঠামো অনুমোদিত।",
        "body_en": p("Delegates approved an emergency climate adaptation framework aimed at mitigating sea-level rise risks across South Asian coastal areas."),
        "body_bn": p("দক্ষিণ এশিয়ার উপকূলীয় অঞ্চলসমূহের সুরক্ষায় নতুন একটি জরুরি তহবিল অনুমোদন করা হয়েছে।"),
    },
    {
        "slug": "story-5", "section": "Culture", "author": "Anisul Huq",
        "date": datetime(2026, 10, 20, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
        "title_en": "East London Heritage Festival Celebrates Bengali Art and Textile History",
        "title_bn": "পূর্ব লন্ডনে ঐতিহ্যবাহী শিল্প ও বস্ত্র উৎসব অনুষ্ঠিত",
        "excerpt_en": "Exhibitions of Jamdani heritage weaving and contemporary visual art draw thousands to Brick Lane.",
        "excerpt_bn": "জামদানি বয়নশৈলী ও সমকালীন চারুশিল্পের প্রদর্শনীতে ব্রিক লেনে হাজারো দর্শনার্থী।",
        "body_en": p("Exhibitions showcasing Jamdani heritage weaving and contemporary visual art attract thousands to Brick Lane."),
        "body_bn": p("ব্রিক লেনে জামদানি বয়নশৈলী এবং আধুনিক চারুশিল্পের উৎসবে হাজারো দর্শনার্থী সমাগম ঘটেছে।"),
    },
    {
        "slug": "most-read-1", "section": "Environment", "author": "Dr. Evelyn Vance",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc), "read_count": 320,
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "title_en": "A Climate Threshold Crossed: Scientists Confirm Critical Tipping Point in Arctic Ice Sheets",
        "title_bn": "একটি জলবায়ু সীমা অতিক্রান্ত: আর্কটিক বরফে সংকটজনক টিপিং পয়েন্ট নিশ্চিত করলেন বিজ্ঞানীরা",
        "excerpt_en": "The latest findings suggest that parts of the global climate system may have reached a point of no return.",
        "excerpt_bn": "সর্বশেষ গবেষণা বলছে, বৈশ্বিক জলবায়ু ব্যবস্থার কিছু অংশ হয়তো আর ফেরার অযোগ্য অবস্থায় পৌঁছেছে।",
        "body_en": p(
            "The data streaming from the Geneva Observatory this morning confirmed what many had feared for decades. Global mean temperatures have consistently held at 1.5°C above pre-industrial levels for twelve consecutive months, triggering a cascade of geological events across the northern hemisphere.",
            "\"We are no longer looking at projections,\" said the lead investigator at the Arctic Field Unit. \"We are witnessing the physical reality of a system in transition.\"",
            "<h2>The Ripple Effect</h2>",
            "As the ice melts, it reveals darker land and ocean surfaces that absorb more heat — a phenomenon known as the albedo effect. This feedback loop is accelerating local warming in the Arctic at nearly four times the global average rate.",
            "The implications for global sea levels and weather patterns are immediate. Coastal cities from Jakarta to New York are being urged to accelerate their adaptation protocols.",
        ),
        "body_bn": p(
            "জেনেভা মানমন্দির থেকে আসা তথ্য নিশ্চিত করেছে যা বহু বিজ্ঞানী কয়েক দশক ধরে আশঙ্কা করছিলেন। টানা বারো মাস ধরে বৈশ্বিক গড় তাপমাত্রা শিল্পযুগ-পূর্ব স্তরের চেয়ে ১.৫ ডিগ্রি সেলসিয়াস বেশি রয়েছে।",
            "<h2>শৃঙ্খল প্রতিক্রিয়া</h2>",
            "বরফ গলে যাওয়ায় গাঢ় রঙের ভূমি ও সমুদ্রপৃষ্ঠ উন্মোচিত হয়, যা আরও তাপ শোষণ করে — এই প্রতিক্রিয়া চক্র আর্কটিকের উষ্ণায়ন দ্রুততর করছে।",
        ),
        "pull_quote_en": "We are no longer looking at projections. We are witnessing the physical reality of a system in transition.",
        "pull_quote_bn": "আমরা আর পূর্বাভাস দেখছি না। আমরা একটি রূপান্তরিত ব্যবস্থার বাস্তবতা প্রত্যক্ষ করছি।",
        "image_caption_en": "Field Unit 7 recording structural change at the north-eastern shelf.",
        "image_caption_bn": "উত্তর-পূর্ব শেলফে কাঠামোগত পরিবর্তন রেকর্ড করছে ফিল্ড ইউনিট ৭।",
        "image_credit": "Sarah Jenkins / UK Bangla Guardian",
        "source_url": "https://www.ipcc.ch/",
    },
    {
        "slug": "most-read-2", "section": "Business", "author": "Marcus Sterling",
        "date": datetime(2026, 10, 24, tzinfo=timezone.utc), "read_count": 260,
        "image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
        "title_en": "Global Financial Markets React to Policy Realignment",
        "title_bn": "নতুন নীতি বিন্যাসে বৈশ্বিক আর্থিক বাজারের প্রতিক্রিয়া",
        "excerpt_en": "Investors shift capital allocation strategies amid regulatory changes across European and Asian trading hubs.",
        "excerpt_bn": "ইউরোপ ও এশিয়ার বাণিজ্যকেন্দ্রে নিয়ন্ত্রক পরিবর্তনে বিনিয়োগকারীরা কৌশল বদলাচ্ছেন।",
        "body_en": p("Investors shift capital allocation strategies amidst regulatory shifts across European and Asian trading hubs."),
        "body_bn": p("নতুন নিয়ন্ত্রক নীতির কারণে বিনিয়োগকারীরা মূলধন বরাদ্দের কৌশল পরিবর্তন করছেন।"),
    },
    {
        "slug": "most-read-3", "section": "Infrastructure", "author": "Sophia Chen",
        "date": datetime(2026, 10, 23, tzinfo=timezone.utc), "read_count": 210,
        "image": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
        "title_en": "Metropolitan Infrastructure Projects Spearhead Climate Resilience",
        "title_bn": "নগর অবকাঠামো প্রকল্প জলবায়ু সহনশীলতার পথ দেখাচ্ছে",
        "excerpt_en": "Cities adapt with sustainable green engineering and resilient public infrastructure.",
        "excerpt_bn": "টেকসই সবুজ প্রকৌশল ও সহনশীল অবকাঠামোর মাধ্যমে শহরগুলো মানিয়ে নিচ্ছে।",
        "body_en": p("Cities adapt with sustainable green architectural engineering and resilient public infrastructure."),
        "body_bn": p("টেকসই সবুজ স্থাপত্য ও সহনশীল অবকাঠামোর মাধ্যমে শহরগুলো বদলে যাচ্ছে।"),
    },
    {
        "slug": "story-6", "section": "Opinion", "author": "Dr. Amina Rahman",
        "date": datetime(2026, 10, 19, tzinfo=timezone.utc),
        "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80",
        "title_en": "Opinion: Why Multilingual Education is the Key to Modern Cultural Resilience",
        "title_bn": "মতামত: কেন দ্বিভাষিক শিক্ষা সাংস্কৃতিক স্থিতিশীলতার মূল ভিত্তি",
        "excerpt_en": "Bilingual literacy enriches cognitive capability and lets younger generations build global networks without losing cultural roots.",
        "excerpt_bn": "দ্বিভাষিক শিক্ষা তরুণ প্রজন্মকে সাংস্কৃতিক শিকড় ধরে রেখে বৈশ্বিক নেটওয়ার্ক গড়তে সাহায্য করে।",
        "body_en": p("Bilingual literacy enriches cognitive capability and enables younger generations to forge stronger global networks without losing cultural roots."),
        "body_bn": p("দ্বিভাষিক শিক্ষা ভবিষ্যৎ প্রজন্মকে নিজস্ব সাংস্কৃতিক শিকড় টিকিয়ে বৈশ্বিক পরিমণ্ডলে সফল হতে সাহায্য করে।"),
    },
]

MENU = [
    ("Home", "হোম", "/"),
    ("UK", "যুক্তরাজ্য", "/category/uk"),
    ("Bangladesh", "বাংলাদেশ", "/category/bangladesh"),
    ("World", "বিশ্ব", "/category/world"),
    ("Business", "বাণিজ্য", "/category/business"),
    ("Culture", "সংস্কৃতি", "/category/culture"),
    ("Opinion", "মতামত", "/category/opinion"),
]

TICKER = [
    ("UK Parliament debates new visa policies", "নতুন ভিসা নীতি নিয়ে যুক্তরাজ্যের সংসদে বিতর্ক"),
    ("Bangladesh foreign direct investment reaches historic peak", "বাংলাদেশে সরাসরি বিদেশি বিনিয়োগ ঐতিহাসিক শিখরে"),
    ("Sylhet regional airport expansion enters phase 2", "সিলেট আঞ্চলিক বিমানবন্দর সম্প্রসারণের দ্বিতীয় ধাপ শুরু"),
]

TRENDING = ["ClimateSummit", "TechRegulation"]

SOCIAL = [
    ("X", "https://x.com/", "𝕏"),
    ("Facebook", "https://facebook.com/", "f"),
    ("Instagram", "https://instagram.com/", "◎"),
    ("YouTube", "https://youtube.com/", "▶"),
]

FOOTER_LINKS = [
    ("explore", "Home", "হোম", "/"),
    ("explore", "Latest News", "সর্বশেষ সংবাদ", "/category/uk"),
    ("explore", "Most Read", "সর্বাধিক পঠিত", "/#most-read"),
    ("legal", "Privacy", "গোপনীয়তা", "/privacy"),
    ("legal", "Terms", "শর্তাবলি", "/privacy"),
    ("legal", "Contact", "যোগাযোগ", "/contact"),
]

# (role_en, role_bn, name_en, name_bn)
MASTHEAD = [
    ("Editor", "সম্পাদক", "Muhammed Shahed Rahman", "মুহাম্মদ শাহেদ রাহমান"),
    ("Special Assignment Editor", "বিশেষ দায়িত্বপ্রাপ্ত সম্পাদক", "Dr Ansar Ahmed Ullah", ""),
    ("Assistant Editor", "সহকারী সম্পাদক", "Prof Md. Shajidur Rahman", ""),
    ("Assistant Editor", "সহকারী সম্পাদক", "S. K. M. Ashraful Huda", ""),
    ("Assistant Editor", "সহকারী সম্পাদক", "Mirza Abul Kashem", ""),
    ("Managing Editor", "ব্যবস্থাপনা সম্পাদক", "Ruhela Begum Rahman", ""),
    ("Contributing Reporters", "প্রতিবেদক", "Nahid Jaigirdar", ""),
    ("Contributing Reporters", "প্রতিবেদক", "Mohammed Saleh Ahmed", ""),
    ("Contributing Reporters", "প্রতিবেদক", "Abdur Rahim", ""),
    ("Contributing Reporters", "প্রতিবেদক", "Asadur Zaman Nabin", ""),
]

INFO_PAGES = [
    ("about", "About UK Bangla Guardian", "উইকে বাংলা গার্ডিয়ান সম্পর্কে",
     "<p>Independent news and essential stories for the British-Bangladeshi community.</p>",
     "<p>ব্রিটিশ-বাংলাদেশি সম্প্রদায়ের জন্য স্বাধীন সংবাদ ও গুরুত্বপূর্ণ প্রতিবেদন।</p>"),
    ("contact", "Contact", "যোগাযোগ",
     "<p>For editorial enquiries, email editorial@ukbanglaguardian.com.</p>",
     "<p>সম্পাদকীয় জিজ্ঞাসার জন্য ইমেইল করুন editorial@ukbanglaguardian.com।</p>"),
    ("privacy", "Privacy policy", "গোপনীয়তা নীতি",
     "<p>We only use newsletter email addresses to deliver the briefing and never sell personal information.</p>",
     "<p>নিউজলেটার ইমেইল ঠিকানা কেবল ব্রিফিং পাঠাতে ব্যবহৃত হয়; ব্যক্তিগত তথ্য কখনও বিক্রি করা হয় না।</p>"),
]


class Command(BaseCommand):
    help = "Create UK Bangla sections, authors, stories, and all site configuration."

    def handle(self, *args, **options):
        root = Page.get_first_root_node()

        for order, (name_en, name_bn, sort) in enumerate(SECTIONS):
            Section.objects.update_or_create(
                slug=slugify(name_en),
                defaults={"name_en": name_en, "name_bn": name_bn, "sort_order": sort},
            )

        for name_en, name_bn, role_en, role_bn in AUTHORS:
            Author.objects.update_or_create(
                name_en=name_en,
                defaults={"name_bn": name_bn, "role_en": role_en, "role_bn": role_bn},
            )

        for item in STORIES:
            section = Section.objects.get(slug=slugify(item["section"]))
            author = Author.objects.get(name_en=item["author"])
            fields = dict(
                title=item["title_en"], title_bn=item["title_bn"],
                section=section, author=author,
                excerpt_en=item["excerpt_en"], excerpt_bn=item["excerpt_bn"],
                body_en=item["body_en"], body_bn=item["body_bn"],
                image_url=item.get("image", ""),
                pull_quote_en=item.get("pull_quote_en", ""), pull_quote_bn=item.get("pull_quote_bn", ""),
                image_caption_en=item.get("image_caption_en", ""), image_caption_bn=item.get("image_caption_bn", ""),
                image_credit=item.get("image_credit", ""), source_url=item.get("source_url", ""),
                is_featured=item.get("featured", False), is_sponsored=item.get("sponsored", False),
                read_count=item.get("read_count", 0),
            )
            article = ArticlePage.objects.filter(slug=item["slug"]).first()
            if article:
                for key, value in fields.items():
                    setattr(article, key, value)
            else:
                article = ArticlePage(slug=item["slug"], **fields)
                root.add_child(instance=article)
            article.first_published_at = item["date"]
            article.last_published_at = item["date"]
            article.save_revision().publish()
            self.stdout.write(f"Article: {item['title_en']}")

        settings_obj = SiteSettings.load()
        settings_obj.brand_name = "Guardian"
        settings_obj.brand_kicker = "UK | BANGLA"
        settings_obj.brand_name_bn = "ইউকে বাংলা গার্ডিয়ান"
        settings_obj.tagline_en = "Leading the voice of the British-Bangladeshi community."
        settings_obj.tagline_bn = "ব্রিটিশ-বাংলাদেশি সম্প্রদায়ের অগ্রণী কণ্ঠস্বর।"
        settings_obj.weather_london = "☁ London 18°C"
        settings_obj.weather_dhaka = "☀ Dhaka 31°C"
        settings_obj.gbp_to_bdt_rate = "152.50"
        settings_obj.fx_trend_note_en = "↗ +1.2% this week"
        settings_obj.fx_trend_note_bn = "↗ এই সপ্তাহে +১.২%"
        settings_obj.footer_blurb_en = "Independent reporting dedicated to the British-Bangladeshi community worldwide. A standard of integrity, accuracy, and depth."
        settings_obj.footer_blurb_bn = "বিশ্বব্যাপী ব্রিটিশ-বাংলাদেশি সম্প্রদায়ের জন্য স্বাধীন সাংবাদিকতা। বস্তুনিষ্ঠতা ও পেশাদারিত্বের অঙ্গীকার।"
        settings_obj.footer_badge_en = "Independent · Accurate · Essential"
        settings_obj.footer_badge_bn = "স্বাধীন · নির্ভুল · অপরিহার্য"
        settings_obj.copyright_en = "© 2026 UK Bangla Guardian. All rights reserved."
        settings_obj.copyright_bn = "© ২০২৬ ইউকে বাংলা গার্ডিয়ান। সর্বস্বত্ব সংরক্ষিত।"
        settings_obj.newsletter_footnote_en = "No spam. Just the stories that matter."
        settings_obj.newsletter_footnote_bn = "কোনো স্প্যাম নয়। কেবল গুরুত্বপূর্ণ খবর।"
        settings_obj.home_lead_heading_en = "Today's essential stories"
        settings_obj.home_lead_heading_bn = "আজকের গুরুত্বপূর্ণ খবর"
        settings_obj.home_across_heading_en = "Across Britain & Bangladesh"
        settings_obj.home_across_heading_bn = "ব্রিটেন ও বাংলাদেশজুড়ে"
        settings_obj.home_more_heading_en = "More from the Guardian"
        settings_obj.home_more_heading_bn = "গার্ডিয়ান থেকে আরও"
        settings_obj.home_opinion_heading_en = "Opinion & voices"
        settings_obj.home_opinion_heading_bn = "মতামত ও বিশ্লেষণ"
        settings_obj.save()

        for order, (label_en, label_bn, url) in enumerate(MENU):
            MenuItem.objects.update_or_create(url=url, defaults={"label_en": label_en, "label_bn": label_bn, "sort_order": order, "is_active": True})

        for order, (text_en, text_bn) in enumerate(TICKER):
            TickerItem.objects.update_or_create(text_en=text_en, defaults={"text_bn": text_bn, "sort_order": order, "is_active": True})

        for order, label in enumerate(TRENDING):
            TrendingTag.objects.update_or_create(label=label, defaults={"sort_order": order})

        for order, (label, url, glyph) in enumerate(SOCIAL):
            SocialLink.objects.update_or_create(label=label, defaults={"url": url, "glyph": glyph, "sort_order": order})

        for order, (column, label_en, label_bn, url) in enumerate(FOOTER_LINKS):
            FooterLink.objects.update_or_create(column=column, label_en=label_en, defaults={"label_bn": label_bn, "url": url, "sort_order": order})

        for order, (role_en, role_bn, name_en, name_bn) in enumerate(MASTHEAD):
            MastheadMember.objects.update_or_create(
                name_en=name_en,
                defaults={"role_en": role_en, "role_bn": role_bn, "name_bn": name_bn, "sort_order": order},
            )

        for slug, title_en, title_bn, body_en, body_bn in INFO_PAGES:
            InfoPage.objects.update_or_create(slug=slug, defaults={"title_en": title_en, "title_bn": title_bn, "body_en": body_en, "body_bn": body_bn})

        lead = ArticlePage.objects.filter(slug="most-read-1").first()
        if lead and not lead.comments.exists():
            Comment.objects.create(article=lead, name="Ayesha Rahman", body="A sobering read. Thank you for the depth and for not sensationalising it.")
            Comment.objects.create(article=lead, name="Tom H.", body="Would love a follow-up on what adaptation actually looks like for coastal cities.")

        if not Poll.objects.filter(is_active=True).exists():
            poll = Poll.objects.create(
                question_en="Should the UK expand post-study work visas for university graduates?",
                question_bn="যুক্তরাজ্যের কি গ্র্যাজুয়েটদের জন্য পোস্ট-স্টাডি ওয়ার্ক ভিসা বৃদ্ধি করা উচিত?",
                context_label="UK VISAS", is_active=True,
            )
            PollOption.objects.create(poll=poll, sort_order=0, label_en="Yes, expand the route", label_bn="হ্যাঁ, সুযোগ বাড়ানো উচিত")
            PollOption.objects.create(poll=poll, sort_order=1, label_en="Keep the current rules", label_bn="বর্তমান নিয়ম রাখা উচিত")

        if PageView.objects.count() < 20:
            now = dj_timezone.now()
            articles = list(ArticlePage.objects.all())
            for days_ago in range(14):
                day = now - timedelta(days=days_ago)
                for _ in range(random.randint(15, 60)):
                    article = random.choice(articles) if articles and random.random() < 0.7 else None
                    path = f"/article/{article.slug}" if article else random.choice(["/", "/category/uk", "/category/world"])
                    view = PageView.objects.create(
                        path=path, article=article,
                        visitor=f"seed-{days_ago}-{random.randint(1, 40)}",
                    )
                    PageView.objects.filter(pk=view.pk).update(
                        created_at=day - timedelta(hours=random.randint(0, 23)),
                    )
            self.stdout.write("Seeded sample page views for the dashboard.")

        self.stdout.write(self.style.SUCCESS("Seeded UK Bangla content and site configuration."))

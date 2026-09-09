from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from wagtail.models import Page

from news.models import ArticlePage, Author, Section


STORIES = [
    {
        "slug": "uk-bangladesh-ties-priority",
        "section": ("Politics", "রাজনীতি"),
        "author": "UK Bangla News Desk",
        "title": "UK Foreign Secretary Names Bangladesh Ties a Priority",
        "title_bn": "যুক্তরাজ্যের পররাষ্ট্রমন্ত্রী বাংলাদেশ সম্পর্ককে অগ্রাধিকার দিলেন",
        "summary": "The UK government says it wants to deepen cooperation with Bangladesh across trade, security and wider bilateral engagement.",
        "summary_bn": "যুক্তরাজ্য সরকার বাণিজ্য, নিরাপত্তা এবং দ্বিপাক্ষিক সহযোগিতায় বাংলাদেশের সঙ্গে সম্পর্ক আরও গভীর করার কথা জানিয়েছে।",
        "source_url": "https://www.gov.uk/world/bangladesh/news",
        "published": datetime(2026, 7, 21, tzinfo=timezone.utc),
    },
    {
        "slug": "tulip-siddiq-bangladesh-case",
        "section": ("Politics", "রাজনীতি"),
        "author": "UK Bangla News Desk",
        "title": "UK MP Tulip Siddiq Sentenced in Bangladesh Corruption Case",
        "title_bn": "বাংলাদেশের দুর্নীতি মামলায় যুক্তরাজ্যের এমপি টিউলিপ সিদ্দিকের সাজা",
        "summary": "A Bangladesh court sentenced British Labour MP Tulip Siddiq in a corruption case; Siddiq has disputed the proceedings and described them as politically motivated.",
        "summary_bn": "বাংলাদেশের একটি আদালত ব্রিটিশ লেবার এমপি টিউলিপ সিদ্দিককে দুর্নীতি মামলায় সাজা দিয়েছে; সিদ্দিক বিচারপ্রক্রিয়া নিয়ে আপত্তি জানিয়েছেন।",
        "source_url": "https://news.sky.com/topic/bangladesh-6241",
        "published": datetime(2025, 12, 1, tzinfo=timezone.utc),
    },
    {
        "slug": "bangladesh-supports-nepal-flood-response",
        "section": ("World", "বিশ্ব"),
        "author": "International Desk",
        "title": "Bangladesh Offers Support After Floods in Nepal",
        "title_bn": "নেপালের বন্যার পর সহায়তার প্রস্তাব বাংলাদেশের",
        "summary": "Bangladesh expressed condolences and offered assistance to Nepal after deadly floods and landslides, highlighting regional disaster-response cooperation.",
        "summary_bn": "প্রাণঘাতী বন্যা ও ভূমিধসের পর বাংলাদেশ নেপালকে সমবেদনা ও সহায়তার প্রস্তাব দিয়েছে।",
        "source_url": "https://www.dhakatribune.com/",
        "published": datetime(2026, 8, 28, tzinfo=timezone.utc),
    },
    {
        "slug": "rohingya-boats-bay-of-bengal",
        "section": ("Bangladesh", "বাংলাদেশ"),
        "author": "Humanitarian Desk",
        "title": "Rohingya Boat Disaster Raises Alarm in Bay of Bengal",
        "title_bn": "বঙ্গোপসাগরে রোহিঙ্গা নৌকাডুবিতে উদ্বেগ",
        "summary": "Reports of boats carrying Rohingya refugees capsizing in the Bay of Bengal have prompted a major humanitarian response and renewed concern about dangerous sea crossings.",
        "summary_bn": "বঙ্গোপসাগরে রোহিঙ্গা শরণার্থীদের নৌকাডুবির খবরের পর মানবিক সহায়তা জোরদার হয়েছে এবং ঝুঁকিপূর্ণ সমুদ্রযাত্রা নিয়ে উদ্বেগ বেড়েছে।",
        "source_url": "https://www.telegraph.co.uk/bangladesh/",
        "published": datetime(2026, 7, 16, tzinfo=timezone.utc),
    },
    {
        "slug": "bangladesh-power-imports",
        "section": ("Business", "ব্যবসা"),
        "author": "Business Desk",
        "title": "Bangladesh Seeks More Power Imports as Electricity Pressure Grows",
        "title_bn": "বিদ্যুৎ সংকট বাড়ায় আমদানি বাড়ানোর উদ্যোগ বাংলাদেশে",
        "summary": "Bangladesh is seeking additional electricity imports from India as supply constraints lead to rolling power cuts in parts of the country.",
        "summary_bn": "সরবরাহ সংকটের কারণে দেশের কিছু এলাকায় লোডশেডিং বাড়ায় বাংলাদেশ ভারত থেকে আরও বিদ্যুৎ আমদানির উদ্যোগ নিয়েছে।",
        "source_url": "https://www.wionews.com/bangladesh",
        "published": datetime(2026, 8, 13, tzinfo=timezone.utc),
    },
    {
        "slug": "bangladesh-womens-cricket-sendoff",
        "section": ("Sports", "খেলাধুলা"),
        "author": "Sports Desk",
        "title": "Bangladesh Women Receive UK Send-Off Ahead of T20 World Cup",
        "title_bn": "টি-টোয়েন্টি বিশ্বকাপের আগে বাংলাদেশ নারী দলকে যুক্তরাজ্যের বিদায় সংবর্ধনা",
        "summary": "The British High Commission in Dhaka held a send-off for Bangladesh’s women cricketers, celebrating sporting links before the ICC T20 World Cup.",
        "summary_bn": "আইসিসি টি-টোয়েন্টি বিশ্বকাপের আগে ঢাকায় ব্রিটিশ হাইকমিশন বাংলাদেশ নারী ক্রিকেট দলকে বিদায় সংবর্ধনা দিয়েছে।",
        "source_url": "https://www.gov.uk/world/bangladesh/news",
        "published": datetime(2026, 5, 21, tzinfo=timezone.utc),
    },
    {
        "slug": "bangladesh-qatar-lng-request",
        "section": ("Business", "ব্যবসা"),
        "author": "Energy Desk",
        "title": "Bangladesh Asks Qatar to Prioritise LNG Supplies",
        "title_bn": "এলএনজি সরবরাহে অগ্রাধিকার চাইল বাংলাদেশ",
        "summary": "Bangladesh has asked Qatar to prioritise liquefied natural gas shipments as fuel shortages put additional pressure on electricity generation.",
        "summary_bn": "জ্বালানি সংকটে বিদ্যুৎ উৎপাদনে চাপ বাড়ায় বাংলাদেশ কাতারের কাছে তরলীকৃত প্রাকৃতিক গ্যাসের চালান অগ্রাধিকার দেওয়ার অনুরোধ করেছে।",
        "source_url": "https://unb.com.bd/",
        "published": datetime(2026, 8, 27, tzinfo=timezone.utc),
    },
    {
        "slug": "bangladesh-monsoon-floods",
        "section": ("Bangladesh", "বাংলাদেশ"),
        "author": "Climate Desk",
        "title": "Monsoon Flooding and Landslides Kill Dozens in Bangladesh",
        "title_bn": "বাংলাদেশে মৌসুমি বন্যা ও ভূমিধসে কয়েক ডজন নিহত",
        "summary": "Heavy monsoon rain caused flooding and landslides in Bangladesh, prompting emergency operations and calls for support for affected communities.",
        "summary_bn": "ভারী মৌসুমি বৃষ্টিতে বাংলাদেশে বন্যা ও ভূমিধস হয়েছে; ক্ষতিগ্রস্তদের সহায়তায় জরুরি কার্যক্রম শুরু হয়েছে।",
        "source_url": "https://www.independent.co.uk/topic/bangladesh",
        "published": datetime(2026, 7, 20, tzinfo=timezone.utc),
    },
    {
        "slug": "uk-funded-bangladesh-climate-project",
        "section": ("World", "বিশ্ব"),
        "author": "Climate Desk",
        "title": "UK-Funded Bangladesh Climate Project Faces Early Closure",
        "title_bn": "যুক্তরাজ্যের অর্থায়নে বাংলাদেশের জলবায়ু প্রকল্প দ্রুত বন্ধ হওয়ার মুখে",
        "summary": "A UK-backed climate-resilience programme in Bangladesh is expected to close early after funding reductions, raising concerns for vulnerable communities.",
        "summary_bn": "অর্থায়ন কমে যাওয়ায় বাংলাদেশে যুক্তরাজ্য-সমর্থিত জলবায়ু সহনশীলতা কর্মসূচি নির্ধারিত সময়ের আগে বন্ধ হওয়ার আশঙ্কা তৈরি হয়েছে।",
        "source_url": "https://www.independent.co.uk/topic/bangladesh",
        "published": datetime(2026, 8, 1, tzinfo=timezone.utc),
    },
    {
        "slug": "bangladesh-election-bnp-majority",
        "section": ("Politics", "রাজনীতি"),
        "author": "Election Desk",
        "title": "BNP Wins Parliamentary Majority in Bangladesh Election",
        "title_bn": "বাংলাদেশের নির্বাচনে বিএনপির সংসদীয় সংখ্যাগরিষ্ঠতা",
        "summary": "The Bangladesh Nationalist Party won a decisive parliamentary majority in the election, marking a major change in the country’s political direction.",
        "summary_bn": "বাংলাদেশ জাতীয়তাবাদী দল নির্বাচনে উল্লেখযোগ্য সংসদীয় সংখ্যাগরিষ্ঠতা পেয়েছে, যা দেশের রাজনৈতিক গতিপথে বড় পরিবর্তন এনেছে।",
        "source_url": "https://news.sky.com/topic/bangladesh-6241",
        "published": datetime(2026, 2, 13, tzinfo=timezone.utc),
    },
]


class Command(BaseCommand):
    help = "Import ten sourced, paraphrased news summaries into Wagtail."

    def handle(self, *args, **options):
        root = Page.get_first_root_node()
        for item in STORIES:
            section_name, section_bn = item["section"]
            section, _ = Section.objects.get_or_create(
                slug=slugify(section_name),
                defaults={"name_en": section_name, "name_bn": section_bn},
            )
            author, _ = Author.objects.get_or_create(name_en=item["author"])
            article = ArticlePage.objects.filter(slug=item["slug"]).first()
            created = article is None
            if created:
                article = ArticlePage(
                    title=item["title"],
                    title_bn=item["title_bn"],
                    section=section,
                    author=author,
                    excerpt_en=item["summary"],
                    excerpt_bn=item["summary_bn"],
                    body_en=item["summary"],
                    body_bn=item["summary_bn"],
                    source_url=item["source_url"],
                    read_count=0,
                    slug=item["slug"],
                )
            if not created:
                continue
            root.add_child(instance=article)
            article.first_published_at = item["published"]
            article.last_published_at = item["published"]
            article.save_revision().publish()
            self.stdout.write(f"Imported: {item['title']}")
        self.stdout.write(self.style.SUCCESS("Imported 10 sourced news summaries."))

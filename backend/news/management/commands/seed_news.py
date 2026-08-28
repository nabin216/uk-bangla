from django.core.management.base import BaseCommand
from django.utils.text import slugify
from wagtail.models import Page
from news.models import ArticlePage, Author, Section

STORIES = [
    ("hero-story", "UK / Bangladesh", "Rahim Chowdhury", "UK-Bangladesh Trade Partnership Reaches Landmark Bilateral Pact", "যুক্তরাজ্য-বাংলাদেশ বাণিজ্য অংশীদারিত্বে ঐতিহাসিক দ্বিপাক্ষিক চুক্তি স্বাক্ষরিত", True),
    ("pol-1", "Politics", "Alexander Wright", "Emergency Sessions Called Across Continents", "বিশ্বজুড়ে জরুরি রাজনৈতিক অধিবেশন আহ্বান", False),
    ("sports-1", "Sports", "Marcus Vance", "Underdog Team Claims Historic Victory in Championship Final", "চ্যাম্পিয়নশিপ ফাইনালে অনভিজ্ঞ দলের ঐতিহাসিক জয়", False),
    ("story-1", "UK", "Sarah Jenkins", "British Universities Announce New Scholarships for International Students", "যুক্তরাজ্যের বিশ্ববিদ্যালয়গুলোতে আন্তর্জাতিক শিক্ষার্থীদের জন্য নতুন স্কলারশিপ ঘোষণা", False),
    ("story-2", "Bangladesh", "Tanvir Hossain", "Cox's Bazar Eco-Tourism Corridor Opens to Global Travelers", "কক্সবাজারে পরিবেশবান্ধব ইকো-ট্যুরিজম করিডোর উদ্বোধন", False),
]

class Command(BaseCommand):
    help = "Create representative UK Bangla sections, authors, and stories."

    def handle(self, *args, **options):
        root = Page.get_first_root_node()
        for slug, name in {slugify(s[1]): s[1] for s in STORIES}.items():
            Section.objects.get_or_create(slug=slug, defaults={"name_en": name, "name_bn": name})
        for slug, section_name, author_name, title, title_bn, featured in STORIES:
            section = Section.objects.get(slug=slugify(section_name))
            author, _ = Author.objects.get_or_create(name_en=author_name)
            article = ArticlePage.objects.filter(slug=slug).first()
            if article:
                continue
            article = ArticlePage(
                title=title, title_bn=title_bn, slug=slug, section=section, author=author,
                excerpt_en=title, excerpt_bn=title_bn, body_en=title, body_bn=title_bn,
                is_featured=featured, read_count=100 if featured else 10,
            )
            root.add_child(instance=article)
            article.save_revision().publish()
        self.stdout.write(self.style.SUCCESS("Seeded sample UK Bangla news content."))

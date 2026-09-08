from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand
from wagtail.models import Page

from news.models import ArticlePage, Author, Section

SECTION = {
    "slug": "english",
    "name_en": "English News",
    "name_bn": "ইংরেজি সংবাদ",
    "description": "English-language reporting for readers across Britain and Bangladesh.",
    "sort_order": 12,
    "show_in_nav": False,
}

AUTHOR = {"name_en": "UK Bangla News Desk", "role_en": "Newsroom", "role_bn": "সংবাদকক্ষ"}

STORIES = [
    {
        "slug": "english-tower-hamlets-language-cafe",
        "title": "Tower Hamlets Language Café Marks One Year of Free English Classes",
        "excerpt": "A volunteer-run café in east London has helped more than 200 residents improve their conversational English over the past twelve months.",
        "body": (
            "<p>A weekly language café in Tower Hamlets has celebrated its first anniversary, "
            "with organisers reporting that more than 200 local residents have taken part in "
            "its free conversational English sessions.</p>"
            "<p>The project pairs new arrivals and long-settled residents with volunteer "
            "facilitators over tea and snacks, focusing on the everyday English needed for "
            "appointments, school meetings and job interviews.</p>"
            "<p>Organisers say demand has outstripped capacity and they are now recruiting "
            "additional volunteers to open a second weekday session.</p>"
        ),
        "days_ago": 1,
    },
    {
        "slug": "english-nhs-bengali-interpreter-scheme",
        "title": "NHS Trust Expands Bengali Interpreter Scheme at GP Surgeries",
        "excerpt": "Patients in three boroughs will now be offered a trained Bengali interpreter for routine GP appointments, not only hospital visits.",
        "body": (
            "<p>An NHS trust in London has widened its interpreter programme so that Bengali- "
            "and Sylheti-speaking patients can request language support for routine GP "
            "appointments, a service previously limited to hospital care.</p>"
            "<p>Community health advocates have long argued that the gap left older residents "
            "relying on family members to translate sensitive medical information.</p>"
            "<p>The trust said the expansion follows a successful pilot that reduced missed "
            "appointments and improved follow-up rates among Bengali-speaking patients.</p>"
        ),
        "days_ago": 2,
    },
    {
        "slug": "english-british-bangladeshi-business-awards",
        "title": "British-Bangladeshi Business Awards Return to Manchester",
        "excerpt": "The annual awards will recognise enterprises in hospitality, technology and green energy, with a new category for young founders under 30.",
        "body": (
            "<p>The British-Bangladeshi Business Awards will be held in Manchester this year, "
            "moving outside London for the first time to reflect the community's growing "
            "presence across the north of England.</p>"
            "<p>Organisers have added a category for founders under 30, alongside established "
            "awards for hospitality, technology and renewable energy businesses.</p>"
            "<p>Nominations open next week and the ceremony is scheduled for the autumn.</p>"
        ),
        "days_ago": 3,
    },
]


class Command(BaseCommand):
    help = "Create the 'English News' category and a few English-only demo articles."

    def handle(self, *args, **options):
        root = Page.get_first_root_node()
        now = datetime.now(timezone.utc)

        section, _ = Section.objects.get_or_create(
            slug=SECTION["slug"],
            defaults={k: v for k, v in SECTION.items() if k != "slug"},
        )
        author, _ = Author.objects.get_or_create(
            name_en=AUTHOR["name_en"],
            defaults={"role_en": AUTHOR["role_en"], "role_bn": AUTHOR["role_bn"]},
        )

        for item in STORIES:
            if ArticlePage.objects.filter(slug=item["slug"]).exists():
                self.stdout.write(f"Skipped (exists): {item['slug']}")
                continue
            article = ArticlePage(
                slug=item["slug"],
                title=item["title"],
                title_bn="",
                section=section,
                author=author,
                excerpt_en=item["excerpt"],
                excerpt_bn="",
                body_en=item["body"],
                body_bn="",
                read_count=0,
            )
            root.add_child(instance=article)
            article.first_published_at = now - timedelta(days=item["days_ago"])
            article.save_revision().publish()
            self.stdout.write(f"Created: {item['title']}")

        self.stdout.write(self.style.SUCCESS("English News category and demo articles ready."))

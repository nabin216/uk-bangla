from django.core.management.base import BaseCommand

from news.models import MastheadMember

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


class Command(BaseCommand):
    help = "Populate the footer masthead / editorial team (safe to re-run; only touches MastheadMember)."

    def handle(self, *args, **options):
        for order, (role_en, role_bn, name_en, name_bn) in enumerate(MASTHEAD):
            MastheadMember.objects.update_or_create(
                name_en=name_en,
                defaults={"role_en": role_en, "role_bn": role_bn, "name_bn": name_bn, "sort_order": order},
            )
        self.stdout.write(self.style.SUCCESS(f"Masthead seeded ({MastheadMember.objects.count()} members)."))

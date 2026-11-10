from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand

from news.models import ArticlePage


class Command(BaseCommand):
    help = (
        "Pull any article whose first_published_at is in the future back into the "
        "recent past (keeping relative spacing), so real uploads sort newest. "
        "Only touches publish dates, never article content."
    )

    def handle(self, *args, **options):
        now = datetime.now(timezone.utc)
        future = list(
            ArticlePage.objects.filter(first_published_at__gt=now).order_by("first_published_at")
        )
        if not future:
            self.stdout.write("No future-dated articles. Nothing to do.")
            return

        newest = max(a.first_published_at for a in future)
        for a in future:
            anchor = a.last_published_at or (now - timedelta(days=1))
            new_fp = anchor - (newest - a.first_published_at)
            self.stdout.write(f"{a.slug}: {a.first_published_at:%Y-%m-%d} -> {new_fp:%Y-%m-%d}")
            a.first_published_at = new_fp
            a.save(update_fields=["first_published_at"])
            rev = a.live_revision
            if rev:
                rev.content["first_published_at"] = new_fp.isoformat()
                rev.save(update_fields=["content"])

        self.stdout.write(self.style.SUCCESS(f"Corrected {len(future)} article date(s)."))

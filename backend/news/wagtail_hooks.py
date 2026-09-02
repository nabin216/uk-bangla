from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from wagtail import hooks
from wagtail.admin.menu import MenuItem

from .models import ArticlePage, Comment, NewsletterSubscription, PageView


def dashboard(request):
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    views = PageView.objects.all()

    daily = (
        views.filter(created_at__gte=now - timedelta(days=13))
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(n=Count("id"))
    )
    by_day = {row["day"]: row["n"] for row in daily}
    spark = [
        {"day": today - timedelta(days=offset), "n": by_day.get(today - timedelta(days=offset), 0)}
        for offset in range(13, -1, -1)
    ]

    trending = list(
        ArticlePage.objects.live()
        .annotate(recent_views=Count("views", filter=Q(views__created_at__gte=week_ago)))
        .order_by("-recent_views", "-read_count")[:8]
    )

    context = {
        "total_views": views.count(),
        "today_views": views.filter(created_at__date=today).count(),
        "week_views": views.filter(created_at__gte=week_ago).count(),
        "unique_total": views.values("visitor").distinct().count(),
        "unique_today": views.filter(created_at__date=today).values("visitor").distinct().count(),
        "subscribers": NewsletterSubscription.objects.filter(is_active=True).count(),
        "total_comments": Comment.objects.count(),
        "pending_comments": Comment.objects.filter(is_approved=False).count(),
        "today_comments": Comment.objects.filter(created_at__date=today).count(),
        "trending": trending,
        "recent_comments": Comment.objects.select_related("article")[:12],
        "spark": spark,
        "spark_max": max((point["n"] for point in spark), default=0) or 1,
    }
    return TemplateResponse(request, "wagtailadmin/news_dashboard.html", context)


@hooks.register("register_admin_urls")
def register_dashboard_url():
    return [path("dashboard/", dashboard, name="news_dashboard")]


@hooks.register("register_admin_menu_item")
def register_dashboard_menu_item():
    return MenuItem("Dashboard", reverse("news_dashboard"), icon_name="site", order=-100)

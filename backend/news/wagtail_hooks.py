from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.safestring import mark_safe
from wagtail import hooks
from wagtail.admin.menu import MenuItem
from wagtail.models import Page, Site

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


def news_parent_page():
    """The page new articles should be created under.

    Existing articles all share one parent, so follow the newest one; fall back
    to the default site's root page for a fresh install.
    """
    latest = ArticlePage.objects.order_by("-pk").first()
    if latest:
        return latest.get_parent()
    site = Site.objects.filter(is_default_site=True).first()
    return site.root_page if site else Page.get_first_root_node()


def add_news(request):
    """Jump straight to a blank article form, skipping the page-type chooser."""
    content_type = ContentType.objects.get_for_model(ArticlePage)
    return redirect(
        "wagtailadmin_pages:add",
        content_type.app_label,
        content_type.model,
        news_parent_page().pk,
    )


@hooks.register("register_admin_urls")
def register_dashboard_url():
    return [
        path("dashboard/", dashboard, name="news_dashboard"),
        path("add-news/", add_news, name="news_add_article"),
    ]


@hooks.register("register_admin_menu_item")
def register_dashboard_menu_item():
    return MenuItem("Dashboard", reverse("news_dashboard"), icon_name="site", order=-100)


class AddNewsMenuItem(MenuItem):
    def is_shown(self, request):
        return news_parent_page().permissions_for_user(request.user).can_add_subpage()


@hooks.register("register_admin_menu_item")
def register_add_news_menu_item():
    return AddNewsMenuItem(
        "Add news",
        reverse("news_add_article"),
        icon_name="plus",
        order=-90,
    )


@hooks.register("insert_global_admin_css")
def mobile_admin_css():
    """Make the editor usable one-handed on a phone, so reporters can file news
    from mobile only. Inlined (not a static file) to keep it deploy-proof; the
    rules only bite on narrow screens."""
    return mark_safe(
        "<style>@media (max-width:800px){"
        ".w-field__input input[type=text],.w-field__input input[type=url],"
        ".w-field__input input[type=email],.w-field__input input[type=number],"
        ".w-field__input input[type=search],.w-field__input input[type=password],"
        ".w-field__input textarea,.w-field__input select,"
        ".Draftail-Editor .public-DraftEditor-content{font-size:16px}"
        ".w-field__input input[type=text],.w-field__input input[type=url],"
        ".w-field__input input[type=email],.w-field__input input[type=number],"
        ".w-field__input input[type=search],.w-field__input select{min-height:2.75rem}"
        ".Draftail-Editor__wrapper{min-height:40vh}"
        "}</style>"
    )

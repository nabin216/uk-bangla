import hashlib
import json
from datetime import timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, F, Q
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from wagtail.rich_text import expand_db_html
from .models import (
    ArticlePage, Comment, FooterLink, InfoPage, MenuItem, NewsletterSubscription,
    PageView, Poll, Section, SiteSettings, SocialLink, TickerItem, TrendingTag,
)


def requested_limit(request, default=50, maximum=100):
    value = request.GET.get("limit", str(default))
    try:
        limit = int(value)
    except (TypeError, ValueError):
        raise ValueError("limit must be a whole number.")
    if limit < 1 or limit > maximum:
        raise ValueError(f"limit must be between 1 and {maximum}.")
    return limit

def article_json(article):
    return {
        "id": article.id, "slug": article.slug, "url": article.url,
        "title": {"en": article.title, "bn": article.title_bn},
        "excerpt": {"en": article.excerpt_en, "bn": article.excerpt_bn},
        "body": {"en": expand_db_html(article.body_en), "bn": expand_db_html(article.body_bn)},
        "pull_quote": {"en": article.pull_quote_en, "bn": article.pull_quote_bn},
        "category": {"name": article.section.name_en, "name_bn": article.section.name_bn, "slug": article.section.slug},
        "author": {
            "name": article.author.name_en, "name_bn": article.author.name_bn,
            "role": {"en": article.author.role_en, "bn": article.author.role_bn},
            "bio": {"en": article.author.bio_en, "bn": article.author.bio_bn},
            "avatar": article.author.avatar.file.url if article.author.avatar else None,
        },
        "date": article.first_published_at.isoformat() if article.first_published_at else None,
        "image": article.api_image_url,
        "image_caption": {"en": article.image_caption_en, "bn": article.image_caption_bn},
        "image_credit": article.image_credit,
        "source_url": article.source_url,
        "read_minutes": article.read_minutes,
        "comment_count": getattr(article, "comment_count", None),
        "is_featured": article.is_featured,
        "is_sponsored": article.is_sponsored, "read_count": article.read_count,
    }

def published():
    return (
        ArticlePage.objects.live().public()
        .select_related("section", "author", "image")
        .annotate(comment_count=Count("comments", filter=Q(comments__is_approved=True)))
    )

def comment_json(comment):
    return {
        "id": comment.id,
        "name": comment.name,
        "body": comment.body,
        "date": comment.created_at.isoformat(),
    }

@csrf_exempt
def comments(request, slug):
    article = ArticlePage.objects.live().public().filter(slug=slug).first()
    if not article:
        return JsonResponse({"detail": "Story not found."}, status=404)
    if request.method == "GET":
        rows = article.comments.filter(is_approved=True)
        return JsonResponse({"count": rows.count(), "results": [comment_json(c) for c in rows]})
    if request.method == "POST":
        try:
            payload = json.loads(request.body or "{}")
        except (ValueError, TypeError):
            return JsonResponse({"detail": "Request body must be valid JSON."}, status=400)
        name = (payload.get("name") or "").strip() if isinstance(payload, dict) else ""
        body = (payload.get("body") or "").strip() if isinstance(payload, dict) else ""
        if not name or not body:
            return JsonResponse({"detail": "Name and comment are both required."}, status=400)
        if len(name) > 80 or len(body) > 2000:
            return JsonResponse({"detail": "Name or comment is too long."}, status=400)
        comment = Comment.objects.create(article=article, name=name, body=body)
        return JsonResponse(comment_json(comment), status=201)
    return JsonResponse({"detail": "Method not allowed."}, status=405)

def stories(request):
    qs = published()
    category = request.GET.get("category")
    if category:
        qs = qs.filter(section__slug=category)
    search = request.GET.get("q", "").strip()
    if search:
        from django.db.models import Q
        qs = qs.filter(Q(title__icontains=search) | Q(title_bn__icontains=search) | Q(excerpt_en__icontains=search) | Q(excerpt_bn__icontains=search))
    try:
        limit = requested_limit(request)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    return JsonResponse({"count": qs.count(), "results": [article_json(a) for a in qs[:limit]]})

def homepage(request):
    """Return the compact set of data needed to render the landing page."""
    qs = published()
    try:
        limit = requested_limit(request, default=20)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    return JsonResponse({
        "stories": [article_json(a) for a in qs[:limit]],
        "most_read": [article_json(a) for a in qs.order_by("-read_count", "-first_published_at")[:10]],
        "categories": [section_json(s) for s in Section.objects.all()],
    })

def section_json(section):
    return {"id": section.id, "name": section.name_en, "name_bn": section.name_bn, "slug": section.slug}

def site(request):
    settings_obj = SiteSettings.load(request_or_site=request)

    def dual(en, bn):
        return {"en": en, "bn": bn or en}

    return JsonResponse({
        "settings": {
            "brand_name": settings_obj.brand_name,
            "brand_kicker": settings_obj.brand_kicker,
            "brand_name_bn": settings_obj.brand_name_bn,
            "tagline": dual(settings_obj.tagline_en, settings_obj.tagline_bn),
            "weather_london": settings_obj.weather_london,
            "weather_dhaka": settings_obj.weather_dhaka,
            "gbp_to_bdt_rate": float(settings_obj.gbp_to_bdt_rate),
            "fx_trend_note": dual(settings_obj.fx_trend_note_en, settings_obj.fx_trend_note_bn),
            "footer_blurb": dual(settings_obj.footer_blurb_en, settings_obj.footer_blurb_bn),
            "footer_badge": dual(settings_obj.footer_badge_en, settings_obj.footer_badge_bn),
            "copyright": dual(settings_obj.copyright_en, settings_obj.copyright_bn),
            "newsletter_footnote": dual(settings_obj.newsletter_footnote_en, settings_obj.newsletter_footnote_bn),
            "home_headings": {
                "lead": dual(settings_obj.home_lead_heading_en, settings_obj.home_lead_heading_bn),
                "across": dual(settings_obj.home_across_heading_en, settings_obj.home_across_heading_bn),
                "more": dual(settings_obj.home_more_heading_en, settings_obj.home_more_heading_bn),
                "opinion": dual(settings_obj.home_opinion_heading_en, settings_obj.home_opinion_heading_bn),
            },
        },
        "menu": [{"label": dual(m.label_en, m.label_bn), "url": m.url} for m in MenuItem.objects.filter(is_active=True)],
        "ticker": [dual(t.text_en, t.text_bn) for t in TickerItem.objects.filter(is_active=True)],
        "trending": [t.label for t in TrendingTag.objects.all()],
        "social": [{"label": s.label, "url": s.url, "glyph": s.glyph} for s in SocialLink.objects.all()],
        "footer_links": [
            {"column": link.column, "label": dual(link.label_en, link.label_bn), "url": link.url}
            for link in FooterLink.objects.all()
        ],
        "sections": [section_json(s) for s in Section.objects.all()],
    })

@csrf_exempt
def poll(request):
    active = Poll.objects.filter(is_active=True).prefetch_related("options").first()
    if request.method == "GET":
        if not active:
            return JsonResponse({"detail": "No active poll."}, status=404)
        return JsonResponse(poll_json(active))
    if request.method == "POST":
        if not active:
            return JsonResponse({"detail": "No active poll."}, status=404)
        try:
            payload = json.loads(request.body or "{}")
        except (ValueError, TypeError):
            return JsonResponse({"detail": "Request body must be valid JSON."}, status=400)
        option_id = payload.get("option") if isinstance(payload, dict) else None
        option = active.options.filter(pk=option_id).first()
        if not option:
            return JsonResponse({"detail": "Unknown option."}, status=400)
        active.options.filter(pk=option.pk).update(votes=F("votes") + 1)
        active.refresh_from_db()
        return JsonResponse(poll_json(active), status=201)
    return JsonResponse({"detail": "Method not allowed."}, status=405)

def poll_json(active):
    options = list(active.options.all())
    total = sum(option.votes for option in options)
    return {
        "id": active.id,
        "question": {"en": active.question_en, "bn": active.question_bn or active.question_en},
        "context_label": active.context_label,
        "total_votes": total,
        "options": [
            {"id": option.id, "label": {"en": option.label_en, "bn": option.label_bn or option.label_en}, "votes": option.votes}
            for option in options
        ],
    }

def info_page(request, slug):
    page = InfoPage.objects.filter(slug=slug).first()
    if not page:
        return JsonResponse({"detail": "Page not found."}, status=404)
    return JsonResponse({
        "slug": page.slug,
        "title": {"en": page.title_en, "bn": page.title_bn or page.title_en},
        "body": {"en": expand_db_html(page.body_en), "bn": expand_db_html(page.body_bn) if page.body_bn else expand_db_html(page.body_en)},
    })

def story_detail(request, slug):
    article = published().filter(slug=slug).first()
    if not article:
        return JsonResponse({"detail": "Story not found."}, status=404)
    if request.method == "GET":
        ArticlePage.objects.filter(pk=article.pk).update(read_count=F("read_count") + 1)
    return JsonResponse(article_json(article))

def categories(request):
    return JsonResponse({"results": [section_json(s) for s in Section.objects.all()]})

def most_read(request):
    try:
        limit = requested_limit(request, default=10, maximum=50)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    qs = published().order_by("-read_count", "-first_published_at")[:limit]
    return JsonResponse({"results": [article_json(a) for a in qs]})

def visitor_hash(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = forwarded.split(",")[0].strip() or request.META.get("REMOTE_ADDR", "")
    ua = request.META.get("HTTP_USER_AGENT", "")
    day = timezone.now().strftime("%Y-%m-%d")
    return hashlib.sha256(f"{ip}|{ua}|{day}".encode()).hexdigest()[:64]

@csrf_exempt
@require_http_methods(["POST"])
def track(request):
    try:
        payload = json.loads(request.body or "{}")
    except (ValueError, TypeError):
        return JsonResponse({"detail": "Request body must be valid JSON."}, status=400)
    if not isinstance(payload, dict):
        return JsonResponse({"detail": "Invalid payload."}, status=400)
    path = (payload.get("path") or "").strip()[:300]
    if not path:
        return JsonResponse({"detail": "path is required."}, status=400)
    slug = payload.get("slug")
    article = ArticlePage.objects.filter(slug=slug).first() if slug else None
    visitor = visitor_hash(request)
    cutoff = timezone.now() - timedelta(minutes=30)
    already = PageView.objects.filter(visitor=visitor, path=path, created_at__gte=cutoff).exists()
    if not already:
        PageView.objects.create(path=path, article=article, visitor=visitor)
    return JsonResponse({"ok": True}, status=201)

@csrf_exempt
@require_http_methods(["POST"])
def subscribe(request):
    try:
        payload = json.loads(request.body or "{}")
    except (ValueError, TypeError):
        return JsonResponse({"detail": "Request body must be valid JSON."}, status=400)
    email = payload.get("email", "") if isinstance(payload, dict) else ""
    email = email.strip().lower() if isinstance(email, str) else ""
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"detail": "A valid email address is required."}, status=400)
    NewsletterSubscription.objects.get_or_create(email=email)
    return JsonResponse({"message": "Thanks for subscribing."}, status=201)

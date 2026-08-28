import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import ArticlePage, Section
from .models import NewsletterSubscription


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
        "body": {"en": str(article.body_en), "bn": str(article.body_bn)},
        "category": {"name": article.section.name_en, "name_bn": article.section.name_bn, "slug": article.section.slug},
        "author": {"name": article.author.name_en, "name_bn": article.author.name_bn},
        "date": article.first_published_at.isoformat() if article.first_published_at else None,
        "image": article.api_image_url, "is_featured": article.is_featured,
        "is_sponsored": article.is_sponsored, "read_count": article.read_count,
    }

def published():
    return ArticlePage.objects.live().public().select_related("section", "author", "image")

def stories(request):
    qs = published()
    category = request.GET.get("category")
    if category:
        qs = qs.filter(section__slug=category)
    try:
        limit = requested_limit(request)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    return JsonResponse({"count": qs.count(), "results": [article_json(a) for a in qs[:limit]]})

def story_detail(request, slug):
    article = published().filter(slug=slug).first()
    if not article:
        return JsonResponse({"detail": "Story not found."}, status=404)
    if request.method == "GET":
        ArticlePage.objects.filter(pk=article.pk).update(read_count=F("read_count") + 1)
    return JsonResponse(article_json(article))

def categories(request):
    return JsonResponse({"results": [{"id": s.id, "name": s.name_en, "name_bn": s.name_bn, "slug": s.slug} for s in Section.objects.all()]})

def most_read(request):
    try:
        limit = requested_limit(request, default=10, maximum=50)
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    qs = published().order_by("-read_count", "-first_published_at")[:limit]
    return JsonResponse({"results": [article_json(a) for a in qs]})

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

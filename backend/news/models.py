import re

from django.db import models
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.contrib.settings.models import BaseGenericSetting, register_setting
from wagtail.fields import RichTextField
from wagtail.images import get_image_model_string
from wagtail.models import Orderable, Page
from wagtail.snippets.models import register_snippet

@register_snippet
class Section(models.Model):
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name_en"]
        verbose_name = "section/category"

    def __str__(self):
        return self.name_en

@register_snippet
class Author(models.Model):
    name_en = models.CharField(max_length=150)
    name_bn = models.CharField(max_length=150, blank=True)
    role_en = models.CharField(max_length=150, blank=True)
    role_bn = models.CharField(max_length=150, blank=True)
    bio_en = models.TextField(blank=True)
    bio_bn = models.TextField(blank=True)
    avatar = models.ForeignKey(get_image_model_string(), null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    def __str__(self):
        return self.name_en

@register_snippet
class NewsletterSubscription(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    panels = [FieldPanel("email"), FieldPanel("is_active")]

    class Meta:
        ordering = ["-subscribed_at"]
        verbose_name = "newsletter subscriber"

    def __str__(self):
        return self.email

@register_snippet
class Comment(models.Model):
    article = models.ForeignKey("ArticlePage", on_delete=models.CASCADE, related_name="comments")
    name = models.CharField(max_length=80)
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True, help_text="Uncheck to hide from the site")

    panels = [
        FieldPanel("article"),
        FieldPanel("name"),
        FieldPanel("body"),
        FieldPanel("is_approved"),
    ]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} on {self.article_id}"

class LiveStatus(models.Model):
    """Auto-fetched weather + FX for the header status strip (single row, pk=1)."""
    weather_london = models.CharField(max_length=60, blank=True)
    weather_dhaka = models.CharField(max_length=60, blank=True)
    gbp_to_bdt_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fetched_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "live status strip"
        verbose_name_plural = "live status strip"

    def __str__(self):
        return f"Live status (updated {self.fetched_at:%Y-%m-%d %H:%M})" if self.fetched_at else "Live status (never fetched)"

    @classmethod
    def current(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

class PageView(models.Model):
    path = models.CharField(max_length=300)
    article = models.ForeignKey("ArticlePage", null=True, blank=True, on_delete=models.SET_NULL, related_name="views")
    visitor = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.path} @ {self.created_at:%Y-%m-%d %H:%M}"

class ArticlePage(Page):
    section = models.ForeignKey(Section, on_delete=models.PROTECT, related_name="articles")
    author = models.ForeignKey(Author, on_delete=models.PROTECT, related_name="articles")
    title_bn = models.CharField(max_length=300)
    excerpt_en = models.TextField(blank=True)
    excerpt_bn = models.TextField(blank=True)
    body_en = RichTextField()
    body_bn = RichTextField()
    pull_quote_en = models.TextField(blank=True)
    pull_quote_bn = models.TextField(blank=True)
    image = models.ForeignKey(get_image_model_string(), null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    image_url = models.URLField(blank=True, help_text="External image URL, used when no image is uploaded")
    image_caption_en = models.CharField(max_length=300, blank=True)
    image_caption_bn = models.CharField(max_length=300, blank=True)
    image_credit = models.CharField(max_length=200, blank=True)
    source_url = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_sponsored = models.BooleanField(default=False)
    read_count = models.PositiveIntegerField(default=0)

    parent_page_types = ["wagtailcore.Page"]
    subpage_types = []
    content_panels = Page.content_panels + [
        MultiFieldPanel([FieldPanel("title"), FieldPanel("title_bn"), FieldPanel("section"), FieldPanel("author")], heading="Story"),
        MultiFieldPanel([FieldPanel("excerpt_en"), FieldPanel("excerpt_bn"), FieldPanel("body_en"), FieldPanel("body_bn"), FieldPanel("pull_quote_en"), FieldPanel("pull_quote_bn")], heading="Bilingual content"),
        MultiFieldPanel([FieldPanel("image"), FieldPanel("image_url"), FieldPanel("image_caption_en"), FieldPanel("image_caption_bn"), FieldPanel("image_credit"), FieldPanel("source_url"), FieldPanel("is_featured"), FieldPanel("is_sponsored"), FieldPanel("read_count")], heading="Publishing"),
    ]

    class Meta:
        ordering = ["-first_published_at"]

    @property
    def api_image_url(self):
        if self.image:
            return self.image.file.url
        return self.image_url or None

    @property
    def read_minutes(self):
        words = len(re.sub(r"<[^>]+>", " ", self.body_en or "").split())
        return max(3, round(words / 200)) if words else 3

@register_snippet
class MenuItem(models.Model):
    label_en = models.CharField(max_length=60)
    label_bn = models.CharField(max_length=60, blank=True)
    url = models.CharField(max_length=200, help_text="Path such as / or /category/uk")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    panels = [FieldPanel("label_en"), FieldPanel("label_bn"), FieldPanel("url"), FieldPanel("sort_order"), FieldPanel("is_active")]

    class Meta:
        ordering = ["sort_order"]
        verbose_name = "navigation item"

    def __str__(self):
        return self.label_en

@register_snippet
class TickerItem(models.Model):
    text_en = models.CharField(max_length=200)
    text_bn = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    panels = [FieldPanel("text_en"), FieldPanel("text_bn"), FieldPanel("sort_order"), FieldPanel("is_active")]

    class Meta:
        ordering = ["sort_order"]
        verbose_name = "breaking-news ticker item"

    def __str__(self):
        return self.text_en

@register_snippet
class TrendingTag(models.Model):
    label = models.CharField(max_length=60, help_text="Without the # prefix")
    sort_order = models.PositiveIntegerField(default=0)

    panels = [FieldPanel("label"), FieldPanel("sort_order")]

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"#{self.label}"

@register_snippet
class SocialLink(models.Model):
    label = models.CharField(max_length=40)
    url = models.URLField()
    glyph = models.CharField(max_length=8, help_text="Single character shown in the icon circle")
    sort_order = models.PositiveIntegerField(default=0)

    panels = [FieldPanel("label"), FieldPanel("url"), FieldPanel("glyph"), FieldPanel("sort_order")]

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return self.label

@register_snippet
class FooterLink(models.Model):
    COLUMN_CHOICES = [("explore", "Explore"), ("legal", "Legal")]
    column = models.CharField(max_length=20, choices=COLUMN_CHOICES, default="explore")
    label_en = models.CharField(max_length=60)
    label_bn = models.CharField(max_length=60, blank=True)
    url = models.CharField(max_length=200)
    sort_order = models.PositiveIntegerField(default=0)

    panels = [FieldPanel("column"), FieldPanel("label_en"), FieldPanel("label_bn"), FieldPanel("url"), FieldPanel("sort_order")]

    class Meta:
        ordering = ["column", "sort_order"]

    def __str__(self):
        return f"{self.get_column_display()}: {self.label_en}"

@register_snippet
class Poll(ClusterableModel):
    question_en = models.CharField(max_length=250)
    question_bn = models.CharField(max_length=250, blank=True)
    context_label = models.CharField(max_length=40, blank=True, help_text="Short tag such as UK VISAS")
    is_active = models.BooleanField(default=True)

    panels = [
        FieldPanel("question_en"), FieldPanel("question_bn"), FieldPanel("context_label"),
        FieldPanel("is_active"), InlinePanel("options", label="Options"),
    ]

    class Meta:
        ordering = ["-is_active", "-id"]

    def __str__(self):
        return self.question_en

class PollOption(Orderable):
    poll = ParentalKey(Poll, on_delete=models.CASCADE, related_name="options")
    label_en = models.CharField(max_length=150)
    label_bn = models.CharField(max_length=150, blank=True)
    votes = models.PositiveIntegerField(default=0)

    panels = [FieldPanel("label_en"), FieldPanel("label_bn"), FieldPanel("votes")]

    def __str__(self):
        return self.label_en

@register_snippet
class MastheadMember(models.Model):
    role_en = models.CharField(max_length=120)
    role_bn = models.CharField(max_length=120, blank=True)
    name_en = models.CharField(max_length=150)
    name_bn = models.CharField(max_length=150, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    panels = [
        FieldPanel("role_en"), FieldPanel("role_bn"),
        FieldPanel("name_en"), FieldPanel("name_bn"),
        FieldPanel("sort_order"),
    ]

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "masthead / editorial team member"

    def __str__(self):
        return f"{self.role_en}: {self.name_en}"

@register_snippet
class InfoPage(models.Model):
    slug = models.SlugField(unique=True, help_text="about, contact, privacy, …")
    title_en = models.CharField(max_length=150)
    title_bn = models.CharField(max_length=150, blank=True)
    body_en = RichTextField()
    body_bn = RichTextField(blank=True)

    panels = [FieldPanel("slug"), FieldPanel("title_en"), FieldPanel("title_bn"), FieldPanel("body_en"), FieldPanel("body_bn")]

    class Meta:
        ordering = ["slug"]
        verbose_name = "standing page"

    def __str__(self):
        return self.slug

@register_setting
class SiteSettings(BaseGenericSetting):
    brand_name = models.CharField(max_length=60, default="Guardian")
    brand_kicker = models.CharField(max_length=60, default="UK | BANGLA")
    brand_name_bn = models.CharField(max_length=80, default="ইউকে বাংলা গার্ডিয়ান")
    tagline_en = models.CharField(max_length=200, blank=True)
    tagline_bn = models.CharField(max_length=200, blank=True)

    auto_status_strip = models.BooleanField(default=False, help_text="Auto-update weather + exchange rate from the internet (run 'refresh_live_status' on a schedule). When off, the values below are used as typed.")
    weather_london = models.CharField(max_length=60, default="☁ London 18°C", blank=True)
    weather_dhaka = models.CharField(max_length=60, default="☀ Dhaka 31°C", blank=True)
    gbp_to_bdt_rate = models.DecimalField(max_digits=8, decimal_places=2, default=152.50)
    fx_trend_note_en = models.CharField(max_length=80, blank=True)
    fx_trend_note_bn = models.CharField(max_length=80, blank=True)

    footer_blurb_en = models.TextField(blank=True)
    footer_blurb_bn = models.TextField(blank=True)
    footer_badge_en = models.CharField(max_length=120, blank=True)
    footer_badge_bn = models.CharField(max_length=120, blank=True)
    copyright_en = models.CharField(max_length=160, blank=True)
    copyright_bn = models.CharField(max_length=160, blank=True)
    newsletter_footnote_en = models.CharField(max_length=160, blank=True)
    newsletter_footnote_bn = models.CharField(max_length=160, blank=True)

    contact_heading_en = models.CharField(max_length=80, blank=True, default="Editorial Contact")
    contact_heading_bn = models.CharField(max_length=80, blank=True, default="সম্পাদকীয় যোগাযোগ")
    contact_address = models.TextField(blank=True, help_text="One line per line")
    contact_emails = models.TextField(blank=True, help_text="One email address per line")
    contact_phones = models.TextField(blank=True, help_text="One phone number per line")

    home_lead_heading_en = models.CharField(max_length=120, blank=True)
    home_lead_heading_bn = models.CharField(max_length=120, blank=True)
    home_across_heading_en = models.CharField(max_length=120, blank=True)
    home_across_heading_bn = models.CharField(max_length=120, blank=True)
    home_more_heading_en = models.CharField(max_length=120, blank=True)
    home_more_heading_bn = models.CharField(max_length=120, blank=True)
    home_opinion_heading_en = models.CharField(max_length=120, blank=True)
    home_opinion_heading_bn = models.CharField(max_length=120, blank=True)

    header_banner_enabled = models.BooleanField(default=False, help_text="Show the banner beside the logo in the header")
    header_banner = models.ForeignKey(get_image_model_string(), null=True, blank=True, on_delete=models.SET_NULL, related_name="+", help_text="Recommended 970×90 or 728×90")
    header_banner_image_url = models.URLField(blank=True, help_text="External image URL, used if no image is uploaded")
    header_banner_link = models.URLField(blank=True, help_text="Where the banner links to when clicked")
    header_banner_alt = models.CharField(max_length=150, blank=True, default="Advertisement")

    panels = [
        MultiFieldPanel([
            FieldPanel("brand_name"), FieldPanel("brand_kicker"), FieldPanel("brand_name_bn"),
            FieldPanel("tagline_en"), FieldPanel("tagline_bn"),
        ], heading="Masthead"),
        MultiFieldPanel([
            FieldPanel("auto_status_strip"),
            FieldPanel("weather_london"), FieldPanel("weather_dhaka"), FieldPanel("gbp_to_bdt_rate"),
            FieldPanel("fx_trend_note_en"), FieldPanel("fx_trend_note_bn"),
        ], heading="Status strip & remittance"),
        MultiFieldPanel([
            FieldPanel("contact_heading_en"), FieldPanel("contact_heading_bn"),
            FieldPanel("contact_address"), FieldPanel("contact_emails"), FieldPanel("contact_phones"),
        ], heading="Editorial contact"),
        MultiFieldPanel([
            FieldPanel("footer_blurb_en"), FieldPanel("footer_blurb_bn"),
            FieldPanel("footer_badge_en"), FieldPanel("footer_badge_bn"),
            FieldPanel("copyright_en"), FieldPanel("copyright_bn"),
            FieldPanel("newsletter_footnote_en"), FieldPanel("newsletter_footnote_bn"),
        ], heading="Footer & newsletter"),
        MultiFieldPanel([
            FieldPanel("home_lead_heading_en"), FieldPanel("home_lead_heading_bn"),
            FieldPanel("home_across_heading_en"), FieldPanel("home_across_heading_bn"),
            FieldPanel("home_more_heading_en"), FieldPanel("home_more_heading_bn"),
            FieldPanel("home_opinion_heading_en"), FieldPanel("home_opinion_heading_bn"),
        ], heading="Homepage headings"),
        MultiFieldPanel([
            FieldPanel("header_banner_enabled"),
            FieldPanel("header_banner"),
            FieldPanel("header_banner_image_url"),
            FieldPanel("header_banner_link"),
            FieldPanel("header_banner_alt"),
        ], heading="Header banner / advertisement"),
    ]

    class Meta:
        verbose_name = "site settings"

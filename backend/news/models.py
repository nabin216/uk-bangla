from django.conf import settings
from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.fields import RichTextField
from wagtail.images import get_image_model_string
from wagtail.models import Page
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
    bio_en = models.TextField(blank=True)
    bio_bn = models.TextField(blank=True)
    avatar = models.ForeignKey(get_image_model_string(), null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    def __str__(self):
        return self.name_en

class NewsletterSubscription(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-subscribed_at"]

    def __str__(self):
        return self.email

class ArticlePage(Page):
    section = models.ForeignKey(Section, on_delete=models.PROTECT, related_name="articles")
    author = models.ForeignKey(Author, on_delete=models.PROTECT, related_name="articles")
    title_bn = models.CharField(max_length=300)
    excerpt_en = models.TextField(blank=True)
    excerpt_bn = models.TextField(blank=True)
    body_en = RichTextField()
    body_bn = RichTextField()
    image = models.ForeignKey(get_image_model_string(), null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    is_featured = models.BooleanField(default=False)
    is_sponsored = models.BooleanField(default=False)
    read_count = models.PositiveIntegerField(default=0)

    parent_page_types = ["wagtailcore.Page"]
    subpage_types = []
    content_panels = Page.content_panels + [
        MultiFieldPanel([FieldPanel("title"), FieldPanel("title_bn"), FieldPanel("section"), FieldPanel("author")], heading="Story"),
        MultiFieldPanel([FieldPanel("excerpt_en"), FieldPanel("excerpt_bn"), FieldPanel("body_en"), FieldPanel("body_bn")], heading="Bilingual content"),
        MultiFieldPanel([FieldPanel("image"), FieldPanel("is_featured"), FieldPanel("is_sponsored"), FieldPanel("read_count")], heading="Publishing"),
    ]

    class Meta:
        ordering = ["-first_published_at"]

    @property
    def api_image_url(self):
        return self.image.file.url if self.image else None

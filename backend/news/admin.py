from django.contrib import admin
from .models import Author, Section, ArticlePage, NewsletterSubscription

admin.site.register((Author, Section, ArticlePage, NewsletterSubscription))

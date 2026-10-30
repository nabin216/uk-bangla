from django.contrib import admin
from .models import Author, Section, ArticlePage, NewsletterSubscription, Comment

admin.site.register((Author, Section, ArticlePage, NewsletterSubscription))


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("name", "article", "created_at", "is_approved")
    list_filter = ("is_approved", "created_at")
    search_fields = ("name", "body")
    list_editable = ("is_approved",)
    actions = ["approve", "hide"]

    @admin.action(description="Approve selected comments")
    def approve(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Hide selected comments")
    def hide(self, request, queryset):
        queryset.update(is_approved=False)

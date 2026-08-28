from django.urls import path
from . import views

urlpatterns = [
    path("stories/", views.stories),
    path("stories/<str:slug>/", views.story_detail),
    path("categories/", views.categories),
    path("most-read/", views.most_read),
    path("newsletter/subscribe/", views.subscribe),
]

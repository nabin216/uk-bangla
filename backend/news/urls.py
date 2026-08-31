from django.urls import path
from . import views

urlpatterns = [
    path("site/", views.site),
    path("homepage/", views.homepage),
    path("stories/", views.stories),
    path("stories/<str:slug>/comments/", views.comments),
    path("stories/<str:slug>/", views.story_detail),
    path("categories/", views.categories),
    path("most-read/", views.most_read),
    path("pages/<slug:slug>/", views.info_page),
    path("newsletter/subscribe/", views.subscribe),
    path("poll/", views.poll),
    path("track/", views.track),
]

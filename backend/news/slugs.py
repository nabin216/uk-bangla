"""Bangla-aware slug helpers.

Django's slug machinery (``django.utils.text.slugify`` and
``validators.validate_unicode_slug``) is built around ``\\w``. In Bangla the
dependent vowel signs (কার) and the virama / hasant (্) are Unicode *combining
marks*, not ``\\w`` characters, so the stock tools silently strip them (which
breaks conjuncts) or reject the slug outright -- even with ``allow_unicode=True``
and ``WAGTAIL_ALLOW_UNICODE_SLUGS = True``.

Everything here keeps exactly one thing: ASCII letters/digits, the Bangla
Unicode block (U+0980-U+09FF) and single hyphens. It is a deliberate allow-list
-- no other scripts, no underscores, no punctuation -- so a slug can't smuggle
confusable or bidirectional characters into a URL.
"""

import re
import unicodedata

from django import forms
from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from wagtail.admin.widgets.slug import SlugInput

# ASCII alphanumerics + the whole Bangla block (letters, vowel signs, virama,
# Bengali digits). Used both to build slugs and to validate them.
_SLUG_CHARS = r"a-zA-Z0-9ঀ-৿"
_SLUG_RE = re.compile(rf"^[{_SLUG_CHARS}]+(?:-[{_SLUG_CHARS}]+)*\Z")

validate_bangla_slug = RegexValidator(
    _SLUG_RE,
    message=_(
        "Enter a valid slug: Bangla or English letters, digits and single "
        "hyphens only (no spaces, underscores or punctuation)."
    ),
    code="invalid",
)

# Marks that truncation must never leave dangling at the end of a slug: a virama
# (U+09CD) needs a following consonant, and a lone dependent vowel sign
# (U+09BE-U+09CC, U+09D7) is meaningless on its own.
_TRAILING_MARK_RE = re.compile(r"[া-্ৗ]\Z")


def bangla_slugify(value, max_length=50):
    """Build a URL slug from *value*, keeping Bangla and ASCII, capped at *max_length*.

    Every run of anything else (spaces, the em dash, punctuation) collapses to a
    single hyphen; ASCII is lower-cased. When the result is longer than
    *max_length* it is cut back to the last whole word and any dangling virama /
    vowel sign is removed, so the slug stays valid Bangla.
    """
    value = unicodedata.normalize("NFC", value or "")
    value = re.sub(rf"[^{_SLUG_CHARS}]+", "-", value).strip("-").lower()
    if len(value) <= max_length:
        return value

    head = value[:max_length]
    # If the cut landed inside a word, drop back to the previous hyphen.
    if value[max_length] != "-" and "-" in head:
        head = head[: head.rindex("-")] or head
    head = head.rstrip("-")
    while head and (_TRAILING_MARK_RE.search(head) or unicodedata.combining(head[-1])):
        head = head[:-1]
    return head.rstrip("-")


class BanglaSlugInput(SlugInput):
    """Wagtail's slug input without the client-side auto-slugify.

    The ``w-slug`` Stimulus controller re-slugifies on blur and on title-sync
    using a ``\\p{L}`` / ``\\p{N}`` filter that also drops Bangla combining
    marks. Stripping the controller keeps a hand-typed Bangla slug intact; a
    blank slug is still filled in server-side by :func:`bangla_slugify`.
    """

    def __init__(self, attrs=None):
        super().__init__(attrs)
        for key in list(self.attrs):
            if key == "data-controller" or key.startswith(("data-action", "data-w-slug")):
                self.attrs.pop(key)


class BanglaSlugFormField(forms.SlugField):
    """Form field that validates against :data:`validate_bangla_slug`."""

    default_validators = [validate_bangla_slug]

    def __init__(self, **kwargs):
        # ``allow_unicode=True`` would reinstate validate_unicode_slug; drop it.
        kwargs.pop("allow_unicode", None)
        kwargs.setdefault("widget", BanglaSlugInput)
        super().__init__(**kwargs)


class BanglaSlugField(models.SlugField):
    """``SlugField`` that accepts the Bangla block as well as ASCII.

    Swaps ``validate_unicode_slug`` for :data:`validate_bangla_slug` at both the
    model and form layers and uses the non-stripping slug widget. Column type is
    unchanged (``varchar(50)``), so switching a field to this is a no-op
    database migration.
    """

    default_validators = [validate_bangla_slug]

    def formfield(self, **kwargs):
        kwargs.setdefault("form_class", BanglaSlugFormField)
        kwargs["widget"] = BanglaSlugInput
        kwargs.pop("allow_unicode", None)
        return super().formfield(**kwargs)

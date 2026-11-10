from decimal import Decimal

import requests
from django.core.management.base import BaseCommand
from django.utils import timezone

from news.models import LiveStatus

# WMO weather codes → emoji
WMO = {
    0: "☀", 1: "🌤", 2: "⛅", 3: "☁",
    45: "🌫", 48: "🌫",
    51: "🌦", 53: "🌦", 55: "🌧", 56: "🌧", 57: "🌧",
    61: "🌦", 63: "🌧", 65: "🌧", 66: "🌧", 67: "🌧",
    71: "🌨", 73: "🌨", 75: "❄", 77: "🌨",
    80: "🌦", 81: "🌧", 82: "⛈",
    85: "🌨", 86: "🌨",
    95: "⛈", 96: "⛈", 99: "⛈",
}


def _weather(lat, lon, name):
    resp = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={"latitude": lat, "longitude": lon, "current": "temperature_2m,weather_code"},
        timeout=6,
    )
    resp.raise_for_status()
    current = resp.json()["current"]
    icon = WMO.get(int(current["weather_code"]), "•")
    return f"{icon} {name} {round(current['temperature_2m'])}°C"


class Command(BaseCommand):
    help = "Fetch live London/Dhaka weather and the GBP→BDT rate for the header status strip."

    def handle(self, *args, **options):
        status = LiveStatus.current()

        try:
            status.weather_london = _weather(51.5072, -0.1276, "London")
        except Exception as error:
            self.stderr.write(f"London weather failed: {error}")
        try:
            status.weather_dhaka = _weather(23.7806, 90.4074, "Dhaka")
        except Exception as error:
            self.stderr.write(f"Dhaka weather failed: {error}")
        try:
            resp = requests.get("https://open.er-api.com/v6/latest/GBP", timeout=6)
            resp.raise_for_status()
            bdt = resp.json()["rates"]["BDT"]
            status.gbp_to_bdt_rate = Decimal(str(round(float(bdt), 2)))
        except Exception as error:
            self.stderr.write(f"FX rate failed: {error}")

        status.fetched_at = timezone.now()
        status.save()
        self.stdout.write(self.style.SUCCESS(
            f"London: {status.weather_london} | Dhaka: {status.weather_dhaka} | 1 GBP = {status.gbp_to_bdt_rate} BDT"
        ))

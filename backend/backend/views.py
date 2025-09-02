# backend/backend/views.py
from django.http import HttpResponse
from django.views.generic import View
import os
from pathlib import Path

from django.conf import settings


class FrontendAppView(View):
    """
    Serves the React frontend (index.html) at the root URL.
    """

    def get(self, request):
        try:
            # Point to the Vite build output
            with open(
                Path(settings.BASE_DIR).parent / "frontend" / "dist" / "index.html"
            ) as f:
                return HttpResponse(f.read())
        except FileNotFoundError:
            return HttpResponse(
                """
                <h1>Frontend Not Found</h1>
                <p>Build your React app with <code>npm run build</code> and try again.</p>
                """,
                status=404,
            )

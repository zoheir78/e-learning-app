import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# 1. Set settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# 2. Setup Django apps before importing anything that touches models
django.setup()

# 3. Now it's safe to import routing (which imports consumers)
from chat.routing import websocket_urlpatterns  # Import after setup!

# 4. Define application
application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)

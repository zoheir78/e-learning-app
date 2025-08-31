from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Each user sees only their notifications
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Notifications should always be linked to a user
        serializer.save(user=self.request.user)

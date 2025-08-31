from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()


class NotificationSerializerTest(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="pass123"
        )

        # Create a notification
        self.notification = Notification.objects.create(
            user=self.user, message="Test notification", is_read=False
        )

    def test_notification_serializer_contains_expected_fields(self):
        serializer = NotificationSerializer(instance=self.notification)
        data = serializer.data

        # Check that all expected fields are present
        self.assertEqual(
            set(data.keys()), {"id", "user", "message", "is_read", "created_at"}
        )

        # Check field values
        self.assertEqual(data["message"], "Test notification")
        self.assertEqual(data["is_read"], False)
        self.assertEqual(data["user"], self.user.id)

    def test_notification_serializer_read_only_fields(self):
        # Simulate incoming data
        data = {
            "user": 999,  # Should be ignored
            "message": "Updated message",
            "is_read": True,
            "created_at": "2024-01-01T00:00:00Z",  # Should be ignored
        }

        serializer = NotificationSerializer(
            instance=self.notification, data=data, partial=True
        )
        self.assertTrue(serializer.is_valid())
        updated_notification = serializer.save()

        # Ensure read-only fields were not changed
        self.assertEqual(updated_notification.user, self.user)  # Not 999
        self.assertNotEqual(
            updated_notification.created_at.isoformat(), "2024-01-01T00:00:00"
        )

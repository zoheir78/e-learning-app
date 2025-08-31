from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_user_with_role(self):
        # Create a student user
        user = User.objects.create_user(
            username="jane",
            email="jane@example.com",
            password="pass123",
            role="student",
        )

        # Check fields
        self.assertEqual(user.username, "jane")
        self.assertEqual(user.email, "jane@example.com")
        self.assertEqual(user.role, "student")

        # Test the string representation
        self.assertEqual(str(user), "jane (student)")

    def test_create_teacher_user(self):
        user = User.objects.create_user(
            username="mrsmith",
            email="smith@school.com",
            password="teach123",
            role="teacher",
        )

        self.assertEqual(user.role, "teacher")
        self.assertEqual(str(user), "mrsmith (teacher)")

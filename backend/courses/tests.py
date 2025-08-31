from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Course

User = get_user_model()


class CourseViewsTest(APITestCase):

    def setUp(self):
        # Create test users
        self.teacher = User.objects.create_user(
            username="teacher1",
            email="t1@example.com",
            password="pass123",
            role="teacher",
        )

        self.student = User.objects.create_user(
            username="student1",
            email="s1@example.com",
            password="pass123",
            role="student",
        )

        # Get JWT tokens
        self.teacher_token = str(RefreshToken.for_user(self.teacher).access_token)
        self.student_token = str(RefreshToken.for_user(self.student).access_token)

    def test_teacher_can_create_course(self):
        url = reverse("course-list")  # From ModelViewSet (basename='course')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_token}")

        data = {"title": "Math 101", "description": "Intro to Algebra"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.count(), 1)
        self.assertEqual(Course.objects.first().teacher, self.teacher)

    def test_student_cannot_create_course(self):
        url = reverse("course-list")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_token}")

        data = {"title": "My Course", "description": "Should fail"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Course.objects.count(), 0)

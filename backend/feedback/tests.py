from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from courses.models import Course
from .models import StatusUpdate, Feedback

User = get_user_model()


class FeedbackViewsTest(APITestCase):

    def setUp(self):
        # Create users
        self.student = User.objects.create_user(
            username="student1",
            email="s1@example.com",
            password="pass123",
            role="student",
        )

        self.teacher = User.objects.create_user(
            username="teacher1",
            email="t1@example.com",
            password="pass123",
            role="teacher",
        )

        # Create a course taught by the teacher
        self.course = Course.objects.create(
            title="Math 101", description="Intro to Algebra", teacher=self.teacher
        )

        # Get JWT tokens
        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.teacher_token = str(RefreshToken.for_user(self.teacher).access_token)

    # Test 1: Student Can Post Status Update

    def test_student_can_post_status_update(self):
        url = reverse("status-update-list")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_token}")

        data = {"content": "Feeling great about this course!"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StatusUpdate.objects.count(), 1)
        self.assertEqual(StatusUpdate.objects.first().student, self.student)

    #  Test 2: Teacher Cannot Post Status Update

    def test_teacher_cannot_post_status_update(self):
        url = reverse("status-update-list")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_token}")

        data = {"content": "I'm a teacher and shouldn't post status updates"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(StatusUpdate.objects.count(), 0)

    #  Test 3: Student Can Submit Feedback

    def test_student_can_submit_feedback(self):
        url = reverse("feedback-list")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.student_token}")

        data = {"course": self.course.id, "rating": 5, "comment": "Excellent course!"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feedback.objects.count(), 1)
        self.assertEqual(Feedback.objects.first().student, self.student)

        # Test 4: Teacher Can View Feedback for Their Course

    def test_teacher_can_view_feedback_for_their_course(self):
        # First, student submits feedback
        Feedback.objects.create(
            student=self.student, course=self.course, rating=5, comment="Great class!"
        )

        # Teacher fetches feedback
        url = reverse("feedback-list")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.teacher_token}")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["course"], self.course.id)

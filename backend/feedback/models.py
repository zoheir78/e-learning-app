from django.db import models
from django.conf import settings
from courses.models import Course

User = settings.AUTH_USER_MODEL


class StatusUpdate(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="status_updates"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.content[:30]}"


class Feedback(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="feedbacks"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="feedbacks"
    )
    rating = models.IntegerField()  # e.g., 1-5 stars
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course")  # one feedback per student per course

    def __str__(self):
        return f"{self.student.username} feedback on {self.course.title}"

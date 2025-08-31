from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="courses_taught"
    )

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="enrollments"
    )
    date_enrolled = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "student")

    def __str__(self):
        return f"{self.student} enrolled in {self.course}"


class CourseMaterial(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="materials"
    )
    file = models.FileField(upload_to="course_materials/")
    title = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.title or f"Material for {self.course.title}"

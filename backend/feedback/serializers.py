from rest_framework import serializers
from .models import StatusUpdate, Feedback


class StatusUpdateSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = StatusUpdate
        fields = ["id", "student", "content", "created_at"]


class FeedbackSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Feedback
        fields = [
            "id",
            "student",
            "course",
            "course_title",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["student", "created_at"]

# courses/serializers.py
from rest_framework import serializers
from .models import Course, Enrollment, CourseMaterial
from django.conf import settings
from users.serializers import UserSerializer  # To show teacher details
from feedback.serializers import FeedbackSerializer


# Optional: Import feedback only if you want to nest feedback in course
# But we'll keep it simple and avoid circular imports


class CourseMaterialSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()  # override title

    class Meta:
        model = CourseMaterial
        fields = ["id", "title", "file", "course"]
        read_only_fields = ["course"]

    def get_file(self, obj):
        request = self.context.get("request")
        if obj.file and hasattr(obj.file, "url"):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def get_title(self, obj):
        # If title is blank, use the file name
        if obj.title:
            return obj.title
        return obj.file.name.split("/")[-1] if obj.file else "Untitled"


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)  # Full user data
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "course", "course_title", "student", "date_enrolled"]
        read_only_fields = ["student", "date_enrolled"]

    def validate(self, attrs):
        course = attrs["course"]
        user = self.context["request"].user

        # Prevent duplicate enrollment
        if Enrollment.objects.filter(student=user, course=course).exists():
            raise serializers.ValidationError(
                "You are already enrolled in this course."
            )

        # Only students can enroll
        if user.role != "student":
            raise serializers.ValidationError("Only students can enroll in courses.")

        return attrs


class CourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)  # Show full teacher info
    materials = CourseMaterialSerializer(many=True, read_only=True)
    enrollments = EnrollmentSerializer(many=True, read_only=True)
    feedbacks = serializers.SerializerMethodField()  # Dynamic field

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "materials",
            "enrollments",
            "feedbacks",
        ]

    def get_feedbacks(self, obj):
        """
        Optionally include feedbacks related to this course.
        This avoids needing a direct import from feedback app.
        If you get ImportError, remove this or use a string reference.
        """
        try:
            from feedback.serializers import FeedbackSerializer

            feedbacks = obj.feedbacks.all()  # Related by Course -> Feedback
            return FeedbackSerializer(feedbacks, many=True).data
        except (ImportError, AttributeError):
            return []

    def create(self, validated_data):
        """
        Assign the logged-in user as the teacher.
        This is redundant if you already do it in perform_create,
        but kept here for clarity.
        """
        validated_data["teacher"] = self.context["request"].user
        return super().create(validated_data)


class CourseDetailSerializer(serializers.ModelSerializer):
    teacher = serializers.StringRelatedField()
    materials = CourseMaterialSerializer(many=True, read_only=True)
    feedbacks = FeedbackSerializer(many=True, read_only=True)  # 👈 add this

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "teacher",
            "materials",
            "feedbacks",  # 👈 include in response
        ]

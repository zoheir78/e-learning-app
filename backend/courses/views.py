from rest_framework import viewsets, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied


from .models import Course, Enrollment, CourseMaterial
from .serializers import (
    CourseSerializer,
    EnrollmentSerializer,
    CourseMaterialSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "teacher":
            # teacher sees only their own courses
            return Course.objects.filter(teacher=user)
        elif user.role == "student":
            # students see all courses (or we can filter by enrollment later)
            return Course.objects.all()
        else:
            # admin/staff can see everything
            return Course.objects.all()

    def perform_create(self, serializer):
        # Only teachers can create courses
        if self.request.user.role != "teacher":
            raise PermissionDenied("Only teachers can create courses.")
        serializer.save(teacher=self.request.user)


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return Enrollment.objects.filter(student=user)
        elif user.role == "teacher":
            # teachers can see enrollments in their courses
            return Enrollment.objects.filter(course__teacher=user)
        else:
            # admin/staff see everything
            return Enrollment.objects.all()

    def perform_create(self, serializer):
        # Prevent duplicate enrollments
        student = self.request.user
        course = serializer.validated_data["course"]
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise PermissionDenied("You are already enrolled in this course.")
        serializer.save(student=student)

    #  Students see only their enrollments
    @action(detail=False, methods=["get"], url_path="my-enrollments")
    def my_enrollments(self, request):
        """Return only the logged-in student's enrollments"""
        user = request.user
        if user.role == "student":
            enrollments = Enrollment.objects.filter(student=user)
            serializer = self.get_serializer(enrollments, many=True)
            return Response(serializer.data)
        return Response({"error": "Only students can access this."}, status=403)


class CourseMaterialViewSet(viewsets.ModelViewSet):
    queryset = CourseMaterial.objects.all()
    serializer_class = CourseMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filter materials by course using query param ?course=<id>
        """
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != "teacher":
            raise PermissionDenied("Only teachers can upload materials.")

        # Get course ID from request data
        course_id = self.request.data.get("course")
        if not course_id:
            raise serializers.ValidationError({"course": "This field is required."})

        # Verify teacher owns the course
        try:
            course = Course.objects.get(id=course_id, teacher=self.request.user)
        except Course.DoesNotExist:
            raise PermissionDenied(
                "You can only upload materials for your own courses."
            )

        serializer.save(course=course)

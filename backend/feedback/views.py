from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import StatusUpdate, Feedback
from .serializers import StatusUpdateSerializer, FeedbackSerializer


class StatusUpdateViewSet(viewsets.ModelViewSet):
    serializer_class = StatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get optional student_id from query params
        student_id = self.request.query_params.get("student_id")
        if student_id:
            # Return updates for the requested student
            return StatusUpdate.objects.filter(student__id=student_id)
        if user.role == "student":
            # student sees their own updates
            return StatusUpdate.objects.filter(student=user)
        else:
            # teachers/admins can see all updates
            return StatusUpdate.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != "student":
            raise PermissionDenied("Only students can post status updates.")
        serializer.save(student=self.request.user)

    def destroy(self, request, *args, **kwargs):
        status = self.get_object()
        if status.student != request.user:
            raise PermissionDenied("You can only delete your own status updates.")
        return super().destroy(request, *args, **kwargs)


class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            # student sees only their feedback
            return Feedback.objects.filter(student=user)
        elif user.role == "teacher":
            # teacher sees feedback for their courses
            return Feedback.objects.filter(course__teacher=user)
        else:
            return Feedback.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != "student":
            raise PermissionDenied("Only students can submit feedback.")
        serializer.save(student=self.request.user)

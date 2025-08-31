from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, EnrollmentViewSet, CourseMaterialViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")
router.register(r"materials", CourseMaterialViewSet, basename="material")

urlpatterns = router.urls

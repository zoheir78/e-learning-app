from rest_framework.routers import DefaultRouter
from .views import StatusUpdateViewSet, FeedbackViewSet

router = DefaultRouter()
router.register(r"status-updates", StatusUpdateViewSet, basename="status-update")
router.register(r"feedbacks", FeedbackViewSet, basename="feedback")

urlpatterns = router.urls

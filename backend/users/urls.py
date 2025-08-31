from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    UserDetailView,
    CustomTokenObtainPairView,
    search_users,
    PublicUserDetailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),  # custom login
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", UserDetailView.as_view(), name="user-detail"),
    path("search/", search_users, name="search-users"),
    path("<int:pk>/", PublicUserDetailView.as_view(), name="user-detail"),
]

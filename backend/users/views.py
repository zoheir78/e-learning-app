from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import EmailTokenObtainPairSerializer
from rest_framework.decorators import permission_classes
from rest_framework import status
from django.db.models import Q


from rest_framework.decorators import api_view

from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer  # ← Override

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                # Get user by email from request data
                user = User.objects.get(email=request.data["username"])
                response.data["user"] = UserSerializer(user).data
            except User.DoesNotExist:
                pass
        return response


# Search Users API


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_users(request):
    """
    Allow teachers to search for students and other teachers by username or email.
    Usage: /api/users/search/?q=john
    """
    if request.user.role != "teacher":
        return Response(
            {"detail": "Only teachers can search users."},
            status=status.HTTP_403_FORBIDDEN,
        )

    query = request.GET.get("q", "").strip()
    # Require at least 2 characters
    if len(query) < 2:
        return Response([])

    # Search users by username or email (case-insensitive)
    users = User.objects.filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    ).distinct()

    # Serialize and return
    return Response(UserSerializer(users, many=True).data)


class PublicUserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

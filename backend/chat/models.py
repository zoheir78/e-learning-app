# from django.db import models
# from django.conf import settings
# from courses.models import Course

# User = settings.AUTH_USER_MODEL


# class ChatRoom(models.Model):
#     """
#     A chat room can be either:
#     - Private: one student and one teacher
#     - Course-based: for all students enrolled in a course
#     """

#     name = models.CharField(max_length=255, unique=True, blank=True)
#     course = models.ForeignKey(
#         Course,
#         on_delete=models.CASCADE,
#         related_name="chat_rooms",
#         null=True,
#         blank=True,
#     )
#     participants = models.ManyToManyField(User, related_name="chat_rooms")
#     is_private = models.BooleanField(default=False)

#     def __str__(self):
#         if self.is_private:
#             return f"Private chat ({', '.join([u.username for u in self.participants.all()])})"
#         return self.name or f"Course chat for {self.course.title}"


# class Message(models.Model):
#     room = models.ForeignKey(
#         ChatRoom, on_delete=models.CASCADE, related_name="messages"
#     )
#     sender = models.ForeignKey(User, on_delete=models.CASCADE)
#     content = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         ordering = ["timestamp"]

#     def __str__(self):
#         return f"{self.sender.username}: {self.content[:30]}"


##########     METHOD 2    #####################

from django.db import models
from django.conf import settings
from courses.models import Course

User = settings.AUTH_USER_MODEL


class ChatRoom(models.Model):
    """
    A chat room can be either:
    - Private: one student and one teacher
    - Course-based: for all students enrolled in a course
    """

    name = models.CharField(max_length=255, unique=True, blank=True)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="chat_rooms",
        null=True,
        blank=True,
    )
    participants = models.ManyToManyField(User, related_name="chat_rooms")
    is_private = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Auto-generate a room name for course-based chats
        if not self.name and self.course:
            self.name = f"course_{self.course.id}"
        super().save(*args, **kwargs)

    def __str__(self):
        if self.is_private:
            return f"Private chat ({', '.join([u.username for u in self.participants.all()])})"
        return self.name or f"Course chat for {self.course.title}"


class Message(models.Model):
    room = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"

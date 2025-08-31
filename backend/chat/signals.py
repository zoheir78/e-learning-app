# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from courses.models import Course
# from chat.models import ChatRoom


# @receiver(post_save, sender=Course)
# def create_chat_room(sender, instance, created, **kwargs):
#     if created:
#         ChatRoom.objects.create(
#             course=instance, name=f"course_{instance.id}", is_private=False
#         )
#         print(f"✅ Chat room created for new course: {instance.title}")

# from chat.models import ChatRoom


# def enroll_student_in_course(user, course):
#     # existing enrollment logic
#     enrollment = Enrollment.objects.create(student=user, course=course)

#     # Add student to chat room participants
#     room, _ = ChatRoom.objects.get_or_create(
#         course=course, defaults={"name": f"course_{course.id}", "is_private": False}
#     )
#     room.participants.add(user)
#     room.save()

#     return enrollment


from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.apps import apps
from chat.models import ChatRoom


@receiver(post_migrate)
def create_dashboard_chat(sender, **kwargs):
    if sender.name == "chat":
        ChatRoom.objects.get_or_create(
            name="dashboard_chat", defaults={"is_private": False}
        )

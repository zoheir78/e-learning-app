# chat/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import ChatRoom, Message
from .serializers import MessageSerializer, ChatRoomSerializer

User = get_user_model()


class ChatSerializersTest(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="pass123",
            role="student",
        )
        self.user2 = User.objects.create_user(
            username="bob", email="bob@example.com", password="pass123", role="teacher"
        )

        # Create a chat room
        self.room = ChatRoom.objects.create(name="course-101-chat", is_private=False)
        self.room.participants.set([self.user1, self.user2])

        # Create a message
        self.message = Message.objects.create(
            room=self.room, sender=self.user1, content="Hello, Bob!"
        )

    def test_message_serializer(self):
        serializer = MessageSerializer(instance=self.message)
        data = serializer.data

        # Check all fields
        self.assertEqual(
            set(data.keys()), {"id", "room", "sender", "content", "timestamp"}
        )
        self.assertEqual(data["content"], "Hello, Bob!")

        # Check nested sender
        self.assertEqual(data["sender"]["id"], self.user1.id)
        self.assertEqual(data["sender"]["username"], "alice")
        self.assertEqual(data["sender"]["email"], "alice@example.com")

    def test_chatroom_serializer(self):
        serializer = ChatRoomSerializer(instance=self.room)
        data = serializer.data

        # Check all fields
        self.assertEqual(
            set(data.keys()),
            {"id", "name", "course", "participants", "is_private", "messages"},
        )
        self.assertEqual(data["name"], "course-101-chat")
        self.assertFalse(data["is_private"])
        self.assertIsNone(data["course"])  # No course assigned

        # Check participants
        usernames = [p["username"] for p in data["participants"]]
        self.assertIn("alice", usernames)
        self.assertIn("bob", usernames)

        # Check messages (should include the one we created)
        self.assertEqual(len(data["messages"]), 1)
        msg = data["messages"][0]
        self.assertEqual(msg["content"], "Hello, Bob!")
        self.assertEqual(msg["sender"]["username"], "alice")

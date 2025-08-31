from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message
from .serializers import MessageSerializer
import json

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query params
        query_string = parse_qs(self.scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        if not token:
            await self.close(code=4001)  # No token
            return

        # Validate JWT
        try:
            validated_token = UntypedToken(token)
        except (InvalidToken, TokenError):
            await self.close(code=4002)  # Invalid token
            return

        # Set the authenticated user
        self.scope["user"] = await self.get_user_from_token(token)

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    @database_sync_to_async
    def get_user_from_token(self, token):
        from rest_framework_simplejwt.backends import TokenBackend

        backend = TokenBackend("HS256")
        decoded_data = backend.decode(token, verify=True)
        return User.objects.get(id=decoded_data["user_id"])

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        user = self.scope["user"]

        if not message or not user.is_authenticated:
            return

        # Save message to DB
        msg_obj = await self.save_message(user, self.room_name, message)

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "user": user.username,
                "timestamp": msg_obj.timestamp.isoformat(),
            },
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "message": event["message"],
                    "user": event["user"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    @database_sync_to_async
    def save_message(self, user, room_name, content):
        room = ChatRoom.objects.get(name=room_name)
        return Message.objects.create(room=room, sender=user, content=content)

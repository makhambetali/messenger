import json
from channels.generic.websocket import AsyncWebsocketConsumer
from chat.models import Message
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Получаем имя комнаты из URL маршрута
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        # Присоединяемся к комнате по имени группы
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Покидаем комнату
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    @sync_to_async
    def save_message(self, username, message, room):
        user = User.objects.get(username=username)
        Message.objects.create(username=user, message=message, room=room)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        username = text_data_json["username"]
        room = text_data_json["room"]

        # Сохраняем сообщение в базе данных
        await self.save_message(username, message, room)

        # Отправляем сообщение в комнату группы
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "sendMessage",
                "message": message,
                "username": username,
                "room": room
            }
        )

    # Отправляем сообщение обратно в WebSocket
    async def sendMessage(self, event):
        message = event["message"]
        username = event["username"]
        room = event["room"]

        await self.send(text_data=json.dumps({
            "message": message,
            "username": username,
            "room": room
        }))

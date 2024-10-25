from rest_framework import serializers
from .models import Message
from django.contrib.auth.models import User

class MessageCreateSerializer(serializers.ModelSerializer):
    """добавление сообщения"""
    username_id = serializers.PrimaryKeyRelatedField(
        source='username',
        queryset=User.objects.all()
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',  # maps to the `parent` ForeignKey field
        queryset=Message.objects.all(),
        allow_null=True  # allows `null` if no parent is provided
    )

    class Meta:
        model = Message
        fields = ('room', 'username_id', 'message', 'parent_id')  # use 'parent_id' here


class MessageSerializer(serializers.ModelSerializer):
    """Main serializer for messages in a room"""
    # refer = MessageReplySerializer(many=True)  # recursively include replies

    class Meta:
        model = Message
        fields = ('id', 'room', 'username', 'message', 'timestamp', 'parent_id')
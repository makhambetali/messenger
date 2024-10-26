# models.py
from django.db import models
from django.contrib.auth.models import User

class Message(models.Model):
    room = models.CharField(max_length=50)
    username = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey(
        'self', verbose_name="Родитель", on_delete=models.SET_NULL, blank=True, null=True, related_name='refer'
    )
    def __str__(self):
        return f"{self.username}: {self.message[:50]}"

    @classmethod
    def get_all_rooms(cls):
        return cls.objects.values_list('room', flat=True).distinct()
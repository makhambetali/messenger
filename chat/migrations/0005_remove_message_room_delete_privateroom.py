# Generated by Django 5.1 on 2024-08-17 07:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_privateroom_message_room'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='message',
            name='room',
        ),
        migrations.DeleteModel(
            name='PrivateRoom',
        ),
    ]

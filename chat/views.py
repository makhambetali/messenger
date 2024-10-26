from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.views import View

from chat.models import Message
from chat.serializers import MessageCreateSerializer, MessageSerializer

from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import HttpResponseForbidden

from rest_framework.response import Response
from rest_framework.views import APIView

def login_user(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('main-page')
            else:
                messages.error(request, 'Invalid username or password.')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()

    return render(request, 'chat/login.html', {'form': form})

def register_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
        elif password1 != password2:
            messages.error(request, 'Passwords do not match.')
        else:
            try:
                validate_password(password1)
                user = User.objects.create_user(username=username, password=password1)
                auth_login(request, user)
                return redirect('main-page')
            except ValidationError as e:
                messages.error(request, e.messages[0])

    return render(request, 'chat/register.html')



@login_required
def private_chat(request):
    users = User.objects.exclude(username=request.user.username)
    return render(request, "chat/chatPage.html", {'users':users})

class MessageCreateView(APIView):
    """Добавление отзыва к фильму"""
    def post(self, request):
        review = MessageCreateSerializer(data=request.data)
        print("Received data:", request.data)
        if review.is_valid():
            review.save()
            return Response(status=201)
        else:
            print("Errors:", review.errors)
            return Response(review.errors, status=400)

class RoomMessagesView(APIView):
    """Retrieve all messages for a specific room with nested replies"""

    def get(self, request, room_name):
        messages = Message.objects.filter(room=room_name)  # get root messages only
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
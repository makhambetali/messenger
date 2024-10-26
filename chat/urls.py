from django.urls import path
from chat import views as chat_views
from django.contrib.auth.views import LogoutView
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path("auth/login/", chat_views.login_user, name="login-user"),
    path("auth/register/", chat_views.register_user, name="register-user"),
    path("auth/logout/", LogoutView.as_view(next_page='login-user'), name="logout-user"),

    path("", chat_views.private_chat, name="main-page"),
    path("message/", chat_views.MessageCreateView.as_view()),
    path('messages/room/<str:room_name>/', chat_views.RoomMessagesView.as_view(), name='room-messages'),

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
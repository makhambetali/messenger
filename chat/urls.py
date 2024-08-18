from django.urls import path
from chat import views as chat_views
from django.contrib.auth.views import LogoutView
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    # Chat and home pages
    path("", chat_views.chatPage, name="chat-page"),
    
    # User authentication
    path("auth/login/", chat_views.login_user, name="login-user"),
    path("auth/register/", chat_views.register_user, name="register-user"),
    path("auth/logout/", LogoutView.as_view(next_page='login-user'), name="logout-user"),

    # # Other paths
    # path("test/", chat_views.testPage, name="test-page"),
    path("users/", chat_views.user_list, name="user_list"),
    path("chat/private/<int:user1>_<int:user2>", chat_views.private_chat, name="private-chat"),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
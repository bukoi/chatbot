from django.urls import path
from .views import (
    ChatbotAPIView, 
    UploadImageAPIView, 
    UploadDocumentAPIView, 
    CreatePersonaAPIView,
    ClearChatHistoryAPIView,
    UploadAudioAPIView,
    NewChatAPIView,
    GetChatsAPIView,
    GetChatArrayAPIView,
    TitleAPIView,
    DeleteConversationAPIView,
)

urlpatterns = [
    path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),
    path('chatbot/upload-image/', UploadImageAPIView.as_view(), name='upload_image'),
    path('chatbot/upload-document/', UploadDocumentAPIView.as_view(), name='upload_document'),
    path('chatbot/create-persona/', CreatePersonaAPIView.as_view(), name='create_persona'),
    path('chatbot/clear-history/', ClearChatHistoryAPIView.as_view(), name='clear_history'),
    path('chatbot/upload-audio/', UploadAudioAPIView.as_view(), name='upload_audio'),
    path('chatbot/new-chat/', NewChatAPIView.as_view(), name='new-chat'),
    path('chatbot/get-chats/', GetChatsAPIView.as_view(), name='get-chats'),
    path('chatbot/get-chat-array/<int:conversation_number>/', GetChatArrayAPIView.as_view(), name='get-chat-array-conversation'),
    path('chatbot/delete-conversation/<int:conversation_number>/', DeleteConversationAPIView.as_view(), name='delete-conversation'),
    path('chatbot/update-title/', TitleAPIView.as_view(), name='update-title'),
]

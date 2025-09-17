from django.contrib import admin
from .models import ChatSession, ChatMessage, DocumentUpload, ImageUpload, Persona, AudioUpload

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'created_at', 'updated_at')
    search_fields = ('session_id',)
    ordering = ('-created_at',)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'role', 'text', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('text', 'session__session_id')
    ordering = ('-created_at',)


@admin.register(DocumentUpload)
class DocumentUploadAdmin(admin.ModelAdmin):
    list_display = ('session', 'uploaded_at')
    search_fields = ('session__session_id',)
    ordering = ('-uploaded_at',)


@admin.register(ImageUpload)
class ImageUploadAdmin(admin.ModelAdmin):
    list_display = ('session', 'uploaded_at')
    search_fields = ('session__session_id',)
    ordering = ('-uploaded_at',)

@admin.register(AudioUpload)
class AudioUploadAdmin(admin.ModelAdmin):
    list_display = ('session', 'uploaded_at')
    search_fields = ('session__session_id',)
    ordering = ('-uploaded_at',)


@admin.register(Persona)
class PersonaAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_default', 'created_at')
    list_filter = ('is_default',)
    search_fields = ('name', 'description')
    ordering = ('-created_at',)

from django.db import models
from django.db.models import Max

class ChatSession(models.Model):
    session_id = models.CharField(max_length=255, unique=True)
    conversation_number = models.PositiveIntegerField(unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.conversation_number:
            last_conversation = ChatSession.objects.aggregate(Max('conversation_number'))
            next_number = (last_conversation['conversation_number__max'] or 0) + 1
            self.conversation_number = next_number
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Session {self.conversation_number} - {self.session_id}"


# ChatMessage Model to store user and model messages
class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('model', 'Model'),
    )
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE)
    conversation_number = models.PositiveIntegerField(default=1)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.TextField(blank=True, null=True)
    # Using Django's built-in JSONField (available in Django 3.1+)
    parts = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255, default="New Chat")

    def __str__(self):
        return f"{self.session.session_id} - {self.role} - Conversation {self.conversation_number}"

# Represents an uploaded document file (PDF or TXT) along with extracted text.
class DocumentUpload(models.Model):
    session = models.ForeignKey(ChatSession, related_name='documents', on_delete=models.CASCADE)
    extracted_text = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document {self.id} for session {self.session.session_id}"

# Represents an uploaded image.
class ImageUpload(models.Model):
    session = models.ForeignKey(ChatSession, related_name='images', on_delete=models.CASCADE)
    image_base64 = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id} for session {self.session.session_id}"

class AudioUpload(models.Model):
    session = models.ForeignKey(ChatSession, related_name='audio', on_delete=models.CASCADE)
    audio_base64 = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audio {self.id} for session {self.session.session_id}"

# Represents a persona configuration, allowing customization of the bot's behavior.
class Persona(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    system_instruction = models.TextField()
    # A flag that could be used to indicate a default persona.
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

from django.core.management.base import BaseCommand
from chatbot.models import ChatSession, ChatMessage

class Command(BaseCommand):
    help = 'Convert existing data to use UUIDs while preserving conversation numbers'

    def handle(self, *args, **options):
        self.stdout.write('Converting existing data to use UUIDs...')
        
        # First ensure all ChatSessions have UUIDs
        sessions = ChatSession.objects.all()
        for session in sessions:
            if not session.id:
                session.save()
                self.stdout.write(f'Session {session.conversation_number} updated with UUID {session.id}')
        
        # Then update all related messages
        messages = ChatMessage.objects.all()
        for message in messages:
            if not message.id:
                message.save()
                self.stdout.write(f'Message updated with UUID {message.id}')
        
        self.stdout.write(self.style.SUCCESS('Successfully converted data to use UUIDs'))
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
import base64
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai
from django.conf import settings
from io import BytesIO
import os
import PyPDF2
import base64
# Import our Django models
from .models import ChatSession, ChatMessage, DocumentUpload, ImageUpload, Persona, AudioUpload
import json
from django.http import JsonResponse
import uuid
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
# Configure Gemini API using the API key from settings
genai.configure(api_key="AIzaSyDE5rgyd0AEew5Q3-3ip9v2oOTI6CPUp5M")
default_persona = (
    "You are an intelligent and helpful assistant. "
    "You communicate in a clear, professional, and friendly manner. "
    "You focus on providing accurate advice and structured recommendations without unnecessary embellishments or roleplaying."
)

system_instruction1 = (
    "You are a friendly advisor specializing in rainwater harvesting and groundwater recharge. "
    "You chat naturally with the user, asking gentle clarifying questions to understand their situation "
    "before giving detailed suggestions. Your role is to guide users on how rainwater harvesting can work "
    "in their location, including potential water collection, costs, and benefits. "
    "Always respond in clean formatting only. "

    "⚡ Formatting Rules: "
    "- Use <h2> for section headers (e.g., 'Overview', 'Benefits', 'Costs', 'Local Services'). "
    "- Use <p> for short paragraphs (2–3 sentences). "
    "- Use <strong> to highlight important numbers (rainfall, costs, liters). "
    "- Use <ul><li> for lists with emojis: ✅ for benefits, ⚠️ for challenges, 💡 for tips. "
    "- Use <table> for cost or method comparisons. "
    "- Never use Markdown. "
    "- Never output raw JSON unless explicitly asked. "
    "- Do not use any tags other than <h2>, <p>, <strong>, <ul><li>, <table>."

    "⚡ Content Rules: "
    "- Start conversations in a friendly way, then gradually ask questions like location, water usage, "
    "available rooftop/land area, purpose (domestic/agricultural/industrial), groundwater level condition, and budget. "
    "- Keep the conversation fluid: do not ask all questions at once, but weave them naturally as part of the dialogue. "
    "- Based on user inputs, suggest the most suitable rainwater harvesting system "
    "(e.g., rooftop recharge, surface runoff harvesting, recharge wells, modular tanks). "
    "- If user gives a location: "
    "Mention local rainfall (if available), potential liters harvested, and groundwater recharge benefit. "
    "Provide approximate cost ranges. "
    "Suggest 2–3 local organizations, contractors, or government programs in that city/state. "
    "- If user doesn’t give a location: "
    "Politely ask for it to provide accurate info and local service providers. "
    "- If local service info is not available: "
    "Clearly say so and guide user to search government urban development/water conservation offices. "

    "⚡ Tone: "
    "Keep it conversational, friendly, and informative. "
    "Encourage sustainable water use. "
    "Always explain why rainwater harvesting is beneficial in their situation. "
)






# Initialize Gemini Model with the default (Moriarty) persona
# Initialize Gemini Model with the Moriarty persona
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    system_instruction=default_persona +
    " " + system_instruction1,
)


# Helper function: Get or create a ChatSession for the client
def get_chat_session(request, new_conversation=False):
    
    if new_conversation:
        # Create a new session with a unique session_id
        session_id = f"{str(request.META.get('REMOTE_ADDR', 'anonymous'))}"
        session = ChatSession.objects.create(session_id=session_id)
    else:
        # Get or create session using IP address
        session_id = str(request.META.get('REMOTE_ADDR', 'anonymous'))
        session, created = ChatSession.objects.get_or_create(session_id=session_id)

    return session

# Convert stored ChatMessage objects into the conversation list expected by Gemini API
def build_conversation(session, conversation_number=None):
    # If conversation_number is provided, filter messages for that specific conversation
    if conversation_number is not None:
        messages = ChatMessage.objects.filter(
            conversation_number=conversation_number
        ).order_by('created_at')
    else:
        # Otherwise, use the current session's messages
        messages = ChatMessage.objects.filter(
            session=session,
            conversation_number=session.conversation_number
        ).order_by('created_at')
    
    conversation = []
    for msg in messages:
        if msg.parts:
            conversation.append({"role": msg.role, "parts": msg.parts})
        else:
            conversation.append({"role": msg.role, "parts": [msg.text]})
    return conversation

class ChatbotAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Check if the user wants to start a new conversation
        start_new_conversation = request.data.get("start_new_conversation", False)
        # Get the conversation number if provided
        conversation_number = request.data.get("conversation_number")
        
        # Get or create the session for the user
        session = get_chat_session(request, new_conversation=start_new_conversation)

        # If no conversation number provided, use the current session's conversation number
        if conversation_number is None:
            conversation_number = session.conversation_number

        user_message = request.data.get("message", "")
        if not user_message:
            return Response({"response": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

        # Save user's message with conversation number
        ChatMessage.objects.create(
            session=session,
            role='user',
            text=user_message,
            conversation_number=conversation_number
        )

        # Build conversation history for API call
        conversation = build_conversation(session, conversation_number)

        # Generate response using Gemini API
        api_response = model.generate_content(conversation, generation_config={"temperature": 0.9})
        

        # Save model's response with conversation number
        ChatMessage.objects.create(
            session=session,
            role='model',
            text=api_response.text,
            conversation_number=conversation_number
        )

        return Response({
            "response": api_response.text,
            "conversation_number": conversation_number
        }, status=status.HTTP_200_OK)

class NewChatAPIView(APIView):
    permission_classes = [AllowAny]  # Adjust permissions based on your need

    def post(self, request):
        # Get session ID from the request (can be from user IP or custom session ID)
        session_id = str(request.META.get('REMOTE_ADDR', 'anonymous'))

        # Try to get the existing chat session or create a new one
        chat_session, created = ChatSession.objects.get_or_create(session_id=session_id)

        # If the session already exists, increment the conversation_number
        if not created:
            chat_session.conversation_number += 1
            chat_session.save()

        # Generate the conversation title for the previous conversation (current - 1)
        
        # Return the session details
        return Response({
            "message": "New chat session created or conversation number incremented",
            "session_id": chat_session.session_id,
            "conversation_number": chat_session.conversation_number,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class UploadImageAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Get the conversation number if provided
        conversation_number = request.data.get("conversation_number")
        
        # Get the existing session using IP address
        session_id = str(request.META.get('REMOTE_ADDR', 'anonymous'))
        session = ChatSession.objects.get(session_id=session_id)

        # If no conversation number provided, use the current session's conversation number
        if conversation_number is None:
            conversation_number = session.conversation_number

        user_img = request.FILES.get("image")
        if not user_img:
            return Response({"response": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the image file to the database

        # Reset the pointer before reading
        user_img.seek(0)
        image_bytes = user_img.read()

        # Encode the image bytes using Base64
        encoded_image = base64.b64encode(image_bytes).decode('utf-8')
        parts = [{"mime_type": user_img.content_type, "data": encoded_image}]

        ImageUpload.objects.create(session=session, image_base64=encoded_image)
        # Add conversation_number to ChatMessage creation
        ChatMessage.objects.create(
            session=session, 
            role='user', 
            parts=parts,
            conversation_number=conversation_number
        )

        # Build conversation history and get API response
        conversation = build_conversation(session, conversation_number)  # Add conversation_number parameter
        api_response = model.generate_content(conversation, generation_config={"temperature": 0.9})

        # Add conversation_number to response message
        ChatMessage.objects.create(
            session=session, 
            role='model', 
            text=api_response.text,
            conversation_number=conversation_number
        )

        return Response({
            "response": api_response.text,
            "conversation_number": conversation_number  # Add conversation_number to response
        }, status=status.HTTP_200_OK)

class UploadDocumentAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        conversation_number = request.data.get("conversation_number")
        session_id = str(request.META.get('REMOTE_ADDR', 'anonymous'))
        session = ChatSession.objects.get(session_id=session_id)

        # If no conversation number provided, use the current session's conversation number
        if conversation_number is None:
            conversation_number = session.conversation_number
        user_doc = request.FILES.get("document")
        print(user_doc)

        if not user_doc:
            return Response({"response": "No document provided"}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(user_doc.name)[1].lower()
        extracted_text = ""

        # Handle TXT files
        if ext == ".txt":
            document_bytes = user_doc.read()
            extracted_text = document_bytes.decode("utf-8")

        # Handle PDF files
        elif ext == ".pdf":
            document_bytes = user_doc.read()
            pdf_reader = PyPDF2.PdfReader(BytesIO(document_bytes))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        else:
            return Response({"response": "Only PDF and TXT files are supported"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the document and its extracted text
        DocumentUpload.objects.create(session=session, extracted_text=extracted_text)

        # Record the extracted text as a user message
        ChatMessage.objects.create(session=session, role='user', parts=[{"text": extracted_text}], conversation_number=conversation_number)

        # Build conversation history and generate response
        conversation = build_conversation(session, conversation_number)
        api_response = model.generate_content(conversation, generation_config={"temperature": 0.9})

        # Save the model's response
        ChatMessage.objects.create(session=session, role='model', text=api_response.text, conversation_number=conversation_number)

        return Response({"response": api_response.text}, status=status.HTTP_200_OK)

class UploadAudioAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        conversation_number = request.data.get("conversation_number")
        session_id = str(request.META.get('REMOTE_ADDR', 'anonymous'))
        session = ChatSession.objects.get(session_id=session_id)

        # If no conversation number provided, use the current session's conversation number
        if conversation_number is None:
            conversation_number = session.conversation_number
        user_audio = request.FILES.get("audio")
        if not user_audio:
            return Response({"response": "No audio provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Log file details
        print(f"Received audio: {user_audio.name}, size: {user_audio.size}, type: {user_audio.content_type}")

        # Reset the pointer before reading
        user_audio.seek(0)
        audio_bytes = user_audio.read()
        print(f"Audio bytes length: {len(audio_bytes)}")

        # Encode the audio bytes using Base64
        encoded_audio = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"Encoded audio string length: {len(encoded_audio)}")
        parts = [{"mime_type": user_audio.content_type, "data": encoded_audio}]

        # Save the audio to the database
        AudioUpload.objects.create(
            session=session, 
            audio_base64=encoded_audio
        )

        # Save the user's audio message as a ChatMessage with parts and conversation_number
        ChatMessage.objects.create(
            session=session, 
            role='user', 
            parts=parts,
            conversation_number=conversation_number
        )

        # Build conversation history and get API response
        conversation = build_conversation(session, conversation_number)
        api_response = model.generate_content(conversation, generation_config={"temperature": 0.9,"max_output_tokens": 500})

        # Save the response message with conversation_number
        ChatMessage.objects.create(
            session=session, 
            role='model', 
            text=api_response.text,
            conversation_number=conversation_number
        )

        return Response({
            "response": api_response.text,
            "conversation_number": conversation_number
        }, status=status.HTTP_200_OK)

class CreatePersonaAPIView(APIView):
    """
    API endpoint to allow the user to change the bot's persona.
    By default, if no description is provided, it will use the Moriarty persona.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get("name", "").strip()
        base_description = request.data.get("description", "").strip()

        if not name:
            return Response({"response": "Please provide a name for the persona"},
                            status=status.HTTP_400_BAD_REQUEST)

        global model

        # Default to Moriarty persona if no description is provided
        if not base_description:
            description = default_persona
        else:
            # Use the model to expand the base_description into a fuller persona
            persona_prompt = (
                f"Using the following text: '{base_description}', your name is '{name}.' generate a vivid, creative, and engaging persona. "
                "Make it unique and detailed, suitable as a systeminstruction prompt. Avoid abusive words, and limit the response to 150 tokens.""No abusive words. Max tokens=150. Use proper spacing,""check what kind of responses user wants and engage them in a conversation you are a master communicator"
            )
            temp_model = genai.GenerativeModel(model_name="gemini-2.0-flash")
            response = temp_model.generate_content(persona_prompt, generation_config={"temperature": 0.9})
            description = response.text.strip()

        system_instruction = (
            f"You are a Person named {name}. {description} "
            "No abusive words. Max tokens=150. Use proper spacing, check what kind of responses user wants and engage them in a conversation you are a master communicator"
        )

        # Update the global Gemini model with the new persona
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_instruction,
        )

        # Save the new persona to the database
        Persona.objects.create(name=name, description=description, system_instruction=system_instruction)

        return Response({"name": name, "description": description}, status=status.HTTP_200_OK)


    
class GetChatsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Get the ChatSession with the largest conversation number
        if ChatSession.objects.exists():
            latest_conversation_number = ChatSession.objects.order_by('-conversation_number').first().conversation_number
            conversation_data = []
            for conversation_number in range(1, latest_conversation_number + 1):
                message = ChatMessage.objects.filter(conversation_number=conversation_number).first()
                if message:
                    title = message.title
                    conversation_data.append({
                        'conversation_number': conversation_number,
                        'title': title
                    })
                else:
                    conversation_data.append({
                        'conversation_number': conversation_number,
                        'title': "New Chat"
                    })
            return JsonResponse(conversation_data, safe=False)
        else:
            # Create a new session if no existing session or messages
            if not ChatSession.objects.exists():
                unique_session_id = f"{str(request.META.get('REMOTE_ADDR', 'anonymous'))}"
                session = ChatSession.objects.create(session_id=unique_session_id)
            return JsonResponse({'conversation_number': 1, 'title': "New Chat"}, safe=False)

class GetChatArrayAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, conversation_number):
        # Get all messages for the specific conversation number
        messages = ChatMessage.objects.filter(
            conversation_number=conversation_number
        ).order_by('created_at').values('role', 'text', 'created_at', 'parts', 'title')
        
        # Format messages in chronological order with their roles
        chat_history = []
        for message in messages:
            message_data = {
                'type': 'user' if message['role'] == 'user' else 'bot',
                'timestamp': message['created_at'].isoformat(),
            }
            
            # Check if text is empty and parts contains image data
            if not message['text'] and message['parts']:
                # Check if parts contains image data
                if isinstance(message['parts'], list):
                    for part in message['parts']:
                        if part.get('type') == 'image' or part.get('mime_type', '').startswith('image/'):
                            message_data['content'] = None
                            
                            # Get image data and prepare it for display
                            image_data = part.get('data')
                            if image_data:
                                # If data is already in base64 format with a data URI scheme
                                if image_data.startswith('data:image/'):
                                    message_data['imageUrl'] = image_data
                                else:
                                    # Ensure it has proper data URI format
                                    mime_type = part.get('mime_type', 'image/jpeg')
                                    message_data['imageUrl'] = f'data:{mime_type};base64,{image_data}'
                            else:
                                # If there's a URL instead of raw data
                                message_data['imageUrl'] = part.get('url') or part.get('image_url')
                                
                            message_data['message_type'] = 'image'
                            break
            else:
                message_data['content'] = message['text']
            
            chat_history.append(message_data)

        return JsonResponse({
            'chat_history': chat_history,
        })
    
class ClearChatHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        session = get_chat_session(request)
        conversation_number = request.data.get("conversation_number")
        ChatMessage.objects.all().filter(session=session , conversation_number=conversation_number).delete()
        DocumentUpload.objects.all().filter(session=session).delete()
        ImageUpload.objects.all().filter(session=session).delete()
        AudioUpload.objects.all().filter(session=session).delete()
        return Response({"response": "Chat history cleared successfully."}, status=status.HTTP_200_OK)

class GetAllConversationsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Get all unique conversation numbers
        conversation_numbers = ChatMessage.objects.values_list('conversation_number', flat=True).distinct().order_by('conversation_number')
        
        # Create a list of dictionaries with conversation number and title
        conversations_list = []
        
        for convo_num in conversation_numbers:
            # Get the title from any message in this conversation (they all have the same title)
            message = ChatMessage.objects.filter(conversation_number=convo_num).first()
            if message:
                conversations_list.append({
                    'conversation_number': convo_num,
                    'title': message.title
                })
        
        return JsonResponse({'conversations': conversations_list}, safe=False)

class TitleAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Get all unique conversation numbers
        all_convo_numbers = ChatMessage.objects.all().values_list('conversation_number', flat=True).distinct().order_by('conversation_number')
        
        # Check if there are any conversations
        if len(all_convo_numbers) > 0:
            for convo_number in all_convo_numbers:
                # Check if this conversation already has a custom title
                existing_message = ChatMessage.objects.filter(conversation_number=convo_number).first()
                
                # Only proceed if the conversation has the default "New Chat" title
                if existing_message and existing_message.title == "New Chat":
                    # Get all messages for this conversation
                    convo_messages = ChatMessage.objects.filter(conversation_number=convo_number).values_list('text', flat=True)
                    
                    # Skip empty conversations
                    if not convo_messages or len(convo_messages) == 0:
                        continue
                    
                    try:
                        # Initialize the model and generate title
                        model1 = genai.GenerativeModel(
                            model_name="gemini-2.0-flash", 
                            system_instruction="Analyze the user's conversation to determine the main topic, identify key phrases, and generate a concise, descriptive title (5-10 words) in title case that accurately reflects the discussion; prioritize clarity, relevance, and the most prominent theme while avoiding vague or generic wording about 10 words and no quotes just words."
                        )
                        
                        # Convert to list and filter out None values
                        convo_text = [text for text in convo_messages if text]
                        
                        # Generate title only if there are messages with text
                        if convo_text:
                            response = model1.generate_content(convo_text, generation_config={"temperature": 0.9})
                            title = response.text.strip()
                            
                            # Update all messages in this conversation with the new title
                            ChatMessage.objects.filter(conversation_number=convo_number).update(title=title)
                    except Exception as e:
                        # Log any errors but continue processing
                        print(f"Error generating title for conversation {convo_number}: {str(e)}")
                      
            return Response({"message": "Titles generated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "No conversations found"}, status=status.HTTP_404_NOT_FOUND)

class DeleteConversationAPIView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, conversation_number):
        # Find the chat session that has the specific conversation number
        chat_session = ChatSession.objects.filter(conversation_number=conversation_number).first()
        
        if chat_session:
            # Delete all messages related to the session
            chat_session.messages.all().delete()
            # Optionally, delete associated documents, images, and audio as well
            chat_session.documents.all().delete()
            chat_session.images.all().delete()
            chat_session.audio.all().delete()
            # Delete the session itself
            chat_session.delete()
            
            return Response(
                {"message": f"Conversation {conversation_number} and its related data have been deleted."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": f"Conversation with number {conversation_number} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
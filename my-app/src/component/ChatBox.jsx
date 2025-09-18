import { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { RiRobot2Fill } from "react-icons/ri";
import DOMPurify from 'dompurify';
export default function ChatBox({response_chats, user_chats, selected_conversation, switchConversation, user_image}) {
  // Combined chat history array with both user and bot messages
  const [chatHistory, setChatHistory] = useState([]);
  
  useEffect(() => {
    fetchChatHistory(selected_conversation);
  }, [selected_conversation, switchConversation, response_chats]);

  const fetchChatHistory = async (conversationNumber) => {
    try {
      const response = await fetch(`http://localhost:8000/chatbot/get-chat-array/${conversationNumber}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      const data = await response.json();
      setChatHistory(data.chat_history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  useEffect(() => {
    if (user_chats && user_chats.length > 0) {
      const newUserMessage = {
        type: 'user',
        content: user_chats[user_chats.length - 1],
        timestamp: new Date().toISOString(),
        message_type: 'text'  // Default to text type
      };
      setChatHistory(prev => [...prev, newUserMessage]);
    }
  }, [user_chats]);

  useEffect(() => {
    if (response_chats && response_chats.length > 0) {
      const newBotMessage = {
        type: 'bot',
        content: response_chats[response_chats.length - 1].response,
        timestamp: new Date().toISOString(),
        message_type: 'text'
      };
      setChatHistory(prev => [...prev, newBotMessage]);
    }
  }, [response_chats]);

  // Add image to chat history when user uploads an image
  useEffect(() => {
    if (user_image) {
      // Create a URL for the image file
      const imageUrl = URL.createObjectURL(user_image);
      
      const newImageMessage = {
        type: 'user',
        content: null, // Text content is null for image messages
        imageUrl: imageUrl, // Add the image URL
        timestamp: new Date().toISOString(),
        message_type: 'image'
      };
      
      setChatHistory(prev => [...prev, newImageMessage]);
      
      // Clean up the URL object when component unmounts or user_image changes
      return () => {
        URL.revokeObjectURL(imageUrl);
      };
    }
  }, [user_image]);

  // Helper to render message content based on type
  

const renderMessageContent = (message) => {
  if (message.message_type === 'image') {
    return (
      <img 
        src={message.imageUrl} 
        alt={`${message.type === 'user' ? 'User' : 'Bot'} image`} 
        className="max-w-full max-h-64 rounded-lg object-contain"
      />
    );
  } else if (message.message_type === 'audio') {
    return (
      <audio 
        src={message.audioUrl} 
        controls 
        className="max-w-full" 
      />
    );
  } else {
    return (
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />
    );
  }
};


  return (
    <div className="flex-grow p-6 overflow-auto space-y-6">
      {chatHistory.map((message, index) => (
        <div
          key={`message-${index}-${message.timestamp}`}
          className="flex items-start gap-4 mb-6 animate-slideIn"
        >
          {message.type === 'user' ? (
            // User message
            <div className="flex items-start gap-4 w-full">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FaUser className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">You</p>
                <div className="bg-blue-50 rounded-lg p-4 text-gray-700">
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          ) : (
            // Bot message
            <div className="flex items-start gap-4 w-full">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <RiRobot2Fill className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">Assistant</p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

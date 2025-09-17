import { useState, useEffect } from "react";

export default function Sidebar({ total_conversations, selected_conversation, setSelectedConversation, refreshConversations }) {
  const [chat_array, setChatArray] = useState([]);

  useEffect(() => {
    setChatArray(total_conversations);
  }, [total_conversations]);

  // Display a default item if chat_array is null or empty
  const displayItems = chat_array && chat_array.length > 0 
    ? chat_array 
    : [{ conversation_number: 1, title: "New Chat" }];

  const handleDelete = async (e, conversationNumber) => {
    e.stopPropagation(); // Prevent the click event from selecting the conversation

    try {
      const response = await fetch(`http://localhost:8000/chatbot/delete-conversation/${conversationNumber}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.message === "Conversation deleted successfully") {
        // Update local state to immediately reflect deletion
        setChatArray(prevArray => prevArray.filter(chat => chat.conversation_number !== conversationNumber));

        // Refresh the conversation list if needed
        await refreshConversations();

        // If the deleted conversation was the selected one, set selected conversation to null or the next available one
        if (conversationNumber === selected_conversation) {
          // Optionally, select the next available conversation or reset selection
          const nextConversation = chat_array.length > 1 ? chat_array[0].conversation_number : null;
          setSelectedConversation(nextConversation);
          console.log("Deleted the currently selected conversation");
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="lg:w-[30%] md:w-[42%] bg-gray-100 border-r-2 border-gray-200 box-shadow-lg shadow-gray-200">
      <div className="flex flex-col items-center gap-4 w-full p-4 overflow-y-auto">
        {displayItems.map((num) => (
          <div
            key={num.conversation_number}
            onClick={() => setSelectedConversation(num.conversation_number)}
            className={`w-[90%] py-3 flex flex-col px-4 justify-center rounded-lg shadow-md cursor-pointer transition-colors relative
              ${num.conversation_number === selected_conversation ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
          >
            <div className="absolute top-2 right-2">
              <button 
                onClick={(e) => handleDelete(e, num.conversation_number)}
                className="text-gray-500 hover:text-red-500 transition-colors"
                aria-label="Delete conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Chat Session {num.conversation_number}</p>
            <p className="text-base font-semibold text-gray-800 truncate pr-6">{num.title || "New Chat"}</p>
          </div>
        ))}
        {displayItems.length === 0 && (
          <div className="w-[90%] py-6 px-4 text-center bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}

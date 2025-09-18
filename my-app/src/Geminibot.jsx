import React from "react";
import Navbar from "./component/Navbar";
import Sidebar from "./component/Sidebar";
import ChatBar from "./component/ChatBar";
import ChatBox from "./component/ChatBox";
import { useState, useEffect } from "react";

export default function Geminibot() {
  const [user_chats, setUserChats] = useState([]);
  const [response_chats, setResponseChats] = useState([]);
  const [total_conversations, setTotalConversations] = useState(null);
  const [selected_conversation, setSelectedConversation] = useState(null);
  const [switchConversation, setSwitchConversation] = useState(false);
  const [user_image, setUserImage] = useState(null);
  const [newchatindicator, setNewchatindicator] = useState(false);

  const updateTitle = async () => {
    const response = await fetch('http://localhost:8000/chatbot/update-title/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log(data);

  }

  useEffect(() => {
    updateTitle();
  }, []);

  const handleNewChat = async () => {
    try {
      const response = await fetch('http://localhost:8000/chatbot/new-chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      const newNumber = await getCurrentConversationNumber();
      setTotalConversations(newNumber);
      setSelectedConversation(newNumber); // Set selected to the new conversation
    } catch (error) {
      console.error('Error:', error);
    }
    setNewchatindicator(true);
  }

  const getCurrentConversationNumber = async () => {
    try {
      const response = await fetch('http://localhost:8000/chatbot/get-chats/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const deleteChat = async () => {
    const response = await fetch('http://localhost:8000/chatbot/clear-history/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation_number: selected_conversation
      })
    });
    const data = await response.json();
    if (switchConversation === false) {
      setSwitchConversation(true);
    }
    else {
      setSwitchConversation(false);
    }
  };
  useEffect(() => {
    getCurrentConversationNumber().then((data) => {
      setTotalConversations(data);
      setSelectedConversation(data[data.length - 1].conversation_number); // Initially set selected to the latest conversation
      setNewchatindicator(false);
    });
  }, [newchatindicator]);
  return (
    <div className="geminibot bg-white w-screen h-screen flex flex-col">
      <Navbar handleNewChat={handleNewChat} />

      {/* Main Layout: Sidebar + Chat Section */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          total_conversations={total_conversations}
          selected_conversation={selected_conversation}
          setSelectedConversation={setSelectedConversation}
        />

        {/* Chat Section */}
        <div className="flex flex-col w-full h-full">
          <ChatBox response_chats={response_chats} user_chats={user_chats} selected_conversation={selected_conversation} switchConversation={switchConversation} user_image={user_image} />
          <ChatBar
            deleteChat={deleteChat}
            user_image={user_image}
            conversation_number={selected_conversation}
            setResponseChats={setResponseChats}
            setUserChats={setUserChats}
            setUserImage={setUserImage}
          />
        </div>
      </div>
    </div>
  );
}

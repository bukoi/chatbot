import {
  FaMicrophone,
  FaRegImage,
  FaUserCircle,
} from "react-icons/fa";
import { IoTrashOutline } from "react-icons/io5";
import { IoSend } from "react-icons/io5";
import PersonaModal from "./PersonaModal";
import { useState } from "react";
import Imageupload from "./Imageupload";
import DocumentUpload from "./DocumentUpload";
import MicrophoneButton from "./MicrophoneButton.jsx";
export default function ChatBar({conversation_number, setResponseChats, setUserChats , deleteChat, setUserImage}) {
    const [message, setMessage] = useState('');
    const handleSend = () => {
        fetch('http://localhost:8000/chatbot/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, conversation_number })
        }).then(response => response.json())
        .then(data => {
            const newChats = [data];
            setResponseChats(newChats);
        })
        .catch(error => {
            console.error('Error:', error);
        });
        setMessage('');
    };
  return (
    <div className="p-2 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4">
        {/* Microphone Button */}
        <MicrophoneButton 
          conversation_number={conversation_number} 
          setResponseChats={setResponseChats} 
          setUserChats={setUserChats}
        />
 
        {/* Image Upload Button */} 
        <Imageupload conversation_number={conversation_number} setResponseChats={setResponseChats} setUserImage={setUserImage}/>
 
        {/* File Upload Button */} 
        <DocumentUpload conversation_number={conversation_number} setResponseChats={setResponseChats} setUserChats={setUserChats}/>

        {/* Create Persona Button */}
        <PersonaModal />
      </div>

      {/* Chat Input */}
      <div className="mt-2 px-4 flex items-center">
        {/* Input field */}
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="md:w-[80%] w-[70%] h-10 rounded-lg p-2 border-2 border-gray-200 shadow-sm focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend();
              setUserChats([message]);
            }
          }}
        />

        {/* Trash button */}
        <button className="ml-2 p-2 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300" onClick={deleteChat}>
          <IoTrashOutline size={25} /> {/* Trash icon */}
        </button>

        {/* Send button */}
        <button className="ml-2 p-2 bg-blue-500 text-white rounded-full cursor-pointer hover:bg-blue-600" onClick={handleSend}>
          <IoSend size={25} /> {/* Send icon */}
        </button>
      </div>
    </div>
  );
}

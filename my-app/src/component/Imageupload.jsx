import { FaRegImage } from "react-icons/fa";

export default function Imageupload({conversation_number, setResponseChats, setUserImage}) {
    const handleImageUpload = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            const formData = new FormData();
            formData.append('image', file);
            setUserImage(file);
            formData.append('conversation_number', conversation_number);
            formData.append('start_new_conversation', false);
            const response = await fetch('http://localhost:8000/chatbot/upload-image/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            const newChats = [data];
            setResponseChats(newChats);
        }
        fileInput.click();
    }
    return (
        <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer" onClick={handleImageUpload}>
          <FaRegImage className="text-gray-600 text-lg" /> 
        </button> 
    );
}

import { BsLayoutTextSidebarReverse } from "react-icons/bs";
import { RiChatNewFill } from "react-icons/ri"
export default function Navbar({handleNewChat}) {
  
  return (
    <nav className="navbar p-4 flex justify-between items-center border-b border-gray-200 shadow-lg">
      <span className="px-2 sm:hidden flex items-center">
        <BsLayoutTextSidebarReverse
          className="text-blue-500 text-2xl cursor-pointer"
          size={30}
        />
      </span>

      {/* Centered Bot Name */}
      <div className="flex-1 text-center">
        <h1 className="text-2xl font-medium hidden sm:block">
          <span className="text-white bg-blue-500 rounded-md px-2 text-lg py-1 font-bold">
            AI
          </span>{" "}
          Chatbot
        </h1>
      </div>

      {/* Login/Signup Button and New Chat Button */}
      <div className="flex items-center gap-4">
        <button className="items-center gap-2 px-3 py-1.5 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition" onClick={handleNewChat}>
          <RiChatNewFill className="text-xl" /> 
        </button>
      </div>
    </nav>
  );
}

import React, { useState } from 'react';
import Modal from 'react-modal';
import { FaUserCircle } from 'react-icons/fa';

// Make sure to bind the modal to your app element for accessibility
Modal.setAppElement('#root');

const CreatePersonaModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setMessage('');
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setMessage('');
  };

  // Reset to default Moriarty persona
  const resetPersona = async () => {
    setIsLoading(true);
    setMessage('Resetting to default persona...');

    try {
      const response = await fetch('http://localhost:8000/chatbot/create-persona/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Moriarty',
          description: '' // Empty description will trigger default Moriarty persona on backend
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Reset to default Moriarty persona successfully!');
        setTimeout(() => {
          closeModal();
          resetForm();
        }, 1500);
      } else {
        setMessage(`Error: ${data.response || 'Failed to reset persona'}`);
      }
    } catch (error) {
      console.error('Error resetting persona:', error);
      setMessage('Error: Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setMessage('Please enter a persona name');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/chatbot/create-persona/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          description: description
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Persona created successfully!');
        setTimeout(() => {
          closeModal();
          resetForm();
        }, 1500);
      } else {
        setMessage(`Error: ${data.response || 'Failed to create persona'}`);
      }
    } catch (error) {
      console.error('Error creating persona:', error);
      setMessage('Error: Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Button to trigger the modal */}
      <button
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition cursor-pointer"
        onClick={openModal}
      >
        <FaUserCircle className="text-gray font-light text-lg" />
        Create Persona
      </button>

      {/* Modal Component */}
      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        contentLabel="Create Persona"
        className="bg-white w-[400px] p-6 rounded-lg shadow-lg"
        overlayClassName="fixed inset-0 bg-gray-100 bg-opacity-40 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold mb-4">Create Persona</h2>

        {/* Form Inputs */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-semibold mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            placeholder="Enter persona name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Enter persona description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="4"
          />
        </div>

        {/* Status message */}
        {message && (
          <div className={`mb-4 p-2 rounded text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        {/* Modal Footer with Buttons */}
        <div className="flex justify-end space-x-2">
          <button onClick={resetPersona} className="px-4 py-1 bg-gray-300 rounded-lg" disabled={isLoading}>
            Default
          </button>
          <button onClick={resetForm} className="px-4 py-1 bg-gray-300 rounded-lg">
            Reset
          </button>
          <button onClick={closeModal} className="px-4 py-1 bg-gray-300 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-1 bg-blue-500 text-white rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CreatePersonaModal;

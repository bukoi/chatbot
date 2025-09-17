import { useState, useRef, useEffect } from "react";
import { FaMicrophone } from "react-icons/fa";
import { FaStop } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

export default function MicrophoneButton({ conversation_number, setResponseChats, setUserChats }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioData, setAudioData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    
    // Clean up audio URL when component unmounts
    useEffect(() => {
        return () => {
            if (audioData && audioData.url) {
                URL.revokeObjectURL(audioData.url);
            }
        };
    }, [audioData]);

    // Start recording with optimized settings
    const startRecording = async () => {
        try {
            // Reset error state and audio chunks
            setError(null);
            audioChunksRef.current = [];
            
            console.log("Requesting microphone access...");
            
            // Request microphone access with specific constraints for better audio quality
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            });
            
            // Check if we have audio tracks
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error("No audio tracks available");
            }
            
            console.log(`Using audio device: ${audioTracks[0].label}`);
            
            // Find supported MIME type
            const mimeTypes = [
                'audio/webm',
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus',
                'audio/mp4',
                'audio/mpeg'
            ];
            
            let mimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    console.log(`Using MIME type: ${mimeType}`);
                    break;
                }
            }
            
            // Create recorder with options
            const options = {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            };
            
            const mediaRecorder = new MediaRecorder(stream, options);
            
            // Log status changes
            mediaRecorder.onstart = () => {
                console.log("Recording started");
                audioChunksRef.current = [];
            };
            
            // Collect data in small chunks (every 250ms)
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log(`Audio chunk received: ${event.data.size} bytes`);
                }
            };
            
            mediaRecorder.onstop = () => {
                console.log(`Recording stopped, chunks: ${audioChunksRef.current.length}`);
                
                if (audioChunksRef.current.length === 0) {
                    setError("No audio data was recorded. Please check your microphone.");
                    return;
                }
                
                const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
                console.log(`Audio blob created: ${blob.size} bytes, type: ${blob.type}`);
                
                const audioUrl = URL.createObjectURL(blob);
                setAudioData({ blob, url: audioUrl, type: blob.type });
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(250); // Collect data every 250ms
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
            setError(`Microphone error: ${error.message}`);
            alert(`Failed to access microphone: ${error.message}`);
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            console.log("Stopping recording...");
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error("Error stopping recorder:", e);
                setError(`Error stopping recording: ${e.message}`);
            }
            setIsRecording(false);
        }
    };
    
    const sendAudio = async () => {
        if (!audioData || isProcessing) return;
        
        setIsProcessing(true);
        setUserChats(prev => [...(prev || []), "🎤 Audio message"]);
        
        try {
            // Use the original MIME type from the Blob
            const fileType = audioData.type || 'audio/webm';
            const fileExt = fileType.includes('webm') ? 'webm' : 
                           fileType.includes('ogg') ? 'ogg' : 
                           fileType.includes('mp4') ? 'mp4' : 'wav';
            
            console.log(`Creating audio file with type: ${fileType}, extension: ${fileExt}`);
            
            const audioFile = new File([audioData.blob], `audio-message.${fileExt}`, { 
                type: fileType
            });
            
            console.log(`Sending audio file: ${audioFile.size} bytes`);
            
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('conversation_number', conversation_number || 1);
            
            // Send to server
            const response = await fetch('http://localhost:8000/chatbot/upload-audio/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log("Server response:", data);
                setResponseChats(prev => [...(prev || []), data.response]);
            } else {
                console.error('Error:', response.statusText);
                setResponseChats(prev => [...(prev || []), "Sorry, I couldn't process your audio message."]);
            }
        } catch (error) {
            console.error('Error sending audio:', error);
            setResponseChats(prev => [...(prev || []), "Sorry, there was an error processing your audio."]);
        } finally {
            setIsProcessing(false);
            setAudioData(null);
        }
    };
    
    const cancelAudio = () => {
        if (audioData && audioData.url) {
            URL.revokeObjectURL(audioData.url);
        }
        setAudioData(null);
        setError(null);
    };
    
    // No audio recorded yet, show record button
    if (!audioData) {
        return (
            <div className="flex flex-col items-center">
                <div className="flex items-center">
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-lg transition cursor-pointer ${
                            isRecording 
                                ? "bg-red-100 hover:bg-red-200 text-red-600" 
                                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                        title={isRecording ? "Stop Recording" : "Record Audio"}
                        disabled={isProcessing}
                    >
                        {isRecording 
                            ? <FaStop className="text-lg" /> 
                            : <FaMicrophone className="text-lg" />
                        }
                    </button>
                    {isRecording && (
                        <div className="ml-2 text-xs text-red-500">Recording... (speak loudly and clearly)</div>
                    )}
                </div>
                
                {error && (
                    <div className="text-xs text-red-500 mt-2">{error}</div>
                )}
            </div>
        );
    }
    
    // Audio recorded, show preview and actions
    return (
        <div className="flex flex-col w-40">
            <audio 
                ref={audioRef}
                src={audioData.url} 
                controls 
                className="w-full mb-2"
                autoPlay={false}
            />
            
            <div className="flex justify-between">
                <button 
                    onClick={sendAudio}
                    className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 transition cursor-pointer"
                    title="Send Audio"
                    disabled={isProcessing}
                >
                    <FaCheck className="text-lg" />
                </button>
                <button 
                    onClick={cancelAudio}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
                    title="Cancel"
                    disabled={isProcessing}
                >
                    <FaTimes className="text-lg" />
                </button>
            </div>
            
            {isProcessing && (
                <div className="text-xs text-blue-500 text-center mt-2">Processing audio...</div>
            )}
            
            {error && (
                <div className="text-xs text-red-500 text-center mt-2">{error}</div>
            )}
        </div>
    );
}

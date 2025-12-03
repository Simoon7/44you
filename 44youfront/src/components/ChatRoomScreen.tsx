import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface ChatRoomScreenProps {
  onBack: () => void;
}

interface ChatRoom {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

const mockChatRooms: ChatRoom[] = [
  { id: 1, name: '김민지', lastMessage: '안녕하세요!', time: '오후 3:24', unread: 2 },
  { id: 2, name: '이서준', lastMessage: '내일 시간 괜찮으세요?', time: '오후 2:15', unread: 1 },
  { id: 3, name: '박지원', lastMessage: '감사합니다~', time: '오전 11:30', unread: 0 },
];

export function ChatRoomScreen({ onBack }: ChatRoomScreenProps) {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: '안녕하세요!', sender: 'other', time: '오후 3:20' },
    { id: 2, text: '안녕하세요! 반갑습니다.', sender: 'me', time: '오후 3:22' },
    { id: 3, text: '저도 반가워요. 프로필 보니 관심사가 비슷하네요!', sender: 'other', time: '오후 3:24' },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 채팅방 목록 화면
  if (!selectedRoom) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-[700px] px-[10px]">
          <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
            <div className="h-full overflow-y-auto py-8 px-4">
              <div className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
                {/* 헤더 */}
                <div className="w-full bg-white border-2 border-black text-black py-6 px-8 rounded-2xl shadow-lg flex items-center justify-between">
                  <button
                    onClick={onBack}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-3xl">채팅방</h1>
                  <div className="w-10"></div>
                </div>

                {/* 채팅방 목록 */}
                <div className="w-full bg-white rounded-3xl p-6 shadow-xl border-2 border-black">
                  <div className="flex flex-col gap-3">
                    {mockChatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="w-full bg-white border-2 border-black rounded-xl p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* 프로필 아이콘 */}
                          <div className="w-16 h-16 bg-[#F3F0FF] rounded-full flex items-center justify-center border-2 border-black flex-shrink-0">
                            <MessageCircle className="w-8 h-8 text-[#7B4EBF]" />
                          </div>

                          {/* 채팅 정보 */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xl text-black font-bold">
                                {room.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {room.time}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                {room.lastMessage}
                              </span>
                              {room.unread > 0 && (
                                <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                  {room.unread}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1:1 채팅 화면
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl flex flex-col">
          {/* 채팅방 헤더 */}
          <div className="bg-white border-b-2 border-black py-6 px-8 flex items-center justify-between">
            <button
              onClick={() => setSelectedRoom(null)}
              className="p-2 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl text-black font-bold">{selectedRoom.name}</h1>
            <div className="w-10"></div>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.sender === 'me'
                      ? 'bg-[#7B4EBF] text-white'
                      : 'bg-white border-2 border-black text-black'
                  } rounded-2xl px-6 py-4 shadow-md`}
                >
                  <p className="mb-1">{message.text}</p>
                  <span
                    className={`text-xs ${
                      message.sender === 'me' ? 'text-purple-200' : 'text-gray-500'
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 메시지 입력 영역 */}
          <div className="bg-white border-t-2 border-black p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-[#F3F0FF] border-2 border-black rounded-xl px-6 py-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7B4EBF]"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#7B4EBF] text-white p-4 rounded-xl border-2 border-black cursor-pointer hover:bg-[#6a3faa] transition-colors"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

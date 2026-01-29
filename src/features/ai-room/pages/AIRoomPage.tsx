import { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Card, Button } from '../../../shared/components';

const PRESET_QUESTIONS = [
  { icon: '📊', label: '종합 분석', question: '이 학생의 검사 결과를 종합적으로 분석해주세요.' },
  { icon: '👨‍👩‍👧', label: '학부모 상담', question: '학부모 상담을 준비하고 있습니다. 상담 가이드를 만들어주세요.' },
  { icon: '🏫', label: '수업 개입', question: '수업 중 이 학생에게 적용할 수 있는 개입 전략을 알려주세요.' },
  { icon: '📝', label: '생활기록부', question: '생활기록부에 들어갈 문구를 작성해주세요.' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AIRoomPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: '안녕하세요! META 학습심리정서검사 AI 상담 도우미입니다.\n\n학생의 검사 결과 분석, 코칭 전략, 학부모 상담 준비 등을 도와드립니다.\n\n먼저 분석할 학생을 선택하거나, 질문을 입력해주세요.' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
    setInput('');
    // TODO: AI 응답 연동
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'AI 응답이 여기에 표시됩니다. 실제 연동 후 학생 데이터 기반 분석 결과를 제공합니다.' 
      }]);
    }, 1000);
  };

  const handlePreset = (question: string) => {
    setInput(question);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI 상담실</h1>
            <p className="text-sm text-gray-500">학생 데이터 기반 맞춤 분석</p>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-primary-100'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-primary-600" />}
                </div>
                <div className={`max-w-[70%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <Button onClick={handleSend} className="px-6">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 space-y-4">
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            추천 질문
          </h3>
          <div className="space-y-2">
            {PRESET_QUESTIONS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handlePreset(preset.question)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
              >
                <span className="text-lg">{preset.icon}</span>
                <span className="text-sm font-medium">{preset.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">선택된 학생</h3>
          <p className="text-sm text-gray-500">학생을 선택해주세요.</p>
          <Button variant="outline" className="w-full mt-3">학생 선택</Button>
        </Card>
      </div>
    </div>
  );
};

export default AIRoomPage;

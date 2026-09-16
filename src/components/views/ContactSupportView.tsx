import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Send, 
  Clock, 
  MessageCircle, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Bot,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../../types';

interface ContactSupportViewProps {
  user: UserProfile;
  onBack?: () => void;
}

export const ContactSupportView: React.FC<ContactSupportViewProps> = ({
  user,
  onBack
}) => {
  const [name, setName] = useState(`${user.firstName} ${user.lastName}`.trim());
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '+254726222093');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Live Agent Chat Modal State
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'agent' | 'user'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am Alex from the PipNex Senior Engineering Desk. How can I assist you with your bots, bridge, or signals today?',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // FAQ Modal
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 600);
  };

  const handleSendLiveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: 'Just now' }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `Thank you for your inquiry about "${userMsg.slice(0, 30)}...". I have noted your account (${user.email}) and our MT5 engineering team is standing by to resolve this.`,
          time: 'Just now'
        }
      ]);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
      {/* SCREENSHOT 4: Header */}
      <div className="space-y-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xl font-bold text-white hover:text-purple-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Contact Support</span>
        </button>
        <p className="text-xs text-gray-400 pl-7">
          We're here to help you
        </p>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Send us a Message (7 Cols) */}
        <div className="lg:col-span-7 bg-[#080911] border border-[#161828] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Send us a Message</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Fill out the form below and we'll get back to you as soon as possible
            </p>

            {isSent ? (
              <div className="p-8 text-center bg-[#0d0e1a] rounded-2xl border border-emerald-500/30 space-y-3 animate-in fade-in my-6">
                <div className="w-12 h-12 rounded-2xl bg-[#122b1c] border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Message Sent Successfully</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Our technical desk has received your ticket. We'll reply to <span className="text-white font-mono">{email}</span> within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setIsSent(false);
                    setMessage('');
                  }}
                  className="mt-2 px-4 py-2 bg-[#171a2e] hover:bg-[#232742] text-white text-xs font-semibold rounded-xl border border-[#2b3052] transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Name <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-[#0a0b14] border border-[#1a1d2e] rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Email <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-[#0a0b14] border border-[#1a1d2e] rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors font-mono"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 bg-[#0a0b14] border border-[#1a1d2e] rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors font-mono"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Message <span className="text-purple-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    className="w-full px-4 py-3 bg-[#0a0b14] border border-[#1a1d2e] rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto px-6 py-3 bg-[#a78bfa] hover:bg-[#bba4fb] active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: 24/7 Live Support + Contact Information (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: 24/7 Live Support */}
          <div className="bg-[#080911] border border-[#161828] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>24/7 Live Support</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
            </div>

            <p className="text-xs text-gray-400 mb-5">
              Our support team is available around the clock to assist you
            </p>

            <button
              onClick={() => setIsLiveChatOpen(true)}
              className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Live Agent</span>
            </button>
          </div>

          {/* Card 2: Contact Information */}
          <div className="bg-[#080911] border border-[#161828] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Contact Information</h3>

            <div className="space-y-3.5 text-xs">
              {/* Email */}
              <a 
                href="mailto:Pipnexaicustomer@gmail.com"
                className="flex items-start gap-3 p-3 rounded-2xl bg-[#0d0e18] hover:bg-[#141624] border border-[#1a1d2e] hover:border-purple-500/40 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400 shrink-0 group-hover:text-purple-300">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Email</div>
                  <div className="font-semibold text-white font-mono mt-0.5 group-hover:text-purple-300 transition-colors">Pipnexaicustomer@gmail.com</div>
                </div>
              </a>

              {/* Phone */}
              <a 
                href="tel:+254726222093"
                className="flex items-start gap-3 p-3 rounded-2xl bg-[#0d0e18] hover:bg-[#141624] border border-[#1a1d2e] hover:border-purple-500/40 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400 shrink-0 group-hover:text-purple-300">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Phone</div>
                  <div className="font-semibold text-white font-mono mt-0.5 group-hover:text-purple-300 transition-colors">+254726222093</div>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/254726222093"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-[#081f14]/60 hover:bg-[#081f14] border border-[#10b981]/30 hover:border-[#10b981]/60 text-white transition-colors group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">WhatsApp</div>
                    <div className="font-bold text-emerald-400 mt-0.5">Chat with us on WhatsApp</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Response Time */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#0d0e18] border border-[#1a1d2e]">
                <div className="w-8 h-8 rounded-xl bg-[#141624] border border-[#272c44] flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Response Time</div>
                  <div className="font-semibold text-white mt-0.5">Within 24 hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom FAQ Link */}
          <div className="text-center pt-2">
            <button
              onClick={() => setIsFaqOpen(true)}
              className="text-xs text-gray-400 hover:text-purple-300 transition-colors underline cursor-pointer"
            >
              Check our frequently asked questions for quick answers to common questions.
            </button>
          </div>

        </div>
      </div>

      {/* Live Agent Chat Modal */}
      {isLiveChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-8 sm:pb-8 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#090a12] border border-[#1d2033] rounded-3xl w-full sm:w-96 overflow-hidden shadow-2xl flex flex-col h-[520px]">
            {/* Header */}
            <div className="p-4 bg-[#0e101c] border-b border-[#1b1e30] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    PN
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0e101c]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">PipNex Live Engineering Desk</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Agent Active • 24/7 Priority</div>
                </div>
              </div>
              <button
                onClick={() => setIsLiveChatOpen(false)}
                className="p-1 rounded-lg hover:bg-[#181a2c] text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed text-[13px] font-medium shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#7c3aed] text-white rounded-br-none'
                        : 'bg-white dark:bg-[#141624] text-[#0f172a] dark:text-[#f8fafc] border border-gray-200 dark:border-[#23273c] rounded-bl-none shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 px-1.5">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendLiveMessage} className="p-3 bg-[#0c0d16] border-t border-[#1a1d2e] flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-[#121420] border border-[#1e2233] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#090a12] border border-[#1d2033] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#181a28] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Frequently Asked Questions</h3>
              </div>
              <button onClick={() => setIsFaqOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#0e101c] border border-[#1c1f30]">
                <div className="font-bold text-white mb-1">How do I connect my MT5 broker?</div>
                <div className="text-gray-400">Head to Settings -&gt; MT5 Account Connection, enter your broker server and master login, or use our zero-install WebBridge.</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#0e101c] border border-[#1c1f30]">
                <div className="font-bold text-white mb-1">Are the signals compatible with Prop Firms?</div>
                <div className="text-gray-400">Yes! PropPass dynamically limits lot sizes and risk exposure to &lt;1.5% per trade to comply with FTMO, FundedNext, and MFF guidelines.</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#0e101c] border border-[#1c1f30]">
                <div className="font-bold text-white mb-1">How fast do Pulse Signals trigger?</div>
                <div className="text-gray-400">Signals are broadcast within 15 milliseconds of machine-learning confirmation via in-app push and live telemetry.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageOutlined,
    CloseOutlined,
    SendOutlined,
    AudioOutlined,
    AudioMutedOutlined,
    SoundOutlined,
    ReloadOutlined,
    CustomerServiceOutlined,
} from '@ant-design/icons';
import { message as antMessage } from 'antd';
import { requestChatbot } from '../../config/request';
import TrailerModal from '../TrailerModal/TrailerModal';
import styles from './ChatBot.module.scss';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcriptPreview, setTranscriptPreview] = useState('');
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
    const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null);

    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const recognitionRef = useRef(null);

    // Initial greeting message
    const initialGreeting = {
        id: 'init-1',
        sender: 'bot',
        text: 'Xin chào quý khách! 👋 Em là Trợ lý AI của rạp StreamPhim.\n\nEm có thể giúp quý khách:\n• 🔍 Tra cứu chính xác các phim đang chiếu tại rạp\n• 💺 Kiểm tra số ghế trống & hỗ trợ đặt vé nhanh\n• 🎙️ Bấm nút Micro 🔴 bên dưới để NÓI (rất tiện cho người lớn tuổi, không cần gõ chữ)\n• 🔊 Bật biểu tượng Loa phía trên để nghe đọc to câu trả lời!',
        actions: [
            '🎬 Phim đang chiếu',
            '⭐ Phim hoạt hình',
            '🔥 Phim hành động',
            '💺 Hướng dẫn đặt vé',
            '🎫 Bảng giá từng hàng ghế',
            '🍿 Giá bắp nước',
        ],
    };

    const toggleChat = () => {
        if (!isOpen && messages.length === 0) {
            setMessages([initialGreeting]);
        }
        setIsOpen(!isOpen);
    };

    const resetChat = () => {
        stopSpeaking();
        setMessages([initialGreeting]);
        antMessage.info('Đã làm mới cuộc trò chuyện');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Text to Speech
    const speakText = (text, messageId = null) => {
        if (!('speechSynthesis' in window)) {
            antMessage.warning('Trình duyệt của bạn không hỗ trợ đọc giọng nói');
            return;
        }

        window.speechSynthesis.cancel();

        if (currentlySpeakingId === messageId && messageId !== null) {
            setCurrentlySpeakingId(null);
            return;
        }

        // Clean markdown / emojis for speech
        const cleanText = text
            .replace(/[•\*\#\_\~]/g, '')
            .replace(/🎬|🍿|💺|🔍|👋|🎟️|🎫|💡|⭐|🔥|🔴|🔊/g, '')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find a Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find((v) => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
        if (viVoice) {
            utterance.voice = viVoice;
        }

        utterance.onstart = () => {
            setCurrentlySpeakingId(messageId);
        };

        utterance.onend = () => {
            setCurrentlySpeakingId(null);
        };

        utterance.onerror = () => {
            setCurrentlySpeakingId(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setCurrentlySpeakingId(null);
        }
    };

    // Speech Recognition setup (Voice input for elderly & general users)
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'vi-VN';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscriptPreview('Đang nghe giọng nói của bạn... Hãy nói tên phim hoặc yêu cầu!');
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const currentText = finalTranscript || interimTranscript;
                setTranscriptPreview(currentText);

                if (finalTranscript) {
                    setInputValue(finalTranscript);
                    setIsListening(false);
                    setTranscriptPreview('');
                    // Auto-send recognized voice text
                    handleSend(finalTranscript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                setTranscriptPreview('');
                if (event.error === 'not-allowed') {
                    antMessage.error('Vui lòng cho phép trình duyệt sử dụng Micro để nói!');
                } else if (event.error !== 'no-speech') {
                    antMessage.warning('Chưa nhận rõ giọng nói, bạn vui lòng nói lại gần micro hơn nhé!');
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setTranscriptPreview('');
            };

            recognitionRef.current = recognition;
        }

        return () => {
            stopSpeaking();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {}
            }
        };
    }, [autoSpeak]);

    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            antMessage.warning('Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng mở bằng Chrome hoặc Cốc Cốc, Edge!');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setTranscriptPreview('');
        } else {
            stopSpeaking();
            try {
                recognitionRef.current?.start();
            } catch (err) {
                console.log('Recognition restart', err);
            }
        }
    };

    const handleSend = async (text = inputValue) => {
        const messageText = typeof text === 'string' ? text.trim() : inputValue.trim();
        if (!messageText) return;

        stopSpeaking();

        const newUserMsg = { id: Date.now(), sender: 'user', text: messageText };
        setMessages((prev) => [...prev, newUserMsg]);
        setInputValue('');
        setTranscriptPreview('');
        setIsTyping(true);

        const conversationHistory = messages.map((m) => ({
            role: m.sender === 'bot' ? 'assistant' : 'user',
            content: m.text,
        }));

        try {
            const data = await requestChatbot({
                message: messageText,
                conversationHistory,
            });

            const res = data?.metadata || data;
            const botMsgId = Date.now() + 1;
            const botText = res.message || 'Dưới đây là thông tin bạn cần:';

            const newBotMsg = {
                id: botMsgId,
                sender: 'bot',
                text: botText,
                movies: res.movies || [],
                seats: res.seats || null,
                actions: res.actions || [],
            };

            setMessages((prev) => [...prev, newBotMsg]);

            // Auto-speak if enabled
            if (autoSpeak) {
                setTimeout(() => {
                    speakText(botText, botMsgId);
                }, 300);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: 'Xin lỗi bạn, hệ thống đang bận. Bạn vui lòng thử lại hoặc chọn từ các gợi ý bên dưới nhé!',
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleActionClick = (action) => {
        handleSend(action);
    };

    const handleBooking = (movieId) => {
        stopSpeaking();
        navigate(`/booking/${movieId}`);
    };

    return (
        <div className={styles.chatBotContainer}>
            {isOpen && (
                <div className={styles.chatPanel}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <h3 className={styles.title}>🎬 StreamPhim AI</h3>
                            <p className={styles.subtitle}>Tư vấn phim & Đặt vé giọng nói</p>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                className={`${styles.headerBtn} ${autoSpeak ? styles.activeSpeaker : ''}`}
                                onClick={() => {
                                    const next = !autoSpeak;
                                    setAutoSpeak(next);
                                    if (!next) stopSpeaking();
                                    antMessage.info(next ? 'Đã bật chế độ tự động đọc to tin nhắn' : 'Đã tắt tự động đọc');
                                }}
                                title={autoSpeak ? 'Tắt đọc to' : 'Bật tự động đọc to cho người lớn tuổi'}
                            >
                                <SoundOutlined />
                            </button>
                            <button
                                className={styles.headerBtn}
                                onClick={resetChat}
                                title="Làm mới cuộc trò chuyện"
                            >
                                <ReloadOutlined />
                            </button>
                            <button
                                className={styles.headerBtn}
                                onClick={toggleChat}
                                title="Đóng cửa sổ chat"
                            >
                                <CloseOutlined />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className={styles.messageArea}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.sender]}`}>
                                {msg.text && (
                                    <div className={styles.bubbleWrapper}>
                                        <div className={styles.bubble}>
                                            {msg.text.split('\n').map((line, idx) => (
                                                <React.Fragment key={idx}>
                                                    {line}
                                                    {idx < msg.text.split('\n').length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {msg.sender === 'bot' && (
                                            <button
                                                className={`${styles.speakBtn} ${currentlySpeakingId === msg.id ? styles.speaking : ''}`}
                                                onClick={() => speakText(msg.text, msg.id)}
                                                title={currentlySpeakingId === msg.id ? 'Dừng đọc' : 'Đọc to tin nhắn này (🔊)'}
                                            >
                                                <SoundOutlined />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Seat Availability Notification Card */}
                                {msg.seats && msg.seats.length > 0 && (
                                    <div className={styles.seatCard}>
                                        <div className={styles.seatIcon}>💺</div>
                                        <div className={styles.seatDetails}>
                                            <div className={styles.seatTitle}>Tình trạng ghế trống tại rạp</div>
                                            <div className={styles.seatDesc}>
                                                Phim <strong>{msg.seats[0].movieName}</strong> hiện đang còn{' '}
                                                <span className={styles.seatCount}>{msg.seats[0].availableCount} ghế trống</span>.
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Movie Cards */}
                                {msg.movies && msg.movies.length > 0 && (
                                    <div className={styles.movieCards}>
                                        {msg.movies.map((movie, idx) => (
                                            <div key={idx} className={styles.movieCard}>
                                                <img
                                                    src={movie.thumb_url || movie.poster_url}
                                                    alt={movie.name}
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop';
                                                    }}
                                                />
                                                <div className={styles.movieInfo}>
                                                    <h4 title={movie.name}>{movie.name}</h4>
                                                    <p className={styles.movieMeta}>
                                                        {movie.year || '2024'} • {Number(movie.price || 95000).toLocaleString('vi-VN')}đ
                                                    </p>
                                                    <button
                                                        className={styles.bookMovieBtn}
                                                        onClick={() => handleBooking(movie.id)}
                                                    >
                                                        🎟️ Đặt vé ngay
                                                    </button>
                                                    {movie.trailer_url && (
                                                        <button
                                                            className={styles.trailerMovieBtn}
                                                            onClick={() => setSelectedTrailerMovie(movie)}
                                                        >
                                                            🎬 Xem Trailer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Quick Actions */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className={styles.quickActions}>
                                        {msg.actions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                className={styles.actionBtn}
                                                onClick={() => {
                                                    if (typeof action === 'object') {
                                                        if (action.type === 'book') {
                                                            handleBooking(action.movieId);
                                                        } else if (action.type === 'trailer') {
                                                            setSelectedTrailerMovie(action.movie);
                                                        } else {
                                                            handleActionClick(action.label);
                                                        }
                                                    } else {
                                                        handleActionClick(action);
                                                    }
                                                }}
                                            >
                                                {typeof action === 'string' ? action : action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className={`${styles.messageWrapper} ${styles.bot}`}>
                                <div className={styles.bubble}>
                                    <div className={styles.typingIndicator}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Voice Listening Banner */}
                    {isListening && (
                        <div className={styles.voiceBanner}>
                            <div className={styles.voiceWave}>
                                <span></span><span></span><span></span><span></span><span></span>
                            </div>
                            <div className={styles.voiceText}>
                                {transcriptPreview || 'Đang lắng nghe... Hãy nói tên bộ phim bạn muốn tìm!'}
                            </div>
                            <button className={styles.stopVoiceBtn} onClick={toggleListening}>
                                Dừng
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className={styles.footer}>
                        <div className={styles.suggestions}>
                            <button onClick={() => handleSend('🎬 Phim đang chiếu')}>🎬 Phim đang chiếu</button>
                            <button onClick={() => handleSend('⭐ Phim hoạt hình')}>⭐ Hoạt hình / Trẻ em</button>
                            <button onClick={() => handleSend('🔥 Phim hành động')}>🔥 Hành động hot</button>
                            <button onClick={() => handleSend('💺 Hướng dẫn đặt vé')}>💺 Hướng dẫn đặt vé</button>
                            <button onClick={() => handleSend('🎫 Bảng giá từng hàng ghế')}>🎫 Bảng giá ghế</button>
                            <button onClick={() => handleSend('🍿 Giá bắp nước')}>🍿 Bắp nước</button>
                        </div>

                        <div className={styles.inputArea}>
                            <input
                                type="text"
                                placeholder={isListening ? 'Đang lắng nghe giọng nói...' : 'Nhập tin nhắn hoặc bấm Micro...'}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
                                onClick={toggleListening}
                                title={isListening ? 'Dừng ghi âm' : 'Nói bằng giọng nói (Dành cho người lớn tuổi / không gõ chữ)'}
                            >
                                <AudioOutlined />
                            </button>
                            <button
                                className={styles.sendBtn}
                                onClick={() => handleSend()}
                                disabled={!inputValue.trim()}
                                title="Gửi tin nhắn"
                            >
                                <SendOutlined />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Chatbot Button */}
            <button
                className={`${styles.floatingBtn} ${isOpen ? styles.hidden : ''}`}
                onClick={toggleChat}
                title="Trợ lý AI rạp StreamPhim (Hỗ trợ giọng nói & Đọc to)"
            >
                <div className={styles.floatingBadge}>AI</div>
                <MessageOutlined className={styles.icon} />
            </button>

            {/* Trailer Modal inside Chatbot */}
            <TrailerModal
                isOpen={!!selectedTrailerMovie}
                onClose={() => setSelectedTrailerMovie(null)}
                movie={selectedTrailerMovie}
            />
        </div>
    );
};

export default ChatBot;

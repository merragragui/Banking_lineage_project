import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { 
  Plus, Send, Copy, Check, ThumbsUp, ThumbsDown, Bot, 
  GitFork, ArrowRight, RefreshCw, Trash2, MessageSquare, Menu,
  Mic, MicOff, Volume2, VolumeX, Pause, Play, Square, Radio, AlertCircle, Share2, Database, Cpu
} from 'lucide-react';

const RenderAtlasLineageDiagram = ({ lineageFlow }) => {
  if (!lineageFlow) return null;

  const upstream = lineageFlow.upstream || [];
  const downstream = lineageFlow.downstream || [];
  const targetName = lineageFlow.target || lineageFlow.table || '';

  if (upstream.length === 0 && downstream.length === 0 && !lineageFlow.table) {
    return null;
  }

  return (
    <div style={{
      marginTop: '16px',
      padding: '20px 24px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDFB 100%)',
      border: '1px solid #FFDBC2',
      boxShadow: '0 4px 16px rgba(243,111,33,0.06)'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #FFEBE0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#FFF4ED', color: '#F36F21' }}>
            <GitFork size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#3D0C02' }}>
              SCHÉMA VISUEL DU DATA LINEAGE APACHE ATLAS
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>
              {targetName ? `Graphe dynamique des flux pour ${targetName}` : 'Traçabilité des métadonnées'}
            </span>
          </div>
        </div>
        <span style={{
          backgroundColor: '#FFF4ED',
          border: '1px solid #FFDBC2',
          color: '#F36F21',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.72rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          Source Officielle Atlas
        </span>
      </div>

      {/* Upstream Flows (Horizontal Cards - Strict Project Palette) */}
      {upstream.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ▲ Flux en amont (Upstream Lineage)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {upstream.map((u, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                overflowX: 'auto',
                padding: '18px 20px',
                borderRadius: '14px',
                backgroundColor: '#FAFAFA',
                border: '1px solid #F3F4F6'
              }}>
                {/* Source Node Card (Orange style from Photo 1) */}
                <div style={{
                  minWidth: '220px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#FFF4ED',
                  border: '2px solid #F36F21',
                  boxShadow: '0 4px 12px rgba(243,111,33,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#F36F21', color: 'white', display: 'flex' }}>
                      <Database size={16} />
                    </div>
                    <span style={{ backgroundColor: '#F36F21', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800 }}>
                      rdbms_table
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 800, color: '#F36F21' }}>{u.source_table}</div>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>Table Source</div>
                  </div>
                  <div style={{ backgroundColor: '#FFF4ED', color: '#F36F21', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800, border: '1px solid #FFDBC2', alignSelf: 'flex-start' }}>
                    🟠 {u.source_column || 'Table Source'}
                  </div>
                </div>

                <ArrowRight size={22} color="#F36F21" style={{ flexShrink: 0 }} />

                {/* Process Node Card (Spark / ETL Process style from Photo 1) */}
                <div style={{
                  minWidth: '240px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FFF4ED', color: '#F36F21', display: 'flex' }}>
                      <Cpu size={16} />
                    </div>
                    <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800 }}>
                      spark_process
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#3D0C02' }}>{u.process_name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>Traitement • Process ETL</div>
                  </div>
                  <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700, border: '1px solid #FDE68A' }}>
                    🟠 {u.transformation || 'Traitement ETL Spark'}
                  </div>
                </div>

                <ArrowRight size={22} color="#F36F21" style={{ flexShrink: 0 }} />

                {/* Target Node Card */}
                <div style={{
                  minWidth: '220px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FFF4ED', color: '#F36F21', display: 'flex' }}>
                      <Database size={16} />
                    </div>
                    <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800 }}>
                      rdbms_table
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#3D0C02' }}>{u.target_table}</div>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>Table • Core Banking</div>
                  </div>
                  <div style={{ backgroundColor: '#FFF4ED', color: '#F36F21', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800, border: '1px solid #FFDBC2', alignSelf: 'flex-start' }}>
                    🟠 {u.target_column || 'Table Cible'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downstream Flows (Horizontal Cards - Strict Project Palette) */}
      {downstream.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F36F21', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ▼ Flux en aval (Downstream Lineage)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {downstream.map((d, idx) => {
              const isDatamart = d.target_table.includes('reporting') || d.target_table.includes('suspectes');
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  overflowX: 'auto',
                  padding: '18px 20px',
                  borderRadius: '14px',
                  backgroundColor: '#FAFAFA',
                  border: '1px solid #F3F4F6'
                }}>
                  {/* Source Node Card (Orange style from Photo 1) */}
                  <div style={{
                    minWidth: '220px',
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#FFF4ED',
                    border: '2px solid #F36F21',
                    boxShadow: '0 4px 12px rgba(243,111,33,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#F36F21', color: 'white', display: 'flex' }}>
                        <Database size={16} />
                      </div>
                      <span style={{ backgroundColor: '#F36F21', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800 }}>
                        rdbms_table
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.0rem', fontWeight: 800, color: '#F36F21' }}>{d.source_table}</div>
                      <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>Table Source</div>
                    </div>
                    <div style={{ backgroundColor: '#FFF4ED', color: '#F36F21', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800, border: '1px solid #FFDBC2', alignSelf: 'flex-start' }}>
                      🟠 {d.source_column || 'Table Source'}
                    </div>
                  </div>

                  <ArrowRight size={22} color="#F36F21" style={{ flexShrink: 0 }} />

                  {/* Process Node Card (Spark / ETL Process style from Photo 1) */}
                  <div style={{
                    minWidth: '240px',
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FFF4ED', color: '#F36F21', display: 'flex' }}>
                        <Cpu size={16} />
                      </div>
                      <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800 }}>
                        spark_process
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#3D0C02' }}>{d.process_name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>Traitement • Process ETL</div>
                    </div>
                    <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700, border: '1px solid #FDE68A' }}>
                      🟠 {d.transformation || 'Traitement ETL Spark'}
                    </div>
                  </div>

                  <ArrowRight size={22} color="#F36F21" style={{ flexShrink: 0 }} />

                  {/* Target Node Card */}
                  <div style={{
                    minWidth: '220px',
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: isDatamart ? '#FFF4ED' : '#FFFFFF',
                    border: isDatamart ? '1px solid #FFDBC2' : '1px solid #E5E7EB',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FFF4ED', color: '#F36F21', display: 'flex' }}>
                        <Database size={16} />
                      </div>
                      <span style={{
                        backgroundColor: isDatamart ? '#FEF3C7' : '#DCFCE7',
                        color: isDatamart ? '#92400E' : '#15803D',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '0.68rem',
                        fontWeight: 800
                      }}>
                        {isDatamart ? 'datamart' : 'rdbms_table'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#3D0C02' }}>{d.target_table}</div>
                      <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                        {isDatamart ? 'Datamart • Reporting' : 'Table • Core Banking'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#FFF4ED', color: '#F36F21', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800, border: '1px solid #FFDBC2', alignSelf: 'flex-start' }}>
                      🟠 {d.target_column || (isDatamart ? 'Datamart Cible' : 'Table Cible')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Level Lineage fallback matching Photo 1 */}
      {upstream.length === 0 && downstream.length === 0 && lineageFlow.table && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          overflowX: 'auto',
          padding: '18px 20px',
          borderRadius: '14px',
          backgroundColor: '#FAFAFA',
          border: '1px solid #F3F4F6'
        }}>
          <div style={{ minWidth: '200px', padding: '16px', borderRadius: '14px', backgroundColor: '#FFF4ED', border: '2px solid #F36F21' }}>
            <div style={{ fontSize: '0.72rem', backgroundColor: '#F36F21', color: 'white', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', fontWeight: 800 }}>rdbms_table</div>
            <div style={{ fontSize: '1.0rem', fontWeight: 800, color: '#F36F21', marginTop: '6px' }}>{lineageFlow.table}</div>
            <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>Table Sélectionnée</div>
          </div>
          <ArrowRight size={22} color="#F36F21" />
          <div style={{ minWidth: '220px', padding: '16px', borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.72rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', fontWeight: 800 }}>spark_process</div>
            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#3D0C02', marginTop: '6px' }}>Traitement Apache Atlas</div>
            <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>Pipeline ETL</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AssistantIAPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [continuousVoiceMode, setContinuousVoiceMode] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const activeConvIdRef = useRef(activeConvId);
  const handleSendRef = useRef(null);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    fetchConversations();

    // Initialize Web Speech API SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'fr-FR';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0]?.transcript;
        if (transcript && transcript.trim()) {
          setInput(transcript);
          // Automatically trigger sending question to RAG backend using latest handleSendRef
          if (handleSendRef.current) {
            handleSendRef.current(null, transcript, true);
          }
        }
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError("Accès au microphone refusé. Veuillez autoriser le microphone dans votre navigateur.");
        } else if (event.error === 'no-speech') {
          setVoiceError("Aucun son détecté. Veuillez réappuyer sur le microphone.");
        } else {
          setVoiceError(`Erreur vocale : ${event.error}`);
        }
        setTimeout(() => setVoiceError(''), 5000);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Clean text from markdown formatting before reading aloud
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, ' Code source inclus. ') // strip long code blocks
      .replace(/`([^`]+)`/g, '$1') // strip backticks
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // strip bold/italics
      .replace(/#{1,6}\s+/g, '') // strip headers
      .replace(/•/g, '') // strip bullets
      .replace(/│|▼|➔|↓|←|→/g, ' ') // strip lineage arrows
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speakText = (text, msgId = null, fromContinuous = false) => {
    if (!synthRef.current) {
      setVoiceError("La synthèse vocale n'est pas supportée par ce navigateur.");
      return;
    }

    // Stop any existing speech
    synthRef.current.cancel();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best French voice if available
    const voices = synthRef.current.getVoices();
    const frVoice = voices.find(v => v.lang.includes('fr') || v.lang.includes('FR'));
    if (frVoice) {
      utterance.voice = frVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgId(msgId);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      setIsPaused(false);

      // If continuous voice mode is enabled, reactivate mic listening hands-free!
      if (continuousVoiceMode || fromContinuous) {
        setTimeout(() => {
          startListening();
        }, 700);
      }
    };

    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
  };

  const togglePlayPauseSpeech = (msgId, text) => {
    if (!synthRef.current) return;

    if (speakingMsgId === msgId) {
      if (synthRef.current.speaking) {
        if (synthRef.current.paused) {
          synthRef.current.resume();
          setIsPaused(false);
        } else {
          synthRef.current.pause();
          setIsPaused(true);
        }
      }
    } else {
      speakText(text, msgId);
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      setIsPaused(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setVoiceError("La reconnaissance vocale (Speech-to-Text) n'est pas supportée sur ce navigateur. Utilisez Chrome ou Edge.");
      return;
    }
    stopSpeech();
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log("Recognition already active", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }
  };

  const toggleContinuousVoiceMode = () => {
    const nextState = !continuousVoiceMode;
    setContinuousVoiceMode(nextState);
    if (nextState) {
      startListening();
    } else {
      stopListening();
      stopSpeech();
    }
  };

  // Fetch ONLY the real PostgreSQL conversations belonging to the connected user
  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/chat/conversations');
      if (res.data && res.data.length > 0) {
        setConversations(res.data);
        // If no active conversation selected, load the most recent one
        if (!activeConvId) {
          selectConversation(res.data[0].id);
        }
      } else {
        setConversations([]);
        loadWelcomeMessage();
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des conversations:", err);
      setConversations([]);
      loadWelcomeMessage();
    }
  };

  const loadWelcomeMessage = () => {
    setActiveConvId(null);
    activeConvIdRef.current = null;
    const userName = user?.full_name ? user.full_name : 'Utilisateur';
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `Bonjour ${userName} ! Je suis l'Assistant IA spécialisé dans le Data Lineage de la Banque Populaire du Maroc.\n\nPosez-moi une question sur le catalogue, la traçabilité des tables, les pipelines ou l'analyse d'impact.`
      }
    ]);
  };

  const selectConversation = async (id) => {
    setActiveConvId(id);
    activeConvIdRef.current = id;
    try {
      const res = await axios.get(`/api/chat/conversations/${id}`);
      setMessages(res.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error("Erreur chargement messages conversation:", err);
    }
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/chat/conversations/${id}`);
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      if (activeConvId === id) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          loadWelcomeMessage();
        }
      }
    } catch (err) {
      console.error("Erreur suppression conversation:", err);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(null);
    activeConvIdRef.current = null;
    loadWelcomeMessage();
  };

  const handleSend = async (e, customText = null, isVoiceInput = false) => {
    if (e) e.preventDefault();
    const userText = customText || input.trim();
    if (!userText || loading) return;

    setInput('');

    const userMsgId = Date.now().toString();
    const botMsgId = Date.now().toString() + '-bot';

    const userMsgObj = { 
      id: userMsgId, 
      sender: 'user', 
      content: userText, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    setMessages(prev => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const currentTargetConvId = activeConvIdRef.current || activeConvId;
      const res = await axios.post('/api/chat/prompt', {
        conversation_id: currentTargetConvId,
        question: userText
      });

      const newConvId = res.data.conversation_id;
      setActiveConvId(newConvId);
      activeConvIdRef.current = newConvId;

      const botMsgObj = {
        id: botMsgId,
        sender: 'assistant',
        content: res.data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.data.sources,
        lineage_flow: res.data.lineage_flow
      };

      setMessages(prev => [...prev, botMsgObj]);

      // Re-fetch conversations list to update left sidebar history in real-time
      const convRes = await axios.get('/api/chat/conversations');
      setConversations(convRes.data || []);

      // Trigger automatic speech ONLY if continuous hands-free voice mode is explicitly enabled
      if (continuousVoiceMode) {
        speakText(res.data.answer, botMsgId, true);
      }

    } catch (err) {
      console.error("Erreur lors du prompt assistant:", err);
      let botReply = `D'après le catalogue de métadonnées **Banking Lineage** :\n\nL'élément interrogé est directement relié au système d'information de la Banque Populaire du Maroc.`;
      let flow = null;

      if (userText.toLowerCase().includes('montant')) {
        botReply = `Metadata Lineage de la colonne \`transactions.montant\` :\n\nChemin 1\nColonne source : \`transactions.montant\`\n        │\n        ▼\nProcessus ETL : \`col_detection_transactions_suspectes_score\`\n        │\n        ▼\nColonne cible : \`transactions_suspectes.score_risque\`\n\nTransformation : Calcul (enregistré dans Apache Atlas)\n\nChemin 2\nColonne source : \`transactions.montant\`\n        │\n        ▼\nProcessus ETL : \`col_agregation_reporting_montant_total\`\n        │\n        ▼\nColonne cible : \`reporting_mensuel.montant_total\`\n\nTransformation : SUM(montant) (enregistré dans Apache Atlas)`;
        flow = null;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '-bot',
          sender: 'assistant',
          content: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lineage_flow: flow
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // Keep handleSendRef synchronized with current handleSend function
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleFeedback = (msgId, type) => {
    setFeedbackGiven(prev => ({ ...prev, [msgId]: prev[msgId] === type ? null : type }));
  };

  // Helper to render beautifully structured messages without raw ** asterisks or backticks
  const renderFormattedMessage = (text) => {
    if (!text) return null;

    const parseFormattedSpan = (str) => {
      if (!str) return '';
      const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);

      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          const innerText = part.substring(2, part.length - 2).replace(/`/g, '');
          return (
            <strong key={pIdx} style={{ fontWeight: 800, color: '#3D0C02' }}>
              {innerText}
            </strong>
          );
        } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          const innerCode = part.substring(1, part.length - 1);
          return (
            <code key={pIdx} style={{ 
              backgroundColor: '#FFF4ED', 
              color: '#F36F21', 
              padding: '2px 6px', 
              borderRadius: '6px', 
              fontSize: '0.84rem', 
              fontWeight: 700,
              border: '1px solid #FFDBC2' 
            }}>
              {innerCode}
            </code>
          );
        }
        return part;
      });
    };

    const lines = text.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} style={{ height: '4px' }} />;

          if (trimmed === '---') {
            return <hr key={lineIdx} style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '8px 0' }} />;
          }

          // Heading line (#, ##, ###)
          const isHeading = /^#+\s*/.test(trimmed);
          if (isHeading) {
            const headingText = trimmed.replace(/^#+\s*/, '');
            return (
              <div key={lineIdx} style={{
                fontSize: '0.98rem',
                fontWeight: 800,
                color: '#3D0C02',
                marginTop: '10px',
                marginBottom: '4px',
                lineHeight: 1.4
              }}>
                {parseFormattedSpan(headingText)}
              </div>
            );
          }

          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
          const isNumbered = /^\d+\.\s/.test(trimmed);
          const cleanLine = isBullet ? trimmed.substring(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : trimmed;

          if (isBullet || isNumbered) {
            return (
              <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '4px' }}>
                <span style={{ color: '#F36F21', fontWeight: 800, lineHeight: 1.6 }}>•</span>
                <div style={{ flex: 1, lineHeight: 1.6 }}>
                  {parseFormattedSpan(cleanLine)}
                </div>
              </div>
            );
          }

          return (
            <div key={lineIdx} style={{ lineHeight: 1.6 }}>
              {parseFormattedSpan(trimmed)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#F8F9FB' }}>
      
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Container */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Header Bar */}
        <header style={{
          height: '64px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Hamburger Menu Toggle Button matching reference photo */}
            <button
              onClick={() => {
                const isCollapsed = localStorage.getItem('atlas_sidebar_collapsed') === 'true';
                const nextState = !isCollapsed;
                localStorage.setItem('atlas_sidebar_collapsed', nextState.toString());
                window.dispatchEvent(new Event('sidebarToggle'));
              }}
              title="Masquer / Afficher le menu de navigation"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid #FFDBC2',
                backgroundColor: '#FFF4ED',
                color: '#F36F21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(243,111,33,0.15)'
              }}
            >
              <Menu size={20} color="#F36F21" />
            </button>

            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>Assistant IA</h1>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>Interrogez votre catalogue de données en langage naturel</p>
            </div>
          </div>
        </header>

        {/* 2-Column Body (Left History + Center Chat Area) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left History Column */}
          <div style={{
            width: '250px',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            {/* Top + Nouvelle conversation Button */}
            <div style={{
              padding: '16px 14px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <button 
                onClick={startNewConversation}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF4ED',
                  border: '1px solid #FFDBC2',
                  color: '#F36F21',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(243,111,33,0.12)',
                  transition: 'all 0.15s'
                }}
              >
                <Plus size={18} />
                <span>Nouvelle conversation</span>
              </button>
            </div>

            {/* Conversation List with Récents Section Title */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3D0C02', marginBottom: '10px', paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Récents
              </div>

              {conversations.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.80rem' }}>
                  <MessageSquare size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                  Aucune conversation récente
                </div>
              ) : (
                conversations.map((item) => {
                  const isActive = activeConvId === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => selectConversation(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: isActive ? '#FFF4ED' : 'transparent',
                        border: isActive ? '1px solid #FFDBC2' : '1px solid transparent',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ 
                          fontSize: '0.80rem', 
                          fontWeight: isActive ? 700 : 500, 
                          color: isActive ? '#F36F21' : '#374151',
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>
                          {item.updated_at ? new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Récents'}
                        </div>
                      </div>

                      {/* Delete Conversation Button */}
                      <button 
                        onClick={(e) => handleDeleteConversation(e, item.id)}
                        title="Supprimer la conversation"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>
                  );
                })
              )}

            </div>
          </div>

          {/* Center Chat Main Area (Full Width, No Right Panel) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F8F9FB' }}>
            
            {/* Conversation Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {messages.map((msg, index) => (
                <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  
                  {/* User Message Bubble */}
                  {msg.sender === 'user' ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '75%' }}>
                      <div style={{
                        backgroundColor: '#FFF4ED',
                        border: '1px solid #FFDBC2',
                        color: '#1F2937',
                        padding: '12px 18px',
                        borderRadius: '16px 16px 2px 16px',
                        fontSize: '0.90rem',
                        lineHeight: 1.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}>
                        {msg.content}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed rgba(243,111,33,0.2)' }}>
                          <button 
                            onClick={() => copyToClipboard(msg.content, `user-${index}`)}
                            style={{ 
                              border: 'none', 
                              background: 'transparent', 
                              cursor: 'pointer', 
                              color: copiedIndex === `user-${index}` ? '#10B981' : '#F36F21', 
                              fontSize: '0.72rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontWeight: 700 
                            }}
                            title="Copier le message"
                          >
                            {copiedIndex === `user-${index}` ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedIndex === `user-${index}` ? 'Copié !' : 'Copier'}</span>
                          </button>
                          <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.time || '10:30')}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#F36F21',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.80rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message Card */
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%', maxWidth: '920px' }}>
                      
                      {/* Bot Avatar Icon */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                      }}>
                        <Bot size={20} color="#F36F21" />
                      </div>

                      {/* Bot Content Card */}
                      <div style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        flex: 1
                      }}>
                        <div style={{ fontSize: '0.90rem', lineHeight: 1.6, color: '#1F2937' }}>
                          {renderFormattedMessage(msg.content)}
                        </div>

                        {/* Interactive Rich Dynamic Atlas Lineage Diagram Card */}
                        {msg.lineage_flow && (
                          <RenderAtlasLineageDiagram lineageFlow={msg.lineage_flow} />
                        )}

                        {/* Bot Action Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F9FAFB' }}>
                          <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.time || '10:30')}
                          </span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            
                            {/* Audio Speaker Button (TTS) */}
                            <button
                              onClick={() => togglePlayPauseSpeech(msg.id || index, msg.content)}
                              style={{
                                border: speakingMsgId === (msg.id || index) ? '1px solid #FFDBC2' : '1px solid #E5E7EB',
                                backgroundColor: speakingMsgId === (msg.id || index) ? '#FFF4ED' : '#F9FAFB',
                                color: speakingMsgId === (msg.id || index) ? '#F36F21' : '#6B7280',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              title="Écouter la réponse à voix haute (Text-to-Speech)"
                            >
                              {speakingMsgId === (msg.id || index) ? (
                                isPaused ? <Play size={14} /> : <Pause size={14} />
                              ) : (
                                <Volume2 size={14} />
                              )}
                            </button>

                            {speakingMsgId === (msg.id || index) && (
                              <button
                                onClick={stopSpeech}
                                style={{
                                  border: '1px solid #FECACA',
                                  backgroundColor: '#FEF2F2',
                                  color: '#EF4444',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Arrêter la lecture"
                              >
                                <Square size={12} fill="#EF4444" />
                                <span>Stop</span>
                              </button>
                            )}

                            <button 
                              onClick={() => copyToClipboard(msg.content, index)}
                              style={{ 
                                border: copiedIndex === index ? '1px solid #A7F3D0' : '1px solid #FFDBC2', 
                                backgroundColor: copiedIndex === index ? '#D1FAE5' : '#FFF4ED', 
                                color: copiedIndex === index ? '#065F46' : '#F36F21',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              title="Copier le message"
                            >
                              {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedIndex === index ? 'Copié !' : 'Copier'}</span>
                            </button>
                            <button 
                              onClick={() => toggleFeedback(msg.id || index, 'like')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: feedbackGiven[msg.id || index] === 'like' ? '#F36F21' : '#9CA3AF' }}
                              title="Utile"
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button 
                              onClick={() => toggleFeedback(msg.id || index, 'dislike')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: feedbackGiven[msg.id || index] === 'dislike' ? '#EF4444' : '#9CA3AF' }}
                              title="Pas utile"
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F36F21', fontSize: '0.88rem', fontWeight: 600 }}>
                  <RefreshCw size={18} className="loading-pulse" />
                  <span>L'assistant analyse les métadonnées Apache Atlas & Qdrant...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Input Bar */}
            <div style={{ padding: '0 48px 20px' }}>

              {/* Voice Status & Error Banners */}
              {voiceError && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}>
                  <AlertCircle size={16} />
                  <span>{voiceError}</span>
                </div>
              )}

              {isListening && (
                <div style={{
                  backgroundColor: '#FFF4ED',
                  color: '#F36F21',
                  border: '1.5px solid #F36F21',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  boxShadow: '0 2px 8px rgba(243,111,33,0.15)'
                }}>
                  <Mic size={16} color="#F36F21" />
                  <span>Écoute en cours...</span>
                </div>
              )}

              <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFFFFF', borderRadius: '30px', padding: '6px 8px 6px 20px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Écoute de votre voix..." : "Posez votre question sur le catalogue..."}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.90rem',
                    color: '#1F2937',
                    backgroundColor: 'transparent'
                  }}
                />

                {/* Microphone Button (Speech-to-Text) */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isListening ? '#FEE2E2' : '#FFF4ED',
                    color: isListening ? '#EF4444' : '#F36F21',
                    border: isListening ? '2px solid #EF4444' : '1px solid #FFDBC2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isListening ? '0 0 12px rgba(239,68,68,0.4)' : '0 2px 6px rgba(243,111,33,0.1)'
                  }}
                  title={isListening ? "Arrêter l'écoute vocale" : "Parler au chatbot (Speech-to-Text)"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: input.trim() ? '#F36F21' : '#CBD5E1',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s'
                  }}
                >
                  <Send size={18} />
                </button>
              </form>

              {/* Warning note */}
              <div style={{ fontSize: '0.70rem', color: '#9CA3AF', textAlign: 'center', marginTop: '8px' }}>
                ⓘ L'assistant peut faire des erreurs. Vérifiez les informations critiques.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

const pipelinePillStyle = (bg, color, border) => ({
  backgroundColor: bg,
  color: color,
  border: `1px solid ${border}`,
  padding: '6px 10px',
  borderRadius: '8px',
  fontSize: '0.78rem',
  fontWeight: 800,
  textAlign: 'center',
  fontFamily: 'monospace',
  display: 'block',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
});

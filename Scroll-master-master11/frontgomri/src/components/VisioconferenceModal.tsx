import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Entretien } from '../types';
import { professionalToast as toast } from '../services/alertService';

interface VisioconferenceModalProps {
  open: boolean;
  entretien: Entretien | null;
  onClose: () => void;
  userRole?: 'CANDIDAT' | 'ENTREPRISE' | 'ADMIN';
  userName?: string;
}

export const VisioconferenceModal: React.FC<VisioconferenceModalProps> = ({
  open,
  entretien,
  onClose,
  userRole = 'CANDIDAT',
  userName = 'Mohamed Gomri',
}) => {
  const { lang } = useLanguage();
  const [meetingMode, setMeetingMode] = useState<'real' | 'simulator'>('real');
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [callDuration, setCallDuration] = useState(145);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string; isMe: boolean }>>([
    {
      sender: 'Sophie Mercier (Recruteur)',
      text: lang === 'ar' ? 'مرحباً بك في مقابلة التوظيف التقنية. هل الصوت والصورة يعملان بشكل جيد ؟' : 'Bonjour et bienvenue à cet échange technique ! Vous m’entendez bien ?',
      time: '14:30',
      isMe: false,
    },
    {
      sender: userName,
      text: lang === 'ar' ? 'نعم بكل تأكيد، الصوت واضح ومستعد للمقابلة.' : 'Parfaitement, le flux vidéo et audio est très net.',
      time: '14:31',
      isMe: true,
    },
    {
      sender: 'Sophie Mercier (Recruteur)',
      text: lang === 'ar' ? 'ممتاز، سنبدأ بمناقشة المشاريع الأخيرة والمهارات التقنية.' : 'Excellent, nous allons passer en revue vos réalisations et les compétences clés du poste.',
      time: '14:32',
      isMe: false,
    },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Minuteur d'appel
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Initialisation Webcam pour le mode simulateur
  useEffect(() => {
    if (!open || meetingMode !== 'simulator') {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setHasWebcam(false);
      return;
    }

    let isMounted = true;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (isMounted) {
            mediaStreamRef.current = stream;
            setHasWebcam(true);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn('Webcam non accessible ou refusée :', err);
        if (isMounted) setHasWebcam(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [open, meetingMode]);

  const handleToggleMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
    }
    setMicOn(!micOn);
    toast.info(!micOn ? (lang === 'ar' ? 'تم تشغيل الميكروفون' : 'Microphone activé') : (lang === 'ar' ? 'تم كتم الميكروفون' : 'Microphone coupé'));
  };

  const handleToggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoOn;
      });
    }
    setVideoOn(!videoOn);
    toast.info(!videoOn ? (lang === 'ar' ? 'تم تشغيل الكاميرا' : 'Caméra activée') : (lang === 'ar' ? 'تم إيقاف الكاميرا' : 'Caméra désactivée'));
  };

  const handleToggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setScreenSharing(true);
          toast.success(lang === 'ar' ? 'جارٍ مشاركة الشاشة بنجاح' : 'Partage d’écran actif');
          screenStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
            if (mediaStreamRef.current && localVideoRef.current) {
              localVideoRef.current.srcObject = mediaStreamRef.current;
            }
          };
        }
      } catch {
        setScreenSharing(false);
      }
    } else {
      if (mediaStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
      setScreenSharing(false);
      toast.info(lang === 'ar' ? 'تم إيقاف مشاركة الشاشة' : 'Partage d’écran arrêté');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages((prev) => [
      ...prev,
      {
        sender: userName,
        text: newMessage.trim(),
        time: timeStr,
        isMe: true,
      },
    ]);
    setNewMessage('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!open || !entretien) return null;

  const recruiterName = entretien.nomEntreprise || 'Nova Studio Recrutement';
  const jobTitle = entretien.offreTitre || 'Ingénieur Logiciel Full Stack';

  // Génération d'une salle réelle WebRTC Jitsi Meet
  const cleanRoomId = `JobFlow-Entretien-${entretien.id || '101'}-${(recruiterName || 'Tech').replace(/[^a-zA-Z0-9]/g, '')}`;
  const realMeetingUrl = `https://meet.jit.si/${cleanRoomId}#userInfo.displayName="${encodeURIComponent(userName + (userRole === 'CANDIDAT' ? ' (Candidat)' : ' (Recruteur)'))}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  const handleCopyLink = () => {
    const inviteUrl = `https://meet.jit.si/${cleanRoomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success(lang === 'ar' ? 'تم نسخ رابط المقابلة للمشاركة !' : 'Lien d’invitation copié dans le presse-papier !');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Jost', sans-serif",
        color: '#fff',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(30, 41, 59, 0.9)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 12px #10b981',
            }}
          ></div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                {lang === 'ar' ? 'غرفة المقابلات المرئية الحقيقية — JobFlow Meet HD' : 'JobFlow Meet — Visioconférence Réelle HD'}
              </h5>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                🔴 LIVE WebRTC
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {recruiterName} · <strong style={{ color: '#818cf8' }}>{jobTitle}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setMeetingMode('real')}
              style={{
                border: 'none',
                background: meetingMode === 'real' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📹 {lang === 'ar' ? 'مكالمة فيديو حقيقية' : 'Appel Réel (WebRTC)'}
            </button>
            <button
              onClick={() => setMeetingMode('simulator')}
              style={{
                border: 'none',
                background: meetingMode === 'simulator' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🤖 {lang === 'ar' ? 'محاكي المقابلة' : 'Simulateur IA'}
            </button>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            title={lang === 'ar' ? 'نسخ رابط المقابلة للمشاركة' : 'Copier le lien de la salle'}
            style={{
              background: copiedLink ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="la la-copy"></i>
            {copiedLink ? (lang === 'ar' ? '✓ تم النسخ !' : '✓ Copié !') : (lang === 'ar' ? 'دعوة الآخرين' : 'Inviter (Lien)')}
          </button>

          {/* Open New Tab */}
          <a
            href={realMeetingUrl}
            target="_blank"
            rel="noreferrer"
            title={lang === 'ar' ? 'فتح في نافذة كاملة' : 'Ouvrir en plein écran'}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <i className="la la-external-link"></i>
            {lang === 'ar' ? 'نافذة خارجية ↗' : 'Plein Écran ↗'}
          </a>

          {/* Call Timer */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.5s infinite',
              }}
            ></span>
            {formatTime(callDuration)}
          </div>

          {/* Close / Quit Call */}
          <button
            onClick={() => {
              onClose();
              toast.info(lang === 'ar' ? 'تمت مغادرة المقابلة المرئية.' : 'Vous avez quitté la salle de réunion.');
            }}
            style={{
              background: '#dc2626',
              border: 'none',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
            }}
          >
            <i className="la la-phone" style={{ transform: 'rotate(135deg)' }}></i>
            {lang === 'ar' ? 'إنهاء' : 'Quitter'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {meetingMode === 'real' ? (
        /* Visioconférence Réelle Intégrée (WebRTC Jitsi Meet) */
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#000' }}>
          <iframe
            src={realMeetingUrl}
            title="Salle de Visioconférence JobFlow Meet"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      ) : (
        /* Simulateur d'Entretien IA Interactif */
        <>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '16px', gap: '16px' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: '100%' }}>
              {/* Tile 1: Recruteur */}
              <div
                style={{
                  position: 'relative',
                  background: 'radial-gradient(circle at 50% 40%, #1e293b, #0f172a)',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src="/images/resource/candidate-2.png"
                  alt="Recruteur"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #6366f1',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
                    marginBottom: '16px',
                  }}
                />
                <div style={{ textAlign: 'center' }}>
                  <h5 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                    Sophie Mercier
                  </h5>
                  <p style={{ margin: 0, fontSize: '13px', color: '#818cf8', fontWeight: 600 }}>
                    {lang === 'ar' ? 'مسؤولة التوظيف التقني · Nova Studio' : 'Talent Acquisition & Tech Lead · ' + recruiterName}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '16px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
                    🎤 {lang === 'ar' ? 'يتحدث الآن...' : 'En train de parler...'}
                  </span>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <span style={{ width: '3px', height: '14px', background: '#34d399', borderRadius: '2px' }}></span>
                    <span style={{ width: '3px', height: '20px', background: '#34d399', borderRadius: '2px' }}></span>
                    <span style={{ width: '3px', height: '10px', background: '#34d399', borderRadius: '2px' }}></span>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  🏢 {recruiterName} (1080p 60fps)
                </div>
              </div>

              {/* Tile 2: Vous (Caméra Locale ou Avatar) */}
              <div
                style={{
                  position: 'relative',
                  background: 'radial-gradient(circle at 50% 40%, #1e293b, #0f172a)',
                  borderRadius: '18px',
                  border: '2px solid rgba(79, 70, 229, 0.4)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
              >
                {hasWebcam && videoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: screenSharing ? 'none' : 'scaleX(-1)',
                    }}
                  />
                ) : (
                  <>
                    <img
                      src="/images/resource/candidate-1.png"
                      alt="Vous"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid #10b981',
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
                        marginBottom: '16px',
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <h5 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                        {userName} ({lang === 'ar' ? 'أنت' : 'Vous'})
                      </h5>
                      <p style={{ margin: 0, fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                        {jobTitle}
                      </p>
                    </div>
                  </>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>👤 {userName}</span>
                  {screenSharing && (
                    <span style={{ color: '#38bdf8' }}>· 🖥️ {lang === 'ar' ? 'مشاركة شاشة' : 'Écran partagé'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Chat & Notes Lateral */}
            {showChat && (
              <div
                style={{
                  width: '360px',
                  background: 'rgba(30, 41, 59, 0.85)',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h6 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
                    💬 {lang === 'ar' ? 'المحادثة المباشرة والملاحظات' : 'Chat & Notes d’entretien'}
                  </h6>
                  <button
                    onClick={() => setShowChat(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: '16px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: m.isMe ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '2px' }}>
                        {m.sender} · {m.time}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Écrire un message en direct...'}
                    style={{
                      flex: 1,
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#4f46e5',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '0 16px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    ➤
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Bottom Bar Controls for Simulator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              padding: '14px 24px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onClick={handleToggleMic}
              title={micOn ? (lang === 'ar' ? 'كتم الميكروفون' : 'Couper le micro') : (lang === 'ar' ? 'تشغيل الميكروفون' : 'Activer le micro')}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: micOn ? 'rgba(255, 255, 255, 0.12)' : '#ef4444',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={micOn ? 'la la-microphone' : 'la la-microphone-slash'}></i>
            </button>

            <button
              onClick={handleToggleVideo}
              title={videoOn ? (lang === 'ar' ? 'إيقاف الكاميرا' : 'Couper la caméra') : (lang === 'ar' ? 'تشغيل الكاميرا' : 'Activer la caméra')}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: videoOn ? 'rgba(255, 255, 255, 0.12)' : '#ef4444',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={videoOn ? 'la la-video' : 'la la-video-slash'}></i>
            </button>

            <button
              onClick={handleToggleScreenShare}
              title={lang === 'ar' ? 'مشاركة الشاشة' : 'Partager mon écran'}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: screenSharing ? '#0284c7' : 'rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="la la-desktop"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

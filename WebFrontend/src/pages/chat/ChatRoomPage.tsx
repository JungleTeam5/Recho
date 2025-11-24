// WebFrontend/src/pages/chat/ChatRoomPage.tsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useMotionValue } from "framer-motion";
// Zustand 스토어 임포트
import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from "../../stores/chatStore";
import type { Message } from "../../stores/chatStore"; // ✨ 1. import 구문 정리
// 컴포넌트 임포트
import MessageBubble from "@/components/molecules/message/MessageBubble";
import PrimaryButton from "@/components/atoms/button/PrimaryButton";
import SecondaryButton from "@/components/atoms/button/SecondaryButton";
import TextInput from "@/components/atoms/input/TextInput";
import MessageInput from "@/components/molecules/message/MessageInput";
import Modal from "@/components/molecules/modal/Modal";
import Icon from "@/components/atoms/icon/Icon";
import Avatar from "@/components/atoms/avatar/Avatar";
import { IoChevronDown } from "react-icons/io5";
// Axios 인스턴스 import
import axiosInstance from "../../services/axiosInstance";
import { DEFAULT_IMAGES } from "@/constants/images";

// 시간 포맷팅을 위한 간단한 헬퍼 함수
const formatTime = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const id = user?.id;

  const {
    isConnected,
    messages,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    chatPartner,
    currentRoom,
    isModalOpen,
    modalType,
    initializeRoom,
    cleanupRoom,
    sendMessage,
    inviteUser,
    leaveCurrentRoom,
    openModal,
    closeModal,
    fetchTotalUnreadCount,
  } = useChatStore();
  
  // ✨ 2. 모든 Hooks를 컴포넌트 최상단으로 이동
  const [newMessage, setNewMessage] = useState("");
  const [inviteeId, setInviteeId] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!roomId || !user) return;

    const validateAndInitialize = async () => {
      try {
        await axiosInstance.get(`/chat/rooms/${roomId}`);
        await axiosInstance.post(`/chat/rooms/${roomId}/read`);
        await fetchTotalUnreadCount();
        
        // isConnected 상태가 바뀔 때마다 이 useEffect가 다시 실행되므로,
        // isConnected가 true일 때 initializeRoom을 호출합니다.
        if (isConnected) {
          initializeRoom(roomId);
        }
      } catch (error) {
        console.error("접근 권한이 없거나 존재하지 않는 채팅방입니다.", error);
        alert("접근할 수 없는 채팅방입니다.");
        navigate("/main");
      }
    };

    validateAndInitialize();

    return () => {
      cleanupRoom();
    };
  }, [roomId, user, isConnected, navigate, initializeRoom, fetchTotalUnreadCount, cleanupRoom]);

  useEffect(() => {
    if (!isLoadingMore) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoadingMore]);


  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 100;
      setShowScrollToBottom(isScrolledUp);
      if (container.scrollTop === 0 && !isLoadingMore && hasMore) {
        const prevScrollHeight = container.scrollHeight;
        loadMoreMessages().then(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const confirmLeaveRoom = () => {
    leaveCurrentRoom();
    navigate("/chat");
  };

  const confirmInviteUser = () => {
    inviteUser(inviteeId);
    setInviteeId("");
  };

  const goToUserProfile = () => {
    if (currentRoom?.type === 'PRIVATE' && chatPartner.id) {
      navigate(`/users/${chatPartner.id}`);
    }
  };

  // ✨ 3. 변수 선언도 조건부 return 위로 이동
  const roomTitle = currentRoom?.type === 'GROUP' 
    ? currentRoom.name || "그룹 채팅" 
    : chatPartner.username;
    
  const isProfileButtonDisabled = currentRoom?.type === 'GROUP' || !chatPartner.id;

  // ✨ 4. 로딩 UI 처리는 모든 Hooks가 호출된 후에 수행
  if (!isConnected || !user || !currentRoom) {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-default">
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-subheadline text-brand-text-primary">연결 중...</h2>
        </header>
        <main className="flex-1 p-4 overflow-y-auto flex justify-center items-center">
          <p>채팅방 정보를 불러오고 있습니다...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-brand-default">
      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => navigate("/chat")} className="p-2 text-brand-gray hover:text-brand-primary">
          <Icon name="back" />
        </button>
        <button 
          onClick={goToUserProfile} 
          className="flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-gray-100" 
          disabled={isProfileButtonDisabled}
        >
          {currentRoom.type === 'PRIVATE' && (
            <Avatar src={chatPartner.profileImageUrl || DEFAULT_IMAGES.PROFILE} alt={chatPartner.username} size={32} />
          )}
          <h2 className="text-subheadline text-brand-text-primary">{roomTitle}</h2>
        </button>
        <div className="flex items-center gap-2">
          {currentRoom.type === 'GROUP' && (
             <button onClick={() => openModal("invite")} className="p-2 text-brand-gray hover:text-brand-primary">
               <Icon name="addUser" size={22} />
             </button>
          )}
          <button onClick={() => openModal("leave")} className="p-2 text-brand-gray hover:text-brand-error-text">
            <Icon name="exit" />
          </button>
        </div>
      </header>
      {/* 채팅 메시지 목록 */}
      <motion.main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto bg-brand-frame"
        style={{ x: dragX }}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin
      >
        {isLoadingMore && <div className="text-center p-2 text-brand-gray">이전 메시지를 불러오는 중...</div>}
        <div className="flex flex-col gap-2">
          {messages.map((msg: Message) =>
            msg.isSystem ? (
              <div key={msg.id} className="self-center px-3 py-1 text-xs text-brand-gray bg-gray-200 rounded-full">
                {msg.content}
              </div>
            ) : (
              <div key={msg.id}>
                {msg.senderId === id ? (
                  <div className="flex w-full justify-end">
                    <MessageBubble msg={{ ...msg, time: formatTime(msg.createdAt) }} currentUserId={id} dragX={dragX} />
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <Avatar src={msg.sender?.profileImageUrl || DEFAULT_IMAGES.PROFILE} alt={msg.sender?.username} />
                    <div className="flex flex-col">
                      <span className="text-sm text-brand-gray mb-1 text-left block">{msg.sender?.username}</span>
                      <MessageBubble msg={{ ...msg, time: formatTime(msg.createdAt) }} currentUserId={id} dragX={dragX} />
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div ref={chatEndRef} />
        {showScrollToBottom && (
          <button
            onClick={() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-24 right-5 bg-white text-brand-primary rounded-full p-2 shadow-lg hover:bg-gray-100 focus:outline-none"
            aria-label="Scroll to bottom"
          >
            <IoChevronDown size={24} />
          </button>
        )}
      </motion.main>
      {/* 푸터 */}
      <footer className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3">
          <MessageInput value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} />
          <button onClick={handleSendMessage} className="flex-shrink-0 p-3 text-white rounded-full bg-brand-primary disabled:bg-brand-disabled" disabled={!newMessage.trim()}>
            <Icon name="send" size={20} />
          </button>
        </div>
      </footer>
      {/* 모달 렌더링 */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title={modalType === 'leave' ? '채팅방 나가기' : '사용자 초대'}>
          {modalType === 'leave' ? (
            <>
              <p className="mb-6">정말로 이 방을 나가시겠습니까?</p>
              <div className="flex justify-end gap-3">
                <SecondaryButton onClick={closeModal}>취소</SecondaryButton>
                <PrimaryButton onClick={confirmLeaveRoom} className="!w-auto !bg-red-500">나가기</PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4">초대할 사용자의 ID를 입력하세요.</p>
              <TextInput type="text" placeholder="사용자 ID" value={inviteeId} onChange={(e) => setInviteeId(e.target.value)} autoFocus />
              <div className="flex justify-end gap-3 mt-6">
                <SecondaryButton onClick={closeModal}>취소</SecondaryButton>
                <PrimaryButton onClick={confirmInviteUser} className="!w-auto">초대하기</PrimaryButton>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ChatRoomPage;

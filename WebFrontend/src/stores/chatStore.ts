import { create } from 'zustand';
import axiosInstance from '../services/axiosInstance';
import { socket } from '../services/socket';
import { useAuthStore, type User } from './authStore';
import { type Socket } from 'socket.io-client';

// --- 타입 정의 ---
export interface Message {
  id: string;
  roomId: string;
  senderId?: string;
  content: string;
  createdAt: string;
  sender?: {
    id:string;
    username: string;
    profileImageUrl: string | null;
  };
  isSystem?: boolean;
}

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP';
  createdAt: Date;
  lastMessageAt: Date;
  messages: Message[];
  userRooms: UserRoom[];
}

interface UserRoom {
  id: string;
  roomId: string;
  joinedAt: Date;
  user: User;
  room: ChatRoom;
}

interface MyRoom { id: string; }

interface ChatPartner {
  id: string | null;
  username: string;
  profileImageUrl: string | null;
}

interface ChatState {
  socket: Socket;
  isConnected: boolean;
  roomId: string | null;
  messages: Message[];
  chatPartner: ChatPartner;
  currentRoom: ChatRoom | null; // 방 정보 상태
  isModalOpen: boolean;
  modalType: 'invite' | 'leave' | null;
  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalUnreadCount: number;
  initializeRoom: (roomId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => void;
  inviteUser: (inviteeId: string) => void;
  leaveCurrentRoom: () => void;
  openModal: (type: 'invite' | 'leave') => void;
  closeModal: () => void;
  cleanupRoom: () => void;
  initializeSocketListeners: () => void;
  disconnectSocket: () => void;
  fetchTotalUnreadCount: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: socket,
  isConnected: false,
  roomId: null,
  messages: [],
  chatPartner: { id: null, username: '대화 상대 로딩...', profileImageUrl: null },
  currentRoom: null, // 방 정보 초기화
  isModalOpen: false,
  modalType: null,
  page: 1,
  hasMore: true,
  isLoadingMore: false,
  totalUnreadCount: 0,
  
  fetchTotalUnreadCount: async () => {
    try {
      const response = await axiosInstance.get<{ unreadCount: number }>('chat/unread-count');
      set({ totalUnreadCount: response.data.unreadCount });
    } catch (error) {
      console.error("Failed to fetch total unread count", error);
      set({ totalUnreadCount: 0 });
    }
  },

  initializeSocketListeners: () => {
    const currentSocket = get().socket;
    if (currentSocket.listeners('connect').length > 0) {
      if (!currentSocket.connected) {
        currentSocket.connect();
      }
      return;
    }

    currentSocket.on('connect', () => {
      set({ isConnected: true });
      const { user } = useAuthStore.getState();
      if (user) {
        axiosInstance.get<MyRoom[]>('chat/my-rooms')
          .then(response => {
            const myRooms = response.data;
            if (myRooms && myRooms.length > 0) {
              myRooms.forEach(room => {
                currentSocket.emit('joinRoom', { id: user.id, roomId: room.id });
              });
            }
          })
          .catch(error => console.error("Failed to fetch and join my rooms on connect", error));
      }
    });

    currentSocket.on('disconnect', () => set({ isConnected: false }));
    currentSocket.on('newMessage', (message: Message) => {
      if (get().roomId === message.roomId) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
    });
    currentSocket.on('unreadCountUpdated', () => get().fetchTotalUnreadCount());
    currentSocket.on('userLeft', (data: { username: string; roomId: string }) => {
      if (get().roomId === data.roomId) {
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          roomId: data.roomId,
          content: `${data.username}님이 나가셨습니다.`,
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        set((state) => ({ messages: [...state.messages, systemMessage] }));
      }
    });
    currentSocket.on('userInvited', (data: { username: string; roomId: string }) => {
      if (get().roomId === data.roomId) {
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          roomId: data.roomId,
          content: `${data.username}님이 초대되었습니다.`,
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        set((state) => ({ messages: [...state.messages, systemMessage] }));
      }
    });

    if (!currentSocket.connected) {
      currentSocket.connect();
    }
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
  },

  initializeRoom: async (roomId) => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;

    // 이전 상태 초기화
    set({
      roomId,
      messages: [],
      page: 1,
      hasMore: true,
      isLoadingMore: false,
      currentRoom: null,
      chatPartner: { id: null, username: '로딩 중...', profileImageUrl: null },
    });

    // ✨✨✨ 중요: 이 코드가 실시간 메시지 수신을 위해 반드시 필요합니다.
    // 채팅방에 입장할 때마다 서버의 'Room'에 소켓을 조인시킵니다.
    get().socket.emit('joinRoom', { id: currentUser.id, roomId });

    try {
      // 1. 방 상세 정보 가져오기
      const roomDetailsResponse = await axiosInstance.get<ChatRoom>(`chat/rooms/${roomId}`);
      const roomData = roomDetailsResponse.data;
      set({ currentRoom: roomData });

      // 2. 방 타입에 따라 대화 상대 설정
      if (roomData.type === 'PRIVATE') {
        const otherUser = roomData.userRooms.find((ur: any) => ur.user.id !== currentUser.id)?.user;
        if (otherUser) {
          set({ chatPartner: { id: otherUser.id, username: otherUser.username, profileImageUrl: otherUser.profileImageUrl } });
        } else {
          set({ chatPartner: { id: null, username: '새로운 대화', profileImageUrl: null } });
        }
      }
      
      // 3. 메시지 기록 가져오기
      const historyResponse = await axiosInstance.get(`chat/rooms/${roomId}/history?page=1&limit=20`);
      const messageHistory: Message[] = historyResponse.data.reverse();
      
      set({ 
        messages: messageHistory,
        page: 2,
        hasMore: historyResponse.data.length === 20, 
      });
      
    } catch (error) {
      console.error('채팅방 초기화 실패:', error);
      set({ chatPartner: { id: null, username: '정보 없음', profileImageUrl: null }});
    }
  },

  sendMessage: (content) => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!content.trim() || !roomId || !user) return;
    get().socket.emit('sendMessage', {
      roomId,
      senderId: user.id,
      content,
    });
  },
  
  inviteUser: (inviteeId) => {
    const { roomId } = get();
    if (!inviteeId.trim() || !roomId) return;
    get().socket.emit('inviteUser', { roomId, inviteeId });
    get().closeModal();
  },

  loadMoreMessages: async () => {
    const { roomId, page, hasMore, isLoadingMore, messages } = get();
    if (!roomId || !hasMore || isLoadingMore) return;
    set({ isLoadingMore: true });
    try {
      const response = await axiosInstance.get(`chat/rooms/${roomId}/history?page=${page}&limit=20`);
      const olderMessages: Message[] = response.data.reverse();
      set({
        messages: [...olderMessages, ...messages],
        page: page + 1,
        hasMore: olderMessages.length === 20,
      });
    } catch (error) {
      console.error('이전 메시지 로딩 실패:', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },
  
  leaveCurrentRoom: () => {
    const { roomId } = get();
    const { user } = useAuthStore.getState();
    if (!roomId || !user) return;
    get().socket.emit('leaveRoom', { id: user.id, roomId });
    get().cleanupRoom();
    get().closeModal();
  },

  openModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeModal: () => set({ isModalOpen: false, modalType: null }),
  cleanupRoom: () => {
    set({
      roomId: null,
      messages: [],
      chatPartner: { id: null, username: '', profileImageUrl: null },
      currentRoom: null, 
    });
  },
}));

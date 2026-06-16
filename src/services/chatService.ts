import { supabase } from '../lib/supabase';
import type { Conversation, Message, Member } from '../../types';

export const chatService = {
  async getOrCreateGeneralConversation(): Promise<string | null> {
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'general')
        .single();

      if (existing) return existing.id;

      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          type: 'general',
          name: 'Community Chat',
          avatar: 'https://placehold.co/100x100/3730a3/FFFFFF?text=P',
        })
        .select('id')
        .single();

      if (error) throw error;
      return newConv?.id || null;
    } catch (error) {
      console.error('Error getting/creating general conversation:', error);
      return null;
    }
  },

  async getOrCreateDMConversation(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner(user_id)
        `)
        .eq('type', 'direct')
        .in('conversation_participants.user_id', [user1Id, user2Id]);

      if (existing && existing.length > 0) {
        return existing[0].id;
      }

      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({ type: 'direct', created_by: user1Id })
        .select('id')
        .single();

      if (createError) throw createError;

      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: user1Id },
          { conversation_id: newConv.id, user_id: user2Id },
        ]);

      return newConv?.id || null;
    } catch (error) {
      console.error('Error getting/creating DM conversation:', error);
      return null;
    }
  },

  async loadConversations(userId: string): Promise<Conversation[]> {
    try {
      const generalConvId = await chatService.getOrCreateGeneralConversation();
      
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          id, type, name, avatar, created_at,
          conversation_participants(user_id),
          messages (id, sender_id, text, is_read, reactions, created_at)
        `)
        .or(`type.eq.general,conversation_participants.user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversations: Conversation[] = [];

      if (generalConvId) {
        const generalData = convos?.find(c => c.id === generalConvId);
        conversations.push({
          id: generalConvId,
          name: 'Community Chat',
          avatar: 'https://placehold.co/100x100/3730a3/FFFFFF?text=P',
          participants: [],
          messages: generalData?.messages?.map(chatService.transformMessage) || [],
          unreadCount: 0,
          typingUsers: [],
        });
      }

      const dmConvos = convos?.filter(c => c.type === 'direct' && c.id !== generalConvId) || [];
      
      for (const dm of dmConvos) {
        const otherParticipantId = dm.conversation_participants
          .find(p => p.user_id !== userId)?.user_id;
        
        if (otherParticipantId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar')
            .eq('id', otherParticipantId)
            .single();

          conversations.push({
            id: dm.id,
            name: profile?.name || 'Unknown User',
            avatar: profile?.avatar || 'https://placehold.co/100x100/3730a3/FFFFFF?text=?',
            participants: [],
            messages: dm.messages?.map(chatService.transformMessage) || [],
            unreadCount: 0,
            typingUsers: [],
          });
        }
      }

      return conversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  },

  async loadMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data?.map(chatService.transformMessage) || [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  },

  async sendMessage(conversationId: string, senderId: string, text: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          text,
          is_read: false,
        })
        .select('*')
        .single();

      if (error) throw error;
      return chatService.transformMessage(data);
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  async updateReaction(messageId: string, emoji: string, userId: string, action: 'add' | 'remove'): Promise<void> {
    try {
      const { data: message } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (!message) return;

      const reactions = (message.reactions as Record<string, string[]>) || {};
      const users = [...(reactions[emoji] || [])];

      if (action === 'add') {
        if (!users.includes(userId)) users.push(userId);
      } else {
        const idx = users.indexOf(userId);
        if (idx > -1) users.splice(idx, 1);
      }

      if (users.length === 0) delete reactions[emoji];
      else reactions[emoji] = users;

      await supabase.from('messages').update({ reactions }).eq('id', messageId);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  },

  transformMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      senderId: dbMessage.sender_id,
      senderName: dbMessage.sender_name || 'Unknown',
      senderAvatar: dbMessage.sender_avatar || '',
      text: dbMessage.text,
      timestamp: new Date(dbMessage.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: dbMessage.is_read,
      reactions: dbMessage.reactions as Record<string, string[]> | undefined,
    };
  },

  subscribeToMessages(conversationId: string, onNewMessage: (message: Message) => void) {
    const channel = supabase.channel(`chat:${conversationId}`);

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, ({ new: newMessage }) => {
        onNewMessage(chatService.transformMessage(newMessage));
      })
      .subscribe();

    return channel;
  },

  subscribeToTyping(onTyping: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) {
    const channel = supabase.channel('chat:typing');
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      onTyping(payload);
    }).subscribe();
    return channel;
  },

  async broadcastTyping(conversationId: string, userId: string, isTyping: boolean) {
    const channel = supabase.channel('chat:typing');
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { conversationId, userId, isTyping },
    });
  },
};

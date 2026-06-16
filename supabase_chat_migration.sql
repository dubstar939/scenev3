-- Supabase Chat System Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('general', 'direct')),
  name TEXT,
  avatar TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_participants junction table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Everyone can view general conversations"
  ON public.conversations FOR SELECT
  USING (type = 'general');

CREATE POLICY "Users can view direct conversations they participate in"
  ON public.conversations FOR SELECT
  USING (
    type = 'direct' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policies for conversation_participants
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.type = 'general'
    )
  );

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Function to create a direct message conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = user1_id
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = user2_id
  WHERE c.type = 'direct';
  
  -- If no existing conversation, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (type, name, created_by)
    VALUES ('direct', NULL, user1_id)
    RETURNING id INTO conversation_id;
    
    -- Add both users as participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create general conversation
CREATE OR REPLACE FUNCTION public.get_or_create_general_conversation()
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE type = 'general'
  LIMIT 1;
  
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (type, name, avatar, created_by)
    VALUES ('general', 'Community Chat', 'https://placehold.co/100x100/3730a3/FFFFFF?text=P', auth.uid())
    RETURNING id INTO conversation_id;
  END IF;
  
  -- Ensure current user is a participant
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conversation_id, auth.uid())
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial general conversation
INSERT INTO public.conversations (type, name, avatar)
VALUES ('general', 'Community Chat', 'https://placehold.co/100x100/3730a3/FFFFFF?text=P')
ON CONFLICT DO NOTHING;

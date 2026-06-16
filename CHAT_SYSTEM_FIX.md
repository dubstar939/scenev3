# Chat System Implementation Plan

## Current Issues
1. Messages are not persisted to database - lost on page refresh
2. DM messages don't broadcast correctly (only "group" conversation receives broadcasts)
3. No message history loading from database
4. Missing proper distinction between General Chat and DM conversations

## Solution Architecture

### 1. Database Schema (Supabase)
Create two tables:
- `conversations` - Stores conversation metadata
- `messages` - Stores all messages with conversation_id foreign key

### 2. Frontend Changes
- Initialize conversations from database on login
- Load message history when opening a conversation
- Persist new messages to database
- Broadcast messages via Supabase Realtime
- Handle both General Chat and DM conversations

### 3. Key Features
- **General Chat**: Single conversation visible to all users
- **Direct Messages**: Private conversations between two users
- **Real-time updates**: Using Supabase Realtime channels
- **Message persistence**: All messages stored in Supabase
- **Typing indicators**: Real-time typing status
- **Read receipts**: Track when messages are read
- **Reactions**: Emoji reactions on messages

## Implementation Steps
1. Create SQL migration for chat tables
2. Add chat-related functions to App.tsx
3. Update message sending to persist to database
4. Load message history on conversation open
5. Fix broadcast logic for all conversation types

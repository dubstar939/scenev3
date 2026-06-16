import React from "react";
import { Plus, Contact as ContactIcon, UserPlus, Trash2, MessageSquare } from "lucide-react";
import { Contact } from "../../../types";

interface AppContact {
  contactId: string;
  userContactId: string;
  name: string;
  avatar: string;
  email: string;
  car: string;
  status: string;
  addedAt: string;
}

interface ContactsTabProps {
  contacts: Contact[];
  appContacts: AppContact[];
  handleCSVImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveContact: (userId: string) => void;
  onStartDM: (userId: string, userName: string) => void;
  isLoading?: boolean;
}

/**
 * ContactsTab Component
 * 
 * Displays two types of contacts:
 * 1. Imported CSV contacts (legacy)
 * 2. App member contacts (added via + button)
 * 
 * @param {ContactsTabProps} props - Component props
 * @returns {JSX.Element} The rendered contacts tab
 */
const ContactsTab: React.FC<ContactsTabProps> = ({ 
  contacts, 
  appContacts,
  handleCSVImport,
  onRemoveContact,
  onStartDM,
  isLoading = false
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
          <ContactIcon size={20} className="text-indigo-500" /> Contacts
        </h3>
        <label className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2">
          <Plus size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Import CSV</span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
        </label>
      </div>

      {/* App Member Contacts Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <UserPlus size={14} /> My Contacts ({appContacts.length})
        </h4>
        
        {isLoading ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-bold">Loading contacts...</p>
          </div>
        ) : appContacts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-bold">No member contacts yet.</p>
            <p className="text-slate-600 text-[10px] mt-1">Click the + button on member profiles to add them.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {appContacts.map((contact) => (
              <div 
                key={contact.userContactId} 
                className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-slate-800/50 transition-all group"
              >
                <img
                  src={contact.avatar || "https://placehold.co/100x100/3730a3/FFFFFF?text=?"}
                  alt={contact.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold truncate">{contact.name}</h4>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider ${
                      contact.status === 'Offline' 
                        ? 'bg-slate-600/20 text-slate-500' 
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {contact.status}
                    </span>
                  </div>
                  {contact.email && <p className="text-slate-500 text-xs truncate">{contact.email}</p>}
                  {contact.car && (
                    <p className="text-indigo-400 text-[10px] uppercase font-black mt-0.5 flex items-center gap-1">
                      🚗 {contact.car}
                    </p>
                  )}
                  <p className="text-slate-600 text-[9px] mt-1">
                    Added {new Date(contact.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onStartDM(contact.userContactId, contact.name)}
                    className="p-2 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-500/10"
                    title="Send message"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    onClick={() => onRemoveContact(contact.userContactId)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    title="Remove contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legacy CSV Imported Contacts Section */}
      {contacts.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/5">
          <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">
            Imported Contacts ({contacts.length})
          </h4>
          
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold">{contact.name}</h4>
                  <p className="text-slate-500 text-xs">{contact.email}</p>
                  {contact.company && <p className="text-indigo-400 text-[10px] uppercase font-black mt-1">{contact.company}</p>}
                </div>
                <div className="text-right text-[10px] text-slate-600 uppercase font-bold">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ContactsTab);

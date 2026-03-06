import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase'
import '../App.css'

function Instruments({ role, userId, onRoleChange }: { role : string, userId : string, onRoleChange : (role: string) => void}) {
  const [instruments, setInstruments] = useState<{ id: number; name: string }[]>([]);
  const [item, setItem] = useState('');
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  async function getInstruments() {
    const { data, error } = await supabase.from('instruments').select();
    if (error) throw new Error(error.message);
    setInstruments(data ?? []);
  }

  async function addInstrument() {
    if (!item.trim()) return;
    const { error } = await supabase.from('instruments').insert([{ name: item }]);
    if (error) throw new Error(error.message);
    setItem('');
    await getInstruments();
  }

  async function removeInstrument(id: number) {
    const { error } = await supabase.from('instruments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await getInstruments();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function goAdmin() {
    await supabase.from('profiles').update({ role: 'admin'}).eq('id', userId);
    onRoleChange('admin');
  }

  async function goUser() {
    await supabase.from('profiles').update({ role: 'user'}).eq('id', userId);
    onRoleChange('user');
  }

  useEffect(() => {
    const instrumentsChannel = supabase
      .channel('instruments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instruments' }, () => {
        getInstruments();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await getInstruments();
      });

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter :
        `id=eq.${userId}` }, (payload) => {
        onRoleChange((payload.new as { role: string }).role);
        })
      .subscribe();

    const roomChannel = supabase
    .channel('room', { config: { presence: { key: userId }, broadcast: { self: true } }
    })
    .on('presence', { event : 'sync'}, () => {
      const state = roomChannel.presenceState();
      setOnlineCount(Object.keys(state).length);
    })
    .on('broadcast', { event : 'typing'}, () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    })
    .subscribe(async ( status ) => {
      if ( status === 'SUBSCRIBED') await roomChannel.track({ userId });
    })

    roomChannelRef.current = roomChannel;

    return () => {
      supabase.removeChannel(instrumentsChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [onRoleChange, userId])

  return (
    <div>
      <div className="app-header">
        <button className="btn-danger" onClick={handleSignOut}>Sign Out</button>
      </div>
      <span>{onlineCount} online</span>
      {role === 'admin' &&
        <div className="instrument-controls">
          <input
            className="instrument-input"
            value={item}
            onKeyDown={(e) => e.key === 'Enter' && addInstrument()}
            onChange={(e) => {
              setItem(e.target.value);
              roomChannelRef.current?.send({ type : 'broadcast', event : 'typing', payload: { userId }});
            }}
            type="text"
            placeholder="Add an instrument"
          />
          <button className="instrument-button" onClick={addInstrument}>Add</button>
        </div>
      }
      {isTyping && <span>Someone is typing...</span>}
      <ul className="instrument-list">
        {instruments.map((instrument) => (
          <li onClick={() => role == 'admin' && removeInstrument(instrument.id)} key={instrument.id}>
            {instrument.name}
          </li>
        ))}
      </ul>
      <div>
        <button className="instrument-button" onClick={goAdmin}>Be "admin"</button>
        <button className="instrument-button" onClick={goUser}>Be "user"</button>
      </div>
    </div>
  )
}

export default Instruments

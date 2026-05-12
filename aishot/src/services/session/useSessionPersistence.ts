import { useEffect, useRef } from 'react';
import { insertMessage, upsertSession } from '@/db/queries';
import { useSessionStore } from '@/stores/sessionStore';

export function useSessionPersistence() {
  const seenMessagesRef = useRef(0);

  useEffect(() => {
    const initial = useSessionStore.getState();
    void upsertSession({
      id: initial.sessionId,
      createdAt: Date.now(),
      intentSubject: initial.intent.subject ?? null,
      intentMood: initial.intent.mood ?? null,
      intentStyle: initial.intent.style ?? null,
      intentConstraints: initial.intent.constraints ?? null,
    });
    seenMessagesRef.current = initial.messages.length;

    const unsub = useSessionStore.subscribe((s, prev) => {
      if (s.sessionId !== prev.sessionId) {
        seenMessagesRef.current = 0;
        void upsertSession({
          id: s.sessionId,
          createdAt: Date.now(),
          intentSubject: s.intent.subject ?? null,
          intentMood: s.intent.mood ?? null,
          intentStyle: s.intent.style ?? null,
          intentConstraints: s.intent.constraints ?? null,
        });
      } else if (s.intent !== prev.intent) {
        void upsertSession({
          id: s.sessionId,
          createdAt: Date.now(),
          intentSubject: s.intent.subject ?? null,
          intentMood: s.intent.mood ?? null,
          intentStyle: s.intent.style ?? null,
          intentConstraints: s.intent.constraints ?? null,
        });
      }

      if (s.messages.length > seenMessagesRef.current) {
        const fresh = s.messages.slice(seenMessagesRef.current);
        for (const m of fresh) {
          void insertMessage({
            sessionId: s.sessionId,
            role: m.role,
            content: m.content,
            at: Date.now(),
          });
        }
        seenMessagesRef.current = s.messages.length;
      } else if (s.messages.length < seenMessagesRef.current) {
        seenMessagesRef.current = s.messages.length;
      }
    });

    return unsub;
  }, []);
}

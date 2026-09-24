"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { AvatarConfig } from "@/lib/learn/avatar/types";
import type { CosmeticCategory } from "@/lib/learn/avatar/layers";
import {
  defaultAvatarConfig, randomAvatarConfig, sanitizeAvatarConfig,
} from "@/data/avatar";

interface AvatarContextType {
  avatar: AvatarConfig;
  loading: boolean;
  saving: boolean;
  /** True when local changes haven't been persisted to Firestore yet. */
  dirty: boolean;
  setEquipped: (category: CosmeticCategory, id: string | null) => void;
  setSkin: (hex: string) => void;
  setHair: (hex: string) => void;
  randomize: () => void;
  reset: () => void;
  save: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | null>(null);

function cloneDefault(): AvatarConfig {
  return { ...defaultAvatarConfig, equipped: { ...defaultAvatarConfig.equipped } };
}

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<AvatarConfig>(cloneDefault());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;

  const uid = user?.id;

  useEffect(() => {
    if (!uid) {
      setAvatar(cloneDefault());
      setDirty(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const ref = doc(db, "users", uid);
      try {
        const snap = await getDoc(ref);
        const stored = snap.exists() ? snap.data().avatar : undefined;
        if (stored === undefined) {
          // First load for this user: persist the default so the doc always
          // carries an avatar from here on.
          await setDoc(ref, { avatar: defaultAvatarConfig }, { merge: true });
        }
        if (!cancelled) {
          setAvatar(sanitizeAvatarConfig(stored));
          setDirty(false);
        }
      } catch {
        if (!cancelled) setAvatar(cloneDefault());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const setEquipped = useCallback((category: CosmeticCategory, id: string | null) => {
    setAvatar((prev) => {
      const equipped = { ...prev.equipped };
      if (id === null) delete equipped[category];
      else equipped[category] = id;
      return { ...prev, equipped };
    });
    setDirty(true);
  }, []);

  const setSkin = useCallback((hex: string) => {
    setAvatar((prev) => ({ ...prev, skinTone: hex }));
    setDirty(true);
  }, []);

  const setHair = useCallback((hex: string) => {
    setAvatar((prev) => ({ ...prev, hairColor: hex }));
    setDirty(true);
  }, []);

  const randomize = useCallback(() => {
    setAvatar(randomAvatarConfig());
    setDirty(true);
  }, []);

  const reset = useCallback(() => {
    setAvatar(cloneDefault());
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", uid), { avatar: avatarRef.current }, { merge: true });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [uid]);

  return (
    <AvatarContext.Provider
      value={{ avatar, loading, saving, dirty, setEquipped, setSkin, setHair, randomize, reset, save }}
    >
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within AvatarProvider");
  return ctx;
}

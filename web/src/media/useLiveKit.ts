import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
  type RemoteTrack,
  type RemoteParticipant,
  type LocalTrack,
} from 'livekit-client';
import { api } from '../api/client';

type Mode = 'connecting' | 'livekit' | 'local';

/**
 * Media manager for a room. Uses the LiveKit SFU when the server has it
 * configured; otherwise degrades to a local-only camera preview so the app
 * still works in dev. Streams are keyed by userId (LiveKit participant
 * identity) so the carousel can map them to slots.
 */
export function useLiveKit(roomId: string | undefined, myUserId: string) {
  const [mode, setMode] = useState<Mode>('connecting');
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});
  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);

  const upsertStream = useCallback((identity: string, track: MediaStreamTrack) => {
    setStreams((prev) => {
      const stream = prev[identity] ? prev[identity] : new MediaStream();
      if (!stream.getTracks().includes(track)) stream.addTrack(track);
      return { ...prev, [identity]: stream };
    });
  }, []);

  const dropParticipant = useCallback((identity: string) => {
    setStreams((prev) => {
      if (!prev[identity]) return prev;
      const next = { ...prev };
      delete next[identity];
      return next;
    });
  }, []);

  // Connect (or fall back) once per room.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    (async () => {
      const token = await api.roomToken(roomId, true).catch(() => ({ enabled: false }) as const);
      if (cancelled) return;

      if (!token.enabled) {
        setMode('local');
        return;
      }

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
            upsertStream(participant.identity, track.mediaStreamTrack);
          }
        })
        .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => dropParticipant(p.identity));

      await room.connect(token.url, token.token);
      if (cancelled) {
        await room.disconnect();
        return;
      }
      setMode('livekit');
    })();

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      roomRef.current = null;
      localTracksRef.current.forEach((t) => t.stop());
      localTracksRef.current = [];
    };
  }, [roomId, upsertStream, dropParticipant]);

  /** Begin publishing camera + mic (when taking a carousel slot). */
  const startPublishing = useCallback(async () => {
    const tracks = await createLocalTracks({ audio: true, video: true });
    localTracksRef.current = tracks;
    const ms = new MediaStream(tracks.map((t) => t.mediaStreamTrack));
    setStreams((prev) => ({ ...prev, [myUserId]: ms }));

    const room = roomRef.current;
    if (room) {
      for (const track of tracks) await room.localParticipant.publishTrack(track);
    }
  }, [myUserId]);

  /** Stop publishing and tear down local tracks (leaving a slot). */
  const stopPublishing = useCallback(async () => {
    const room = roomRef.current;
    for (const track of localTracksRef.current) {
      if (room) await room.localParticipant.unpublishTrack(track);
      track.stop();
    }
    localTracksRef.current = [];
    dropParticipant(myUserId);
  }, [myUserId, dropParticipant]);

  return { mode, streams, startPublishing, stopPublishing };
}

import { AccessToken } from 'livekit-server-sdk';
import { config } from '../config.js';

export function livekitEnabled() {
  return config.livekit.enabled;
}

/**
 * Mint a LiveKit access token. Viewers get subscribe-only; users taking a
 * carousel slot get publish rights (camera + mic + screen). The LiveKit room
 * name is the Hustle Zone room id, and the participant identity is the userId
 * so the frontend can map remote tracks to slots (api/webrtc.md).
 */
export async function mintToken({ roomName, identity, name, canPublish }) {
  const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
    identity,
    name,
    ttl: '4h',
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: Boolean(canPublish),
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
}

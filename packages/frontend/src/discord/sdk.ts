/**
 * Discord SDK Integration
 *
 * Handles Discord Embedded App SDK setup and authentication.
 */

import { DiscordSDK, DiscordSDKMock } from '@discord/embedded-app-sdk';
import { DiscordUser, ActivityParticipant } from '../types';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string;

// =============================================================================
// SDK INSTANCE
// =============================================================================

let discordSdk: DiscordSDK | DiscordSDKMock | null = null;
let isReady = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the Discord SDK.
 * Uses the real SDK when running inside a Discord iframe, mock otherwise.
 */
export async function initializeDiscordSDK(): Promise<DiscordSDK | DiscordSDKMock> {
  if (discordSdk) return discordSdk;

  const isEmbedded = window.self !== window.top;

  if (!isEmbedded) {
    console.log('Running outside Discord — using DiscordSDKMock for local dev');
    discordSdk = new DiscordSDKMock(DISCORD_CLIENT_ID, null, null);
    isReady = true;
    return discordSdk;
  }

  discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
  await discordSdk.ready();
  isReady = true;
  console.log('Discord SDK ready');
  return discordSdk;
}

/**
 * Gets the current Discord SDK instance
 */
export function getDiscordSDK(): DiscordSDK | DiscordSDKMock | null {
  return discordSdk;
}

/**
 * Checks if Discord SDK is ready
 */
export function isDiscordReady(): boolean {
  return isReady;
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Authenticates with Discord.
 * In local dev (mock SDK), returns a generated dev user without hitting Discord's API.
 * In production, performs the full OAuth2 code exchange via the backend.
 */
export async function authenticateWithDiscord(): Promise<{
  accessToken: string;
  user: DiscordUser;
}> {
  if (!discordSdk) {
    throw new Error('Discord SDK not initialized — call initializeDiscordSDK() first');
  }

  // Local dev: return a mock user without real OAuth
  if (discordSdk instanceof DiscordSDKMock) {
    const mockUser: DiscordUser = {
      id: `dev_${Date.now()}`,
      username: 'DevPlayer',
      discriminator: '0000',
      avatar: null,
      globalName: 'Dev Player',
    };
    return { accessToken: 'mock_token', user: mockUser };
  }

  // Production: full OAuth2 flow
  const sdk = discordSdk as DiscordSDK;

  const { code } = await sdk.commands.authorize({
    client_id: DISCORD_CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: [
      'identify',
      'guilds',
      'guilds.members.read',
      'rpc.activities.write',
    ],
  });

  const response = await fetch('/api/discord/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const { access_token } = await response.json() as { access_token: string };

  const auth = await sdk.commands.authenticate({ access_token });

  if (!auth.user) {
    throw new Error('Authentication failed — no user returned');
  }

  const user: DiscordUser = {
    id: auth.user.id,
    username: auth.user.username,
    discriminator: auth.user.discriminator ?? '0',
    avatar: auth.user.avatar ?? null,
    globalName: auth.user.global_name ?? null,
  };

  return { accessToken: access_token, user };
}

// =============================================================================
// ACTIVITY MANAGEMENT
// =============================================================================

/**
 * Gets current activity participants
 */
export async function getParticipants(): Promise<ActivityParticipant[]> {
  if (!discordSdk || discordSdk instanceof DiscordSDKMock) return [];

  const { participants } = await (discordSdk as DiscordSDK).commands.getInstanceConnectedParticipants();
  return participants.map((p) => ({ id: p.id, username: p.username }));
}

/**
 * Subscribes to participant changes.
 * Returns an unsubscribe function.
 */
export function onParticipantsChange(
  callback: (participants: ActivityParticipant[]) => void
): () => void {
  if (!discordSdk || discordSdk instanceof DiscordSDKMock) {
    return () => {};
  }

  const sdk = discordSdk as DiscordSDK;

  const handler = ({ participants }: { participants: Array<{ id: string; username: string }> }) => {
    callback(participants.map((p) => ({ id: p.id, username: p.username })));
  };

  sdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', handler);

  return () => {
    sdk.unsubscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', handler);
  };
}

/**
 * Invites a user to the activity.
 * Discord handles invitations natively via its overlay — no SDK command needed.
 */
export async function inviteUser(_userId: string): Promise<void> {
  // Invitations are surfaced through the Discord UI automatically
}

// =============================================================================
// LAYOUT MANAGEMENT
// =============================================================================

/**
 * Sets the activity layout mode
 */
export async function setLayoutMode(
  _mode: 'focused' | 'pip' | 'grid'
): Promise<void> {
  // Reserved for future implementation
}

/**
 * Gets the current layout mode
 */
export async function getLayoutMode(): Promise<string> {
  return 'focused';
}

// =============================================================================
// INSTANCE MANAGEMENT
// =============================================================================

/**
 * Gets the current activity instance ID (unique per activity launch in a channel)
 */
export function getInstanceId(): string | null {
  return discordSdk?.instanceId ?? null;
}

/**
 * Gets the channel ID where the activity is running
 */
export function getChannelId(): string | null {
  return discordSdk?.channelId ?? null;
}

/**
 * Gets the guild ID where the activity is running
 */
export function getGuildId(): string | null {
  return discordSdk?.guildId ?? null;
}

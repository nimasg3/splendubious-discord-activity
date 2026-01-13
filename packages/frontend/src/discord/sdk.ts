/**
 * Discord SDK Integration
 *
 * Handles Discord Embedded App SDK setup and authentication.
 */

import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DiscordUser, ActivityParticipant } from '../types';

// =============================================================================
// SDK INSTANCE
// =============================================================================

let discordSdk: DiscordSDK | null = null;
let isReady = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the Discord SDK
 *
 * @returns Discord SDK instance
 */
export async function initializeDiscordSDK(): Promise<DiscordSDK> {
  // TODO: Implement Discord SDK initialization
  // 1. Get client ID from environment
  // 2. Create DiscordSDK instance
  // 3. Wait for SDK ready
  // 4. Authorize and authenticate
  // 5. Return SDK instance
  throw new Error('TODO: Implement initializeDiscordSDK');
}

/**
 * Gets the current Discord SDK instance
 */
export function getDiscordSDK(): DiscordSDK | null {
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
 * Authenticates with Discord
 *
 * @returns Access token and user info
 */
export async function authenticateWithDiscord(): Promise<{
  accessToken: string;
  user: DiscordUser;
}> {
  // TODO: Implement Discord authentication
  // 1. Call sdk.commands.authorize()
  // 2. Exchange code for access token (via backend)
  // 3. Call sdk.commands.authenticate()
  // 4. Return token and user info
  throw new Error('TODO: Implement authenticateWithDiscord');
}

// =============================================================================
// ACTIVITY MANAGEMENT
// =============================================================================

/**
 * Gets current activity participants
 */
export async function getParticipants(): Promise<ActivityParticipant[]> {
  // TODO: Implement participant fetching
  // Use SDK to get current activity participants
  throw new Error('TODO: Implement getParticipants');
}

/**
 * Subscribes to participant changes
 */
export function onParticipantsChange(
  _callback: (participants: ActivityParticipant[]) => void
): () => void {
  // TODO: Implement participant subscription
  // 1. Subscribe to ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE
  // 2. Return unsubscribe function
  throw new Error('TODO: Implement onParticipantsChange');
}

/**
 * Invites a user to the activity
 */
export async function inviteUser(_userId: string): Promise<void> {
  // TODO: Implement user invitation
  throw new Error('TODO: Implement inviteUser');
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
  // TODO: Implement layout mode setting
  throw new Error('TODO: Implement setLayoutMode');
}

/**
 * Gets the current layout mode
 */
export async function getLayoutMode(): Promise<string> {
  // TODO: Implement layout mode getting
  throw new Error('TODO: Implement getLayoutMode');
}

// =============================================================================
// INSTANCE MANAGEMENT
// =============================================================================

/**
 * Gets the current activity instance ID
 */
export function getInstanceId(): string | null {
  // TODO: Implement instance ID retrieval
  throw new Error('TODO: Implement getInstanceId');
}

/**
 * Gets the channel ID where the activity is running
 */
export function getChannelId(): string | null {
  // TODO: Implement channel ID retrieval
  throw new Error('TODO: Implement getChannelId');
}

/**
 * Gets the guild ID where the activity is running
 */
export function getGuildId(): string | null {
  // TODO: Implement guild ID retrieval
  throw new Error('TODO: Implement getGuildId');
}

"""
discord_service.py — Discord REST API Integration

Automatically creates a private text channel in a Discord Guild (server) for
two matched hackathon teammates. Only those two users and the bot can see the
channel; everyone else is denied VIEW_CHANNEL.

Required environment variables:
  DISCORD_BOT_TOKEN — Bot token from Discord Developer Portal
  DISCORD_GUILD_ID  — Numeric ID of your Discord server
  DISCORD_CATEGORY_ID — (Optional) Category ID to place channels under
"""

import os
import re
import httpx
import asyncio

DISCORD_API_BASE = "https://discord.com/api/v10"

# Discord permission bit flags
PERM_VIEW_CHANNEL    = 1 << 10   # 1024
PERM_SEND_MESSAGES   = 1 << 11   # 2048
PERM_READ_HISTORY    = 1 << 16   # 65536
PERM_ATTACH_FILES    = 1 << 15   # 32768
PERM_EMBED_LINKS     = 1 << 14   # 16384

MEMBER_PERMISSIONS = (
    PERM_VIEW_CHANNEL |
    PERM_SEND_MESSAGES |
    PERM_READ_HISTORY |
    PERM_ATTACH_FILES |
    PERM_EMBED_LINKS
)


def _get_config():
    token = os.getenv("DISCORD_BOT_TOKEN", "")
    guild_id = os.getenv("DISCORD_GUILD_ID", "")
    category_id = os.getenv("DISCORD_CATEGORY_ID", None)

    if not token or token == "your_bot_token_here":
        raise ValueError("DISCORD_BOT_TOKEN is not configured in .env")
    if not guild_id or guild_id == "your_guild_id_here":
        raise ValueError("DISCORD_GUILD_ID is not configured in .env")

    return token, guild_id, category_id


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
    }


def _sanitize_channel_name(name: str) -> str:
    """Discord channel names: lowercase, no spaces (use dashes), max 100 chars, alphanumeric + dashes."""
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9\-]", "-", name)
    name = re.sub(r"-+", "-", name)          # collapse multiple dashes
    name = name.strip("-")                    # trim leading/trailing dashes
    return name[:100]


async def create_team_channel(
    hackathon_name: str,
    team_members: list,  # List of dicts: [{'username': 'x', 'discord_user_id': '123'}]
) -> dict:
    """
    Create a private Discord text channel for an entire hackathon team.

    Returns a dict:
      {
        "success": bool,
        "channel_id": str | None,
        "channel_name": str | None,
        "channel_url": str | None,
        "error": str | None
      }
    """
    try:
        token, guild_id, category_id = _get_config()
    except ValueError as e:
        return {"success": False, "channel_id": None, "channel_name": None,
                "channel_url": None, "error": str(e)}

    # Build channel name: hackathon-<name>-team
    raw_name = f"hackathon-{hackathon_name}-team"
    channel_name = _sanitize_channel_name(raw_name)

    # Permission overwrites:
    # 1. @everyone  — deny VIEW_CHANNEL (make channel private)
    # 2. Add each team member with a discord_user_id
    permission_overwrites = [
        {
            "id": guild_id,          # @everyone role has same ID as guild
            "type": 0,               # 0 = role
            "allow": "0",
            "deny": str(PERM_VIEW_CHANNEL),
        }
    ]

    usernames = []
    for member in team_members:
        usernames.append(member['username'])
        if member.get('discord_user_id'):
            permission_overwrites.append({
                "id": str(member['discord_user_id']),
                "type": 1,               # 1 = member
                "allow": str(MEMBER_PERMISSIONS),
                "deny": "0",
            })

    payload = {
        "name": channel_name,
        "type": 0,                   # 0 = GUILD_TEXT
        "topic": f"🏆 Hackathon team channel for {hackathon_name} | Members: {', '.join(usernames)}",
        "permission_overwrites": permission_overwrites,
    }

    if category_id:
        payload["parent_id"] = category_id

    url = f"{DISCORD_API_BASE}/guilds/{guild_id}/channels"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=_headers(token), json=payload)

        if response.status_code == 201:
            data = response.json()
            channel_id = data.get("id")
            channel_url = f"https://discord.com/channels/{guild_id}/{channel_id}"
            print(f"[Discord] ✅ Created channel #{channel_name} (id={channel_id})")
            return {
                "success": True,
                "channel_id": channel_id,
                "channel_name": channel_name,
                "channel_url": channel_url,
                "error": None,
            }
        else:
            error_body = response.text
            print(f"[Discord] ❌ Failed to create channel. Status={response.status_code} Body={error_body}")
            return {
                "success": False,
                "channel_id": None,
                "channel_name": channel_name,
                "channel_url": None,
                "error": f"Discord API error {response.status_code}: {error_body}",
            }

    except httpx.RequestError as e:
        print(f"[Discord] ❌ Network error: {e}")
        return {
            "success": False,
            "channel_id": None,
            "channel_name": None,
            "channel_url": None,
            "error": f"Network error contacting Discord: {str(e)}",
        }

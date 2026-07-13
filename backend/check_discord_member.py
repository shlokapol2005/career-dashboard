import asyncio
import httpx
import os

TOKEN = ""
GUILD_ID = ""
with open(".env") as f:
    for line in f:
        if line.startswith("DISCORD_BOT_TOKEN="):
            TOKEN = line.strip().split("=", 1)[1]
        elif line.startswith("DISCORD_GUILD_ID="):
            GUILD_ID = line.strip().split("=", 1)[1]

USER_ID = "1138766288718680084" # Shloka's ID

async def check():
    url = f"https://discord.com/api/v10/guilds/{GUILD_ID}/members/{USER_ID}"
    headers = {"Authorization": f"Bot {TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        if res.status_code == 200:
            print("✅ User IS in the server!")
        elif res.status_code == 404:
            print("❌ User IS NOT in the server (404 Not Found).")
        else:
            print(f"Error checking user: {res.status_code} - {res.text}")

asyncio.run(check())

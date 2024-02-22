import os
import base64
import requests
import asyncio
import uuid
import json
from dotenv import load_dotenv

load_dotenv()

def create_discord_guild():
    response = requests.post('https://discord.com/api/v10/guilds', 
                            json={
                                'name': f'kuudra utils emoji {str(uuid.uuid4())}'
                            },
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.json()

def delete_discord_guild(guild_id):
    response = requests.delete(f'https://discord.com/api/v10/guilds/{guild_id}',
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.status_code == 204

def get_all_discord_guilds():
    response = requests.get('https://discord.com/api/v10/users/@me/guilds',
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.json()

def get_discord_guild(guild_id):
    response = requests.get(f'https://discord.com/api/v10/guilds/{guild_id}',
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.json()

def create_discord_emoji(guild_id, name, image):
    response = requests.post(f'https://discord.com/api/v10/guilds/{guild_id}/emojis', 
                            json={
                                'name': name,
                                'image': get_emoji(image)
                            },
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.json()

def delete_discord_emoji(guild_id, emoji_id):
    response = requests.delete(f'https://discord.com/api/v10/guilds/{guild_id}/emojis/{emoji_id}',
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.status_code == 204

def get_emoji(url):
    # Fetch the image from the URL
    response = requests.get(url)
    
    if response.status_code == 200:
        # Encode the image in base64
        image_data = base64.b64encode(response.content).decode('utf-8')
        
        # Create the Data URI
        data_uri = f"data:image/{url.split('.')[-1]};base64,{image_data}"
        
        return data_uri
    else:
        print(f"Failed to fetch image. Status code: {response.status_code}")
        return None

def get_guild_emojis(guild_id):
    response = requests.get(f'https://discord.com/api/v10/guilds/{guild_id}/emojis',
                            headers={
                                 'Authorization': f'Bot {os.getenv("DISCORD_BOT_TOKEN")}'
                            })
    return response.json()

def get_stored_items():
    response = requests.get('http://localhost:20000/api/stored/items')
    return response.json()

def get_item_hashes():
    response = requests.get('https://raw.githubusercontent.com/Altpapier/Skyblock-Item-Emojis/main/v3/itemHash.json')
    return response.json()

def get_image_hashes():
    response = requests.get('https://raw.githubusercontent.com/Altpapier/Skyblock-Item-Emojis/main/v3/images.json')
    return response.json()

async def main():
    guilds = list(filter(lambda x: x.get('name').startswith('kuudra utils emoji'), get_all_discord_guilds()))
    all_emojis = []
    for guild in guilds:
        emojis = get_guild_emojis(guild.get('id'))
        all_emojis.extend(f'<:{x.get("name")}:{x.get("id")}>' for x in emojis)
    print(all_emojis)
        # emojis += f'<:{x.get("name")}:{x.get("id")}>' for x in emojis
        # print(f"emojis for {guild.get('name')}: {get_guild_emojis(guild.get('id'))}")
    # items = get_stored_items()
    # hashes = get_item_hashes()
    # images = get_image_hashes()

    # guild = create_discord_guild().get('id')

    # emojis = {}

    # for item in items:
    #     hash = hashes.get(item)
    #     image = images.get(hash).get('normal')
    #     print(f"Creating emoji for {item} with image {image}")
    #     emoji = create_discord_emoji(guild, item, image)

    #     if emoji.get('id') is None:
    #         print("creating new guild")
    #         guild = create_discord_guild().get('id')
    #         emoji = create_discord_emoji(guild, item, image)

    #     emojis[item] = f'<:{emoji.get("name")}:{emoji.get("id")}>'
            
    #     await asyncio.sleep(0.05)
    
    # with open('emojis.json', 'w') as f:
    #     f.write(json.dumps(emojis, indent=4))


if __name__ == '__main__':
    asyncio.run(main())
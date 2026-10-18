import urllib.request
import json
import os
import sys
import zipfile
import io
import shutil

token = open('.token').read().strip() if os.path.exists('.token') else ''
headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'Antigravity'}
if token:
    headers['Authorization'] = f'token {token}'

class NoAuthRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new_req = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new_req and 'Authorization' in new_req.headers:
            del new_req.headers['Authorization']
        return new_req

opener = urllib.request.build_opener(NoAuthRedirect)

# Query latest artifacts
req = urllib.request.Request('https://api.github.com/repos/Bundev-Coder/Auralis/actions/artifacts?per_page=5', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    artifacts = data.get('artifacts', [])

if not artifacts:
    print("No artifacts found!")
    sys.exit(1)

latest_art = artifacts[0]
art_id = latest_art['id']
art_name = latest_art['name']
print(f"Found latest artifact: {art_name} (ID: {art_id}, size: {latest_art.get('size_in_bytes', 0) / (1024*1024):.2f} MB)")

url = f'https://api.github.com/repos/Bundev-Coder/Auralis/actions/artifacts/{art_id}/zip'
print("Downloading artifact zip...")
req = urllib.request.Request(url, headers=headers)
zip_data = opener.open(req).read()
print(f"Downloaded zip: {len(zip_data) / (1024*1024):.2f} MB")

with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
    z.extractall(".")
    print("Extracted files:", z.namelist())

if os.path.exists("Auralis.ipa"):
    out_dir = r"C:\Users\ad\Documents\IPA_PACKAGES"
    os.makedirs(out_dir, exist_ok=True)
    dest = os.path.join(out_dir, "Auralis.ipa")
    shutil.copy2("Auralis.ipa", dest)
    print(f"SUCCESS: Auralis.ipa created and copied to {dest}! Size: {os.path.getsize(dest) / (1024*1024):.2f} MB")

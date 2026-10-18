import urllib.request
import json
import os
import zipfile
import io

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

url = 'https://api.github.com/repos/Bundev-Coder/Auralis/actions/artifacts/12138299202/zip'
print("Downloading Auralis-iOS-IPA artifact...")
req = urllib.request.Request(url, headers=headers)
zip_data = opener.open(req).read()
print(f"Downloaded zip: {len(zip_data) / (1024*1024):.2f} MB")

with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
    z.extractall(".")
    print("Extracted files:", z.namelist())

if os.path.exists("Auralis.ipa"):
    print(f"SUCCESS: Auralis.ipa created locally! Size: {os.path.getsize('Auralis.ipa') / (1024*1024):.2f} MB")

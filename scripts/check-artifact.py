import urllib.request
import json
import os

token = open('.token').read().strip() if os.path.exists('.token') else ''
headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'Antigravity'}
if token:
    headers['Authorization'] = f'token {token}'

req = urllib.request.Request('https://api.github.com/repos/Bundev-Coder/Auralis/actions/runs/39132153560/artifacts', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print('Total artifacts:', data.get('total_count', 0))
        for a in data.get('artifacts', []):
            print(f"Artifact: {a['name']} ({a['size_in_bytes'] / (1024*1024):.2f} MB)")
            print(f"Download URL: {a['archive_download_url']}")
except Exception as e:
    print('Error:', e)

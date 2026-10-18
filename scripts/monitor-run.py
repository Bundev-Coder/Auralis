import sys
import os
import time
import json
import urllib.request

TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
if not TOKEN:
    token_path = os.path.join(os.path.dirname(__file__), "..", ".token")
    if os.path.exists(token_path):
        with open(token_path, "r", encoding="utf-8") as f:
            TOKEN = f.read().strip()

HEADERS = {
    "User-Agent": "Antigravity",
    "Accept": "application/vnd.github+json"
}
if TOKEN:
    HEADERS["Authorization"] = f"token {TOKEN}"

class NoAuthRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new_req = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new_req and 'Authorization' in new_req.headers:
            del new_req.headers['Authorization']
        return new_req

opener = urllib.request.build_opener(NoAuthRedirect)

# Determine RUN_ID
run_id = None
if len(sys.argv) > 1 and sys.argv[1].isdigit():
    run_id = int(sys.argv[1])
else:
    print("Fetching latest workflow run...")
    for _ in range(10):
        try:
            req = urllib.request.Request("https://api.github.com/repos/Bundev-Coder/Auralis/actions/runs?per_page=1", headers=HEADERS)
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                runs = data.get("workflow_runs", [])
                if runs:
                    run_id = runs[0]["id"]
                    print(f"Latest run ID: {run_id} ({runs[0]['head_commit']['message']})")
                    break
        except Exception as e:
            print(f"Error fetching latest run: {e}")
        time.sleep(3)

if not run_id:
    print("Could not find a workflow run!")
    sys.exit(1)

print(f"Monitoring GitHub Actions Run {run_id}...")

last_step = ""
while True:
    try:
        url = f"https://api.github.com/repos/Bundev-Coder/Auralis/actions/runs/{run_id}/jobs"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
        
        jobs = data.get("jobs", [])
        if jobs:
            job = jobs[0]
            job_id = job.get("id")
            status = job.get("status")
            conclusion = job.get("conclusion")
            steps = job.get("steps", [])
            running_step = None
            for s in steps:
                if s.get("status") == "in_progress":
                    running_step = s.get("name")
                    break
            
            cur = f"Status: {status} | Conclusion: {conclusion} | Current Step: {running_step}"
            if cur != last_step:
                print(cur, flush=True)
                last_step = cur
            
            if status == "completed":
                print(f"Job completed with conclusion: {conclusion}", flush=True)
                if conclusion == "success":
                    print("BUILD SUCCEEDED!", flush=True)
                    sys.exit(0)
                else:
                    print("BUILD FAILED! Fetching error logs...", flush=True)
                    try:
                        log_req = urllib.request.Request(f"https://api.github.com/repos/Bundev-Coder/Auralis/actions/jobs/{job_id}/logs", headers=HEADERS)
                        raw_logs = opener.open(log_req).read().decode("utf-8", errors="ignore")
                        err_lines = [l for l in raw_logs.splitlines() if "error:" in l or "fatal error:" in l]
                        print("\n--- Failure Errors ---\n" + "\n".join(err_lines[-20:]) + "\n----------------------\n")
                    except Exception as le:
                        print(f"Error fetching logs: {le}")
                    sys.exit(1)
    except Exception as e:
        print(f"Error querying GitHub API: {e}", flush=True)
    
    time.sleep(15)

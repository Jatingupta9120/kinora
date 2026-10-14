"""Summarize a REA capture-browser-scenario Evidence file.

Prints step outcomes, requests grouped by host and resource type, and normalized
document/XHR/fetch endpoints (IDs collapsed, query values dropped - only names kept).
"""
import json, sys, re, collections, os
from urllib.parse import urlparse


def url_of(u):
    return (u.get("url") or "") if isinstance(u, dict) else (u or "")


def qnames(u):
    return u.get("query_parameter_names", []) if isinstance(u, dict) else []


path = sys.argv[1]
n = json.load(open(path))["data"]["normalized_result"]
ev = n["events"]["items"]
reqs = [e for e in ev if e.get("kind") == "request"]
resps = {e["transaction_id"]: e for e in ev if e.get("kind") == "response"}
print(f"== {os.path.basename(path)}  duration={n['duration_ms']}ms  completeness={n['completeness']['status']}"
      f"  missing={n['completeness'].get('missing_sections')}  requests={len(reqs)}")
for s in n["steps"]:
    err = json.dumps(s["error"])[:200] if s.get("error") else ""
    print(f"  step {s['step_id']:14} {s['status']:9} -> {url_of(s['after_url'])[:100]} {err}")

by = collections.Counter((urlparse(url_of(r["url"])).netloc, r.get("resource_type")) for r in reqs)
print("  hosts x type:")
for (h, t), c in by.most_common(30):
    print(f"    {c:4} {t!s:10} {h}")


def norm(u):
    p = urlparse(url_of(u))
    pth = re.sub(r"/[0-9A-Z]{20,}", "/<ID>", p.path)
    pth = re.sub(r"/[0-9a-f-]{16,}", "/<hex>", pth)
    keys = sorted(set(qnames(u)))
    return f"{p.netloc}{pth}" + (f"?{','.join(keys)[:140]}" if keys else "")


api = collections.Counter()
for r in reqs:
    if r.get("resource_type") in ("xhr", "fetch", "document", "eventsource", "websocket", "other", "ping"):
        st = resps.get(r["transaction_id"], {}).get("status")
        api[(r["method"], r.get("resource_type"), norm(r["url"]), st)] += 1
print("  document/xhr/fetch/other (normalized):")
for (m, t, u, st), c in sorted(api.items(), key=lambda x: (-x[1], x[0][2])):
    print(f"    {c:3} {m:5} {t!s:9} {st!s:4} {u[:180]}")
kinds = collections.Counter(e.get("kind") for e in ev)
print("  event kinds:", dict(kinds))
for e in ev:
    if e.get("kind") in ("request-failed", "page-error"):
        print("   ", e.get("kind"), norm(e["url"]) if e.get("url") else "", json.dumps(e.get("failure") or e.get("message", ""))[:120])

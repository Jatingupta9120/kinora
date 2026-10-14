"""Summarize a REA inspect-web-page Evidence file into reviewable facts."""
import json, sys, collections
from urllib.parse import urlparse

d = json.load(open(sys.argv[1]))
d = d.get("data", d)
n = d["normalized_result"]
print("URL:", n["target"]["url"], "| title:", n["target"]["title"])
print("completeness:", n["completeness"]["status"], "| dom nodes:", n["dom"]["total_nodes"], "| ax nodes:", n["accessibility"]["total_nodes"])

roles = collections.Counter()
interesting = []
for node in n["accessibility"]["nodes"]:
    r = node.get("role")
    roles[r] += 1
    if r in ("banner", "navigation", "main", "contentinfo", "search", "searchbox", "heading", "combobox", "region", "dialog", "form"):
        interesting.append((r, (node.get("name") or "")[:90]))
print("\nAX roles:", roles.most_common(25))
print("\nLandmarks/headings:")
for r, name in interesting[:80]:
    print(f"  {r:12} {name}")
links = [(node.get("name") or "")[:60] for node in n["accessibility"]["nodes"] if node.get("role") == "link"]
print(f"\nLinks ({len(links)}):", links[:60])

hosts = collections.Counter(urlparse(s.get("url") or "").netloc for s in n["scripts"]["items"])
print("\nScript hosts:", hosts.most_common(15), "| total scripts:", n["scripts"]["total"])
req = n["network"]["requests"]
rh = collections.Counter((urlparse(r.get("url", "")).netloc, r.get("resource_type") or r.get("type")) for r in req)
print(f"\nNetwork requests in window: {len(req)}")
for (h, t), c in rh.most_common(25):
    print(f"  {c:4} {t!s:12} {h}")
print("\nResponse metadata sample:")
for r in n["metadata"]["responses"][:8]:
    print("  ", {k: r[k] for k in list(r)[:8]})
st = n["storage"]
print("\nStorage:", {k: st[k] for k in ("local_storage_keys", "session_storage_keys", "indexed_db_names", "cache_names")})
print("WebSockets:", len(n["network"]["websocket_connections"]), "| workers:", len(n["workers"]))
print("agent_hints:", n["metadata"].get("agent_hints"))

"""Generate REA capture-browser-scenario inputs for signed-out, public Prime Video pages."""
import json, os, sys

CHROME = os.path.expanduser("~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome")
OUT = sys.argv[1]
BASE = "https://www.primevideo.com"
DESKTOP = {"width": 1440, "height": 900, "device_scale_factor": 1}
MOBILE = {"width": 390, "height": 844, "device_scale_factor": 2}

def settle(ms=6000):
    return {"step_id": "settle", "action": "wait_for_timeout", "duration_ms": ms}

def scenario(path, actions, viewport=DESKTOP):
    return {
        "browser": {"mode": "launch", "executable_path": CHROME, "headless": True},
        "environment": {"viewport": viewport, "locale": "en-US", "timezone": "Asia/Kolkata",
                        "color_scheme": "dark", "reduced_motion": "reduce", "service_workers": "allow"},
        "start_url": {"url": BASE + path},
        "actions": actions,
        # Metadata only: no request/response bodies, no header values.
        "capture": {"at_end": ["accessibility", "screenshot", "url"], "events": ["network", "page-errors"]},
    }

search_actions = [
    settle(4000),
    {"step_id": "open-search", "action": "click", "timeout_ms": 10000,
     "locator": {"kind": "role", "role": "button", "name": "Search Prime Video"}},
    {"step_id": "type-query", "action": "fill", "timeout_ms": 10000,
     "locator": {"kind": "css", "selector": "input[type='search'] >> visible=true"},
     "value": {"source": "literal", "value": "reacher"}},
    {"step_id": "typeahead", "action": "wait_for_timeout", "duration_ms": 2500},
    {"step_id": "submit", "action": "press", "timeout_ms": 10000,
     "locator": {"kind": "css", "selector": "input[type='search'] >> visible=true"},
     "key": "Enter"},
    {"step_id": "results", "action": "wait_for_timeout", "duration_ms": 5000},
]

scenarios = {
    "10-home-desktop": scenario("/", [settle()]),
    "11-home-mobile": scenario("/", [settle()], MOBILE),
    "12-detail-desktop": scenario("/detail/0FVDNWWT5EDB851ATB1KO6D1PV", [settle()]),
    "13-detail-mobile": scenario("/detail/0FVDNWWT5EDB851ATB1KO6D1PV", [settle()], MOBILE),
    "14-genre-action": scenario("/genre/action", [settle()]),
    "15-categories": scenario("/categories", [settle()]),
    "16-search-flow": scenario("/", search_actions),
    "17-tv": scenario("/tv", [settle()]),
}
for name, s in scenarios.items():
    with open(os.path.join(OUT, name + ".json"), "w") as f:
        json.dump(s, f, indent=2)
print("\n".join(sorted(scenarios)))

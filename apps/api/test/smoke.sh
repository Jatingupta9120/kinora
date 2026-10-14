#!/usr/bin/env bash
# End-to-end smoke test against a running, seeded API (default http://localhost:4000).
# Creates its own throwaway accounts, so it does not depend on (or change) the demo accounts.
set -u
A=${API_URL:-http://localhost:4000}
fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS $1"; else echo "FAIL $1: expected [$2] got [$3]"; fail=1; fi
}
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
json() { python3 -I -c "import json,sys; d=json.load(sys.stdin); print($1)"; }
post() { curl -s -XPOST "$A$1" -H 'content-type: application/json' "${@:3}" -d "$2"; }
signup() { post /auth/register "{\"email\":\"$1\",\"password\":\"smoke-password\"}" | json "d['token']"; }

check "lighthouse search hits tagline" "['harbor-lights']" "$(curl -s "$A/search?q=lighthouse" | json "[i['slug'] for i in d['items']]")"
check "kids home only all/7+" "['7+', 'all']" "$(curl -s "$A/catalog/pages/home?maxMaturity=7%2B" | json "sorted({t['maturity'] for r in d['rails'] for t in r['titles']})")"
check "title detail hides media ids" "False" "$(curl -s "$A/catalog/titles/harbor-lights" | json "'mediaId' in json.dumps(d)")"

run=$(date +%s%N)
T=$(signup "smoke$run@kinora.test"); H="authorization: Bearer $T"
check "duplicate signup rejected" 409 "$(status -XPOST "$A/auth/register" -H 'content-type: application/json' -d "{\"email\":\"smoke$run@kinora.test\",\"password\":\"smoke-password\"}")"
P=$(curl -s "$A/profiles" -H "$H" | json "d[0]['id']")
K=$(post /profiles '{"name":"Kids","kids":true}' -H "$H" | json "d['id']")
play() { status -XPOST "$A/playback/$1" -H "$H" -H 'content-type: application/json' -d "{\"profileId\":\"$2\"}"; }

check "new account starts on basic plan" basic "$(curl -s "$A/auth/me" -H "$H" | json "d['plan']")"
check "basic plan plays free title" 200 "$(play paper-comets "$P")"
check "basic plan blocked from premium" 402 "$(play iron-meridian "$P")"
check "kids profile blocked from 16+" 403 "$(play cold-open "$K")"
check "kids profile can't watchlist 18+" 403 "$(status -XPUT "$A/profiles/$K/watchlist/granite" -H "$H")"

curl -s -XPUT "$A/profiles/$P/progress/saffron-street" -H "$H" -H 'content-type: application/json' \
  -d '{"episodeId":"saffron-street-s1e3","positionSec":300,"durationSec":1680}' >/dev/null
check "series resumes saved episode" "saffron-street-s1e3 300" "$(post /playback/saffron-street "{\"profileId\":\"$P\"}" -H "$H" | json "d['episode']['id'], d['resumeSec']" | tr -d "(),'")"
check "continue watching lists it at 18%" "True" "$(curl -s "$A/profiles/$P/continue" -H "$H" | json "any(c['slug']=='saffron-street' and c['progressPct']==18 for c in d)")"

curl -s -XPUT "$A/profiles/$P/watchlist/northbound" -H "$H" >/dev/null
curl -s -XPUT "$A/profiles/$P/watchlist/northbound" -H "$H" >/dev/null
check "watchlist add is idempotent" "['northbound']" "$(curl -s "$A/profiles/$P/watchlist" -H "$H" | json "[c['slug'] for c in d]")"
check "overlay: watchlist + entitlement" "['northbound'] True False" "$(curl -s "$A/profiles/$P/overlay?slugs=northbound,paper-comets,iron-meridian" -H "$H" | json "d['watchlist'], d['entitled']['paper-comets'], d['entitled']['iron-meridian']" | tr -d "(),")"
check "watchlists are per profile" "[]" "$(curl -s "$A/profiles/$K/watchlist" -H "$H" | json "[c['slug'] for c in d]")"

curl -s -XPUT "$A/subscription" -H "$H" -H 'content-type: application/json' -d '{"plan":"premium"}' >/dev/null
check "premium plan plays premium title" 200 "$(play iron-meridian "$P")"

T2=$(signup "smoke$run-other@kinora.test")
check "cannot read another account's profile" 403 "$(status "$A/profiles/$P/watchlist" -H "authorization: Bearer $T2")"
check "no token -> 401" 401 "$(status "$A/profiles")"
check "wrong password -> 401" 401 "$(status -XPOST "$A/auth/login" -H 'content-type: application/json' -d "{\"email\":\"smoke$run@kinora.test\",\"password\":\"wrong-password\"}")"
check "unknown body field rejected" 400 "$(status -XPOST "$A/profiles" -H "$H" -H 'content-type: application/json' -d '{"name":"X","kids":false,"admin":true}')"
check "invalid maturity rejected" 400 "$(status "$A/catalog/pages/home?maxMaturity=21")"
check "last profile can't be deleted" 400 "$(status -XDELETE "$A/profiles/$(curl -s "$A/profiles" -H "authorization: Bearer $T2" | json "d[0]['id']")" -H "authorization: Bearer $T2")"

exit $fail

#!/usr/bin/env bash
# Regenerates src/infrastructure/auth/breached-passwords.json from public breached-password lists.
# Sources: SecLists (MIT), pinned to a commit so the output is reproducible. Dev-only; never runs in the app.
set -euo pipefail

COMMIT="${SECLISTS_COMMIT:-a252ee440077942778d43b0a087ff01870900f23}"
BASE="https://raw.githubusercontent.com/danielmiessler/SecLists/${COMMIT}/Passwords/Common-Credentials"
LISTS=("xato-net-10-million-passwords-1000000.txt" "100k-most-used-passwords-NCSC.txt")
OUT="$(cd "$(dirname "$0")/../.." && pwd)/src/infrastructure/auth/breached-passwords.json"

# Entries the default gitleaks rules mistake for credentials (a keyword such as "password", "key" or
# "linkedin" next to the following entry). Dropped here instead of weakening the secret scan.
# After regenerating, run `gitleaks dir src/infrastructure/auth/breached-passwords.json` and add any new ones.
SCANNER_FALSE_POSITIVES=(
  'fakepassword'
  'linkedin.com'
  'linkedin1234'
  'linkedin2010'
  'linkedin2011'
  'linkedin2012'
  'linkedinlinkedin'
  'linkedinpass'
  'unpassworded'
  'virusliarcheatersweknowursecretbitches'
  'vk_password__edison'
  'vuorshpelhapili'
  'whiskey_grrrrl'
  'whiskeyyeksihw'
  'wildpassword'
  'williamshakey'
  'wituhanoff@@@*password'
  'wixapic955119'
  'xeniyapiraniya'
  'yankeesmickeyo'
  'yeksihwwhiskey'
  'zkeyysqcdtn687'
)

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
for list in "${LISTS[@]}"; do
  curl -fsSL "${BASE}/${list}" -o "${work}/${list}"
done

# Only printable ASCII entries of 12 to 256 characters: shorter ones are already refused by length.
LC_ALL=C cat "${work}"/*.txt | tr -d '\r' | LC_ALL=C awk 'length($0) >= 12 && length($0) <= 256 && $0 !~ /[^ -~]/' | tr 'A-Z' 'a-z' | LC_ALL=C sort -u > "${work}/all"
printf '%s\n' "${SCANNER_FALSE_POSITIVES[@]}" > "${work}/excluded"
LC_ALL=C grep -vxFf "${work}/excluded" "${work}/all" > "${work}/entries"

node - "${work}/entries" "$OUT" "$COMMIT" <<'NODE'
const fs = require("node:fs");
const [entriesFile, out, commit] = process.argv.slice(2);
const entries = fs.readFileSync(entriesFile, "utf8").split("\n").filter(Boolean);
const doc = {
  source: `SecLists ${commit}: Passwords/Common-Credentials/xato-net-10-million-passwords-1000000.txt and 100k-most-used-passwords-NCSC.txt`,
  license: "MIT License. Copyright (c) 2018 Daniel Miessler. https://github.com/danielmiessler/SecLists/blob/master/LICENSE",
  filter: "printable ASCII, 12 to 256 characters, lowercased, deduplicated, minus entries flagged by gitleaks (see the script)",
  entries,
};
fs.writeFileSync(out, JSON.stringify(doc, null, 0).replace('"entries":[', '"entries":[\n').replace(/","/g, '",\n"') + "\n");
console.log(`${entries.length} entries written to ${out}`);
NODE

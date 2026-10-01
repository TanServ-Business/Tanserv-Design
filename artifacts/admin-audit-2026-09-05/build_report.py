"""Build the read-only Admin audit report from this run's capture manifest."""
from pathlib import Path
import collections
import hashlib
import html
import json
import struct

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / 'capture-manifest.json').read_text())
esc = lambda value: html.escape(str(value), quote=True)
captures = {item['key']: item for item in data['captures']}

state_names = {
 '01a-directory': 'Global Directory', '01b-directory-add': 'Directory: Add Contact',
 '02a-branch-create': 'Create Branch', '03a-holiday-create': 'Create Holiday',
 '03b-holiday-states': 'Holiday state dropdown', '04a-bank-create': 'Create Bank',
 '05a-contact-create': 'Create Internal Company Contact', '06a-custom-aging': 'Custom aging groups',
 '06b-create-bucket': 'Create custom aging group', '06c-dispositions': 'Disposition hierarchy',
 '06d-purge-policy': 'Invoice purge policy', '07a-document-create': 'Create Document',
 '07b-document-presets': 'Document presets', '08a-role-names': 'Role display-name form',
 '09a-user-create': 'Create User: Step 1', '09b-user-bulk': 'User bulk-upload history',
 '11a-submission-create': 'Create submission strategy', '11b-push-settings': 'Push Email Settings',
 '12a-visit-config': 'Visit Module', '12b-monthend-config': 'Monthend: manual initial state',
 '12c-client-confirmation-config': 'Client Confirmation history', '12d-pdc-config': 'PDC Configuration',
 '12e-escalation-config': 'Escalation Matrix lists', '12f-issue-tracker-config': 'Issue Tracker Configuration',
 '13a-portfolio-upload': 'Portfolio upload dialog', '19a-group-create': 'Create Group',
 '20a-customer-create': 'Create Customer', '20b-customer-bulk': 'Customer Bulk Upload',
 '21a-customer-contact-create': 'Create Customer Contact', '22a-template-edit': 'Template Edit attempt',
 '25a-strategy-create': 'Create Strategy: initial state', '26a-invoice-create': 'Create Invoice',
 '30a-subclient-create': 'Create Subclient', '33a-create-ticket': 'Create Support Ticket',
 '33b-feedback': 'Feedback form',
}
next_steps = [
 'Match dashboard insets and chart width; make zero-value mock charts consistent with the counters.',
 'Restore Create New and the exact branch field grid, required states, lookups and modal size.',
 'Preserve one-line tabs; match modal corners, input heights, badge variants and state selection.',
 'Restore row-level Delete presentation and the reference toolbar.',
 'Restore Create New and the reference selector affordances and widths.',
 'Recreate the 19-chip custom group picker, colour field, helper text and table proportions.',
 'Match row density and modal sizing; disable Add Selected when no preset is selected.',
 'Keep all four role groups in the desktop row and reproduce heading colours.',
 'Restore credential-send UI as non-operative prototype controls, and distinct role badge colours.',
 'Match widths, density and switch styling without triggering live switches.',
 'Remove settings from the default strategy list; match both the strategy form and Push Email tab.',
 'Match each of the seven tabs individually; restore switches, summaries, helper copy and readable headings.',
 'Match conditional Failed visibility, status colours, count colours and labelled progress.',
 'Restore the warning banner and single-row upload toolbar.',
 'Match GRN-specific statuses, count colours, progress labels and conditional downloads.',
 'Match CN/Advance widths, statuses, rejection counts and conditional downloads.',
 'Restore Payment Receipt failure styling and progress presentation.',
 'Match this page’s own reference status colours, conditional downloads and labelled progress.',
 'Use the source 500px single-column Group form and Save Group label.',
 'Keep Actions first; reproduce the two-column customer form and customer upload schema.',
 'Restore the five-column contact table and full-width Customer lookup in its form.',
 'Restore Actions first and Description; remove extra Status/actions unless the reference supports them. Resolve reference editor access before matching it.',
 'Restore guidance, integration link and masked-field controls; inspect credential-bearing states only under an appropriate safe workflow.',
 'Restore introductory guidance, client badge and the reference account columns.',
 'Match list density and creation hierarchy, required markers and dependent disabled states.',
 'Match upload history and button styles; preserve the close invoice form and verify lookup/date branches.',
 'Replace the substituted bulk workflow with the reference search and per-row reallocation UI, using sample-only actions.',
 'Match the initial search-only deletion state before implementing mock search/result/confirmation states.',
 'Restore the compact centered password-selection card and remove extra tab/banner.',
 'Restore logo-edit affordance, renewal/status chips and source subclient layout.',
 'Restore the compact policy/override/purge cards, explanatory text and last-purge details.',
 'Remove duplicate empty-state copy and match the filter/action/table layout.',
 'Match hero inset and six-column category layout; remove the extra ticket attachment block.',
]

def health_class(value):
    if 'Blocked' in value or value == 'Different state': return 'unknown'
    if 'Major' in value: return 'major'
    if value.startswith('Close'): return 'close'
    return 'mismatch'

def badge(value):
    return f'<span class="badge {health_class(value)}">{esc(value)}</span>'

integrity = []
def image_size(blob):
    if blob[:8] == b'\x89PNG\r\n\x1a\n':
        return 'png', struct.unpack('>II', blob[16:24])
    assert blob[:2] == b'\xff\xd8', 'Unexpected screenshot format'
    pos = 2
    while pos < len(blob):
        assert blob[pos] == 255
        while blob[pos] == 255: pos += 1
        marker = blob[pos]
        pos += 1
        if marker in (0xd8, 0xd9): continue
        length = int.from_bytes(blob[pos:pos+2], 'big')
        if marker in (0xc0, 0xc1, 0xc2, 0xc3):
            height, width = struct.unpack('>HH', blob[pos+3:pos+7])
            return 'jpg', (width, height)
        pos += length
    raise ValueError('JPEG dimensions not found')

for capture in data['captures']:
    path = Path(capture['file'])
    blob = path.read_bytes()
    image_format, size = image_size(blob)
    if path.suffix != '.' + image_format:
        destination = path.with_suffix('.' + image_format)
        assert not destination.exists(), destination
        path.rename(destination)
        path = destination
        capture['file'] = str(path)
    assert size == (1440, 1000), (path, size)
    integrity.append({'file': path.name, 'width': size[0], 'height': size[1],
                      'sha256': hashlib.sha256(blob).hexdigest()})
(ROOT / 'capture-manifest.json').write_text(json.dumps(data, indent=2))

def image_name(key):
    return Path(captures[key]['file']).name

def pair(key):
    reference_key = key + '-reference'
    local_key = '01-dashboard-local-desktop' if key == '01-dashboard' else key + '-local'
    figures = []
    for label, capture_key in [('Live reference', reference_key), ('Local admin.html', local_key)]:
        capture = captures[capture_key]
        filename = Path(capture['file']).name
        figures.append(f'<figure><figcaption>{label}</figcaption><a href="{esc(filename)}"><img loading="lazy" src="{esc(filename)}" alt="{esc(key)} — {label}, 1440 by 1000"></a><small><a href="{esc(capture["url"])}">Captured page URL</a></small></figure>')
    return '<div class="pair">' + ''.join(figures) + '</div>'

states = sorted(data['states'], key=lambda item: item['key'])
counts = collections.Counter(health_class(n['health']) for n in data['notes'])
summary = f'33 landing pages + 35 secondary states/attempts • 136 screenshots • 1440 × 1000 • 5 September 2026'
priorities = [
 ('P1 — Different workflows', 'Invoice Reallocation (27), Invoice Deletion (28), Customer Bulk Upload (20b), Directory (1a) and submission settings (11/11b) need structural correction before fine visual tuning.'),
 ('P1 — Missing fields and controls', 'Custom aging groups (6b) omit the colour picker and most bucket choices. Bank rows (4) omit Delete; User Setup (9) omits credential-send controls. Submission creation (11a) lacks document search and most choices.'),
 ('P1 — Readability and initial control states', 'Several configuration/retention/password headings use dark text on dark purple. Document presets (7b) show an enabled-looking Add Selected with no selection; Strategy creation (25a) presents dependent controls differently.'),
 ('P2 — Forms and layout', 'Branch, Group, Customer, Customer Contact and Subclient forms use the wrong widths, field pairing, placeholders or footer labels. Role groups wrap; actions move out of view on wide tables.'),
 ('P2 — Status and sample states', 'Bulk histories must model success, rejection and conditional failed downloads accurately. Static sample values are allowed; contradictory chart states and missing visual status variants are not evidence of fidelity.'),
]
limits = [
 'This is a complete pass over the 33 currently exposed Admin landing pages, not proof that every reachable state or responsive width matches. The 35 secondary entries below include one blocked editor attempt and one non-equivalent empty/populated state.',
 'No live Save, Upload, Delete, credential send, purge, password entry, account change or file submission was performed. This was design-only observation; application source files were not edited.',
 'Not verified: notification/profile dropdowns; dashboard lower sections and drilldowns; every edit/delete confirmation; holiday calendar/week-off branches and full state list; role-dependent User Step 2; complete lookup inventories; all upload-modal variants and file-selected/error states; Bulk Document Limbo; customer lower form fields and dependent selections; strategy target/template/schedule branches; escalation process/matrix forms; PDC user assignment; retention dry-run/purge confirmations; password-selected states; support article/ticket-detail journeys.',
 'Template Master’s first Edit attempt failed in the live reference with “Failed to initiate edit”. Editor parity is blocked; the failure is not an intended design to copy. Credential-bearing SMTP/account edits and reveal controls were intentionally not opened.',
 'Live and local sample records differ. Exact names, dates, totals or row counts were not treated as synchronization bugs. Differences in schema, available states, conditionally visible actions and row density were assessed.',
 'Screenshots used matched 1440 × 1000 CSS viewports. Source images were visibly softer than local captures; do not infer pixel-perfect font or anti-aliasing differences from that softness. Modal widths and row sizes in notes are approximate visual measurements.',
 'Accessibility was a limited visual/DOM/keyboard spot-check, not a screen-reader, zoom, mobile, reduced-motion or full WCAG assessment. On the local subclient dialog, the title relationship and aria-modal were present, opening focused Close, reverse Tab remained inside, Escape closed it and focus returned. This does not certify every dialog.',
 'Artifacts contain the visible test-tenant data captured during this audit. Keep them local unless sharing is approved. The report references only accepted screenshots from this run; earlier rejected/unaligned captures are excluded.',
]

toc_rows = []
sections = []
md = ['# Admin design parity audit', '', '**Verdict: admin.html does not fully match the live Admin platform.**', '', summary, '',
      'No landing page has been signed off as exact. Close means recognizably similar, not passed. This report does not certify all states.', '', '## Priority findings', '']
for title, note in priorities:
    md += [f'- **{title}:** {note}']

for item in data['notes']:
    number = item['step']
    module = 'dashboard' if number == 1 else data['localRoutes'][number - 2]['url'].split('module=')[1].split('&')[0]
    key = f'{number:02d}-{module}'
    name = item['name']
    note = item['notes']
    toc_rows.append(f'<tr><td>{number}</td><td><a href="#{key}">{esc(name)}</a></td><td>{badge(item["health"])}</td></tr>')
    sections.append(f'<section id="{key}"><h2>{number}. {esc(name)}</h2>{badge(item["health"])}<p>{esc(note)}</p><p><strong>Next:</strong> {esc(next_steps[number-1])}</p>{pair(key)}</section>')
    md += ['', f'## {number}. {name}', '', f'Health: **{item["health"]}**', '', note, '', f'Next: {next_steps[number-1]}', '',
           f'![Live reference]({image_name(key + "-reference")})', '', f'![Local admin.html]({image_name("01-dashboard-local-desktop" if number == 1 else key + "-local")})']
    for state in states:
        if int(state['key'][:2]) != number: continue
        skey = state['key']
        sid = skey.split('-')[0].lstrip('0')
        text = state.get('notes', state.get('note', ''))
        label = state_names[skey]
        toc_rows.append(f'<tr class="sub"><td>{sid}</td><td><a href="#{skey}">{esc(label)}</a></td><td>{badge(state["health"])}</td></tr>')
        sections.append(f'<section id="{skey}" class="secondary"><h2>{sid}. {esc(label)}</h2>{badge(state["health"])}<p>{esc(text)}</p>{pair(skey)}</section>')
        md += ['', f'### {sid}. {label}', '', f'Health: **{state["health"]}**', '', text, '',
               f'![Live reference]({image_name(skey + "-reference")})', '', f'![Local admin.html]({image_name(skey + "-local")})']

md += ['', '## Limits and unverified states', ''] + ['- ' + x for x in limits]
md += ['', '## Acceptance gate for a later correction pass', '',
       'For each page: match the default layout; inventory every tab, popup, field, placeholder, option and required/disabled state; implement sample-only interactions; capture matched viewport/state pairs; verify keyboard behavior; mark unobservable branches as blocked rather than passed.', '',
       'Evidence: capture-manifest.json records source/local URLs and notes. evidence-integrity.json records dimensions and SHA-256 hashes for the 136 accepted screenshots.', '']
(ROOT / 'audit-report.md').write_text('\n'.join(md))

css = '''body{margin:0;background:#f5f6f8;color:#17212c;font:15px/1.55 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}header,section,.overview{background:white;border:1px solid #dfe3e8;border-radius:12px;padding:24px;margin:0 0 24px}h1{font-size:30px;margin:0 0 12px}h2{font-size:22px;margin:0 0 12px}h3{font-size:17px}.muted,small{color:#526170}a{color:#432479}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e3e7ec;vertical-align:top}.sub td:first-child{padding-left:25px}.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:12px;font-weight:650}.major{background:#fbe4e5;color:#8d1f2a}.mismatch{background:#fff0d6;color:#7a4800}.close{background:#e9f2ff;color:#225080}.unknown{background:#ececf0;color:#515166}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}figure{margin:0;min-width:0}figcaption{font-size:13px;font-weight:700;padding:8px;background:#f0edf5}img{width:100%;height:auto;display:block;border:1px solid #d8dce2;box-sizing:border-box}.secondary{border-left:4px solid #c7bdd9}li{margin-bottom:10px}.metrics{font-weight:650}.notice{padding:14px;background:#fff4de;border-left:4px solid #b77200}section{scroll-margin-top:16px}@media(max-width:800px){main{padding:12px}.pair{grid-template-columns:1fr}header,section,.overview{padding:16px}}'''
top = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin design audit — 5 September 2026</title><style>{css}</style></head><body><main><header><h1>Admin design parity audit</h1><p class="metrics">{esc(summary)}</p><p><strong>Verdict: admin.html does not fully match the live Admin platform.</strong></p><p>Landing-page assessments: {counts['major']} major mismatches, {counts['mismatch']} mismatches, {counts['close']} close but not exact. No exact-match signoff.</p><p class="notice">Read-only audit. No application changes or live submissions. Coverage of landing pages is complete; coverage of nested states is explicitly partial.</p></header>'''
top += '<div class="overview"><h2>Highest-impact findings</h2>' + ''.join(f'<h3>{esc(t)}</h3><p>{esc(n)}</p>' for t,n in priorities) + '</div>'
top += '<div class="overview"><h2>Scope, safety and limits</h2><ul>' + ''.join('<li>'+esc(x)+'</li>' for x in limits) + '</ul></div>'
top += '<div class="overview"><h2>Page and state inventory</h2><table><thead><tr><th>Step</th><th>Page / state</th><th>Health</th></tr></thead><tbody>' + ''.join(toc_rows) + '</tbody></table></div>'
tail = '''<section><h2>Acceptance gate for the correction pass</h2><p>For each page, match the landing layout, then inventory every tab, popup, field, placeholder, option and required/disabled state. Use sample-only interactions. Capture matched viewport/state pairs and verify keyboard behavior. Unobservable branches remain blocked, not passed.</p><p><a href="capture-manifest.json">Capture manifest and notes</a> · <a href="evidence-integrity.json">Screenshot dimensions and hashes</a> · <a href="audit-report.md">Markdown report</a></p><p>No screenshots or tenant data have been published externally.</p></section></main></body></html>'''
(ROOT / 'audit-report.html').write_text(top + ''.join(sections) + tail)
(ROOT / 'evidence-integrity.json').write_text(json.dumps(integrity, indent=2))
assert len(sections) == 68
assert len(integrity) == 136
print(json.dumps({'landing_health':dict(counts),'sections':len(sections),'screenshots':len(integrity),'report':str(ROOT/'audit-report.html')}))

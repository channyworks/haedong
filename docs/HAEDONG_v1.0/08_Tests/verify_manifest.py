from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1]
m=json.loads((R/'10_QA/manifest.json').read_text())
for row in m['files']:
 p=R/row['path']
 assert p.is_file(),row['path']
 assert p.stat().st_size==row['bytes'],row['path']
 assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],row['path']
print('PASS',len(m['files']),'files')

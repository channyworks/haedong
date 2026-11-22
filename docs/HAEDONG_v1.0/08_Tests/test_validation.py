import unittest,json,hashlib,sys,xml.etree.ElementTree as ET
from pathlib import Path
from copy import deepcopy
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'06_Codex'))
from reference_kernel import Kernel,State,RuleError,validate_orders,advance_until

def read(name):return json.loads((R/'07_GameData'/name).read_text())

class ArchiveTests(unittest.TestCase):
    def test_original_archive_hashes(self):
        hashes=json.loads((R/'09_References/source_hashes.json').read_text())
        for p,h in hashes.items():self.assertEqual(hashlib.sha256((R/'09_References/v01_original'/p).read_bytes()).hexdigest(),h,p)
    def test_promoted_snapshots_are_byte_identical(self):
        for f in ['ansi_branch_b.json','ANSI_B_POST_003.json']:
            self.assertEqual((R/'07_GameData'/f).read_bytes(),(R/'09_References/v01_original/scenarios'/f).read_bytes())
    def test_final_garrison(self):
        d=read('ANSI_B_POST_003.json');self.assertEqual(d['initial_garrison']-d['dead']-d['wounded'],d['available']);self.assertEqual(sum(d['units'].values()),d['available'])
    def test_prisoners(self):
        d=read('ANSI_B_POST_003.json');self.assertEqual(d['prisoners_captured']-d['prisoners_released_prior']-d['prisoners_exchange'],d['prisoners_remaining'])
    def test_no_false_addition_of_independent_people(self):
        d=read('accounting_audit.json');self.assertFalse(d['returnees']['add_to_garrison']);self.assertFalse(d['independent_outpost']['subtract_from_garrison'])
    def test_null_and_replacement(self):
        rows=read('ansi_branch_b.json');ids=[x['save'] for x in rows]
        self.assertEqual(len(set(ids)),len(ids));self.assertIn('B008R',ids);self.assertNotIn('B008',ids)
        for name in ['B022','POST_000','POST_001']:self.assertIsNone(next(x['available'] for x in rows if x['save']==name))
    def test_derived_checkpoints_match_source(self):
        for a,b in zip(read('ansi_branch_b.json'),read('checkpoints.json')):
            self.assertEqual(a['save'],b['id']);self.assertEqual(a['available'],b['available']);self.assertIsNone(b['absolute_date'])
    def test_event_order_and_references(self):
        events=read('events.json');self.assertEqual([e['minute'] for e in events],sorted(e['minute'] for e in events));ids={x['id'] for x in read('checkpoints.json')};self.assertTrue(all(e['checkpoint'] in ids for e in events))
    def test_character_ids_and_portraits(self):
        c=read('characters.json');self.assertEqual(len(c),len({x['id'] for x in c}))
        for x in c:self.assertTrue((R/'07_GameData'/x['portrait']).exists(),x['portrait'])
        child=next(x for x in c if x['id']=='yeon_namsaeng');self.assertEqual(child['visual_age'],11)
    def test_map_assets(self):
        m=read('maps.json');self.assertEqual(len(m),12)
        for x in m:
            p=R/'07_GameData'/x['svg'];ET.parse(p);self.assertTrue((R/'07_GameData'/x['png']).exists());self.assertFalse(x['historical_geography_verified'])
    def test_unknowns_preserved(self):
        for x in read('unknowns.json'):self.assertIsNone(x['value'])
        d=read('accounting_audit.json');self.assertFalse(d['supply_flow_complete']);self.assertFalse(d['casualty_flow_complete'])
    def test_json_syntax(self):
        for p in R.rglob('*.json'):json.loads(p.read_text())
    def test_schemas(self):
        try:import jsonschema
        except ImportError:self.skipTest('optional jsonschema not installed; stdlib syntax checked separately')
        jsonschema.validate(read('characters.json'),read('character.schema.json'))
        jsonschema.validate(read('checkpoints.json'),read('checkpoint.schema.json'))

class KernelTests(unittest.TestCase):
    def test_casualty_and_recovery(self):
        k=Kernel();k.submit('a',0,[{'kind':'casualty','dead':3,'wounded':7}]);k.submit('b',1,[{'kind':'recover','amount':4}]);self.assertEqual(vars(k.state)|{},vars(State(available=94,wounded=3,dead=3,version=2)))
    def test_failed_batch_is_atomic(self):
        k=Kernel();before=deepcopy(k.state);events=deepcopy(k.events)
        with self.assertRaises(RuleError):k.submit('a',0,[{'kind':'casualty','dead':1},{'kind':'consume_grain','amount':999999}])
        self.assertEqual(k.state,before);self.assertEqual(k.events,events);self.assertEqual(k.receipts,{})
    def test_idempotency_before_version_check(self):
        k=Kernel();ops=[{'kind':'capture','amount':3}];r=k.submit('a',0,ops);self.assertEqual(k.submit('a',0,ops),r);self.assertEqual(k.state.prisoners,3);self.assertEqual(k.state.version,1)
    def test_idempotency_mismatch(self):
        k=Kernel();k.submit('a',0,[{'kind':'advance','minutes':1}]);before=deepcopy(k.state)
        with self.assertRaises(RuleError):k.submit('a',0,[{'kind':'advance','minutes':2}])
        self.assertEqual(k.state,before)
    def test_stale_version(self):
        k=Kernel()
        with self.assertRaises(RuleError):k.submit('a',9,[])
        self.assertEqual(k.state.version,0)
    def test_prisoner_handover_and_no_double_release(self):
        k=Kernel();k.submit('a',0,[{'kind':'capture','amount':7},{'kind':'handover','amount':7}]);before=deepcopy(k.state)
        with self.assertRaises(RuleError):k.submit('b',1,[{'kind':'handover','amount':1}])
        self.assertEqual(k.state,before)
    def test_seed_reproducibility(self):
        a=Kernel(seed=23);b=Kernel(seed=23)
        for i in range(12):self.assertEqual(a.submit(str(i),i,[{'kind':'combat_example'}]),b.submit(str(i),i,[{'kind':'combat_example'}]))
    def test_integer_constraints(self):
        for x in [-1,True,1.5,None]:
            k=Kernel()
            with self.assertRaises(RuleError):k.submit('a',0,[{'kind':'advance','minutes':x}])
    def test_ai_cannot_mutate_state(self):
        with self.assertRaises(RuleError):validate_orders([{'unit_id':'mobile','kind':'move','target_node':'canyon','supply_delta':99}])
    def test_conflicting_unit_orders(self):
        with self.assertRaises(RuleError):validate_orders([{'unit_id':'a','kind':'move'},{'unit_id':'a','kind':'defend'}])
    def test_interrupt_remaining_and_no_automatic_resume(self):
        r=advance_until(10,60,[(20,'normal'),(35,'critical')]);self.assertEqual(r,{'minute':35,'elapsed':25,'remaining':35,'interrupted':True})
    def test_all_none_policies(self):
        self.assertEqual(advance_until(0,60,[(20,'normal')],'all')['minute'],20)
        self.assertEqual(advance_until(0,60,[(20,'critical')],'none')['minute'],60)
    def test_long_sequence_conserves_people(self):
        k=Kernel()
        for i in range(30):
            ops=[{'kind':'casualty','wounded':1}] if i%2==0 else [{'kind':'recover','amount':1}]
            k.submit(str(i),i,ops);k.state.validate()
        self.assertEqual(k.state.available,100)

if __name__=='__main__':unittest.main(verbosity=2)

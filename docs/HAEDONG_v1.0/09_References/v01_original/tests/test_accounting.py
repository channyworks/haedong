import json, unittest
from pathlib import Path
S=json.loads((Path(__file__).resolve().parents[1]/'scenarios/ANSI_B_POST_003.json').read_text())
class Accounting(unittest.TestCase):
 def test_garrison(self): self.assertEqual(S['available']+S['dead']+S['wounded'],S['initial_garrison'])
 def test_units(self): self.assertEqual(sum(S['units'].values()),S['available'])
 def test_prisoners(self): self.assertEqual(S['prisoners_captured']-S['prisoners_released_prior']-S['prisoners_exchange'],S['prisoners_remaining'])
if __name__=='__main__': unittest.main()

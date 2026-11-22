import unittest,zipfile,xml.etree.ElementTree as ET,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
WP='{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}'

class DocumentChecks(unittest.TestCase):
    def test_required_deliverables(self):
        names=['01_Novel/haedong_novel.md','01_Novel/haedong_novel.docx','01_Novel/haedong_novel.pdf','02_Scenario/SCENARIO_BOOK.md','02_Scenario/scenario_book.docx','02_Scenario/scenario_book.pdf','03_Characters/CHARACTER_BIBLE.md','03_Characters/character_bible.docx','03_Characters/character_bible.pdf','06_Codex/GAME_DESIGN.md','06_Codex/reference_kernel.py']
        for name in names:self.assertTrue((R/name).is_file(),name);self.assertGreater((R/name).stat().st_size,100,name)
    def test_image_counts(self):
        self.assertEqual(len(list((R/'03_Characters').glob('portrait*.png'))),20)
        self.assertEqual(len(list((R/'04_Illustrations').glob('scene*.png'))),20)
        self.assertEqual(len(list((R/'05_Maps').glob('*.svg'))),12)
    def test_word_images_not_clipped_by_fixed_line_height(self):
        for p in R.rglob('*.docx'):
            if 'v01_original' in str(p):continue
            with zipfile.ZipFile(p) as z:
                root=ET.fromstring(z.read('word/document.xml'))
                for para in root.iter(W+'p'):
                    if list(para.iter(WP+'inline')):
                        spacing=para.find(W+'pPr/'+W+'spacing')
                        self.assertIsNotNone(spacing,str(p))
                        self.assertNotEqual(spacing.get(W+'lineRule'),'exact',str(p))
    def test_novel_is_unique_complete_prose(self):
        text=(R/'01_Novel/haedong_novel.md').read_text()
        self.assertGreater(len(text),40000);self.assertIn('— 제1권 끝 —',text)
        paras=[p for p in text.split('\n\n') if len(p)>100]
        self.assertEqual(len(paras),len(set(paras)))
    def test_asset_references_in_markdown(self):
        import re
        for p in R.rglob('*.md'):
            if 'v01_original' in str(p):continue
            for path in re.findall(r'!\[[^\]]*\]\(([^)]+)\)',p.read_text()):self.assertTrue((p.parent/path).exists(),str(p)+' -> '+path)

if __name__=='__main__':unittest.main(verbosity=2)

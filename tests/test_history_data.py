import json
import subprocess
import sys
import unittest
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]


def dataset(name):
    return json.loads((ROOT / f"data/history/{name}.json").read_text(encoding="utf-8"))


PEOPLE = dataset("characters")
WORLD = dataset("factions")
SCENARIOS = dataset("scenarios")
FACTIONS = {faction["id"]: faction for faction in WORLD["factions"]}
HOUSES = {house["id"]: house for house in WORLD["houses"]}
STATS = ["leadership", "martial", "intelligence", "politics", "charisma"]


class HistoryDataTest(unittest.TestCase):
    def source(self, source):
        self.assertTrue(source["title"])
        self.assertIn(source["status"], {"checked", "candidate"})
        if source["url"]:
            self.assertEqual(urlsplit(source["url"]).scheme, "https")
        if source["status"] == "checked":
            for field in ("url", "claim", "locator", "edition", "accessed_on"):
                self.assertTrue(source[field], (field, source["title"]))

    def test_people_identity_sources_and_stats(self):
        seen = {}
        ids = set()
        for person in PEOPLE:
            key = person["person_id"]
            with self.subTest(person=key):
                self.assertNotIn(key, ids)
                ids.add(key)
                for name in {person["name_ko"], *person["aliases"], person["name_original"]} - {None}:
                    self.assertTrue(name)
                    self.assertEqual(seen.setdefault(name.strip().casefold(), key), key, name)
                self.assertIn(person["historicity"], {"A", "B", "C", "U"})
                self.assertIn(person["origin"], FACTIONS)
                self.assertTrue(person["roles"] and person["bio"] and person["sources"])
                self.assertNotIn("mujin", key)
                for source in person["sources"]:
                    self.source(source)
                    self.assertNotEqual(source["type"], "창작")
                if person["historicity"] == "A":
                    self.assertTrue(any(source["status"] == "checked" for source in person["sources"]))
                stats = person["stats"]
                self.assertEqual(list(stats), STATS)
                for score in stats.values():
                    self.assertTrue(score is None or type(score) is int and 0 <= score <= 100)
                provenance = person["stats_provenance"]
                self.assertEqual(provenance["kind"], "game_design" if any(score is not None for score in stats.values()) else "unknown")
                if provenance.get("primary") == "repository_preview":
                    self.assertIsNone(stats["charisma"])
        self.assertEqual(seen["사이메이"], seen["고교쿠"])
        self.assertEqual(seen["이세적"], seen["서세적"])
        self.assertEqual(seen["승민"], seen["민 법사"])
        self.assertEqual(seen["가루"], seen["고토쿠"])
        archive = json.loads((ROOT / "docs/HAEDONG_v1.0/07_GameData/characters.json").read_text(encoding="utf-8"))
        for person in archive:
            if "창작" in person["provenance"]:
                self.assertNotIn(person["name"], seen)

    def test_years_references_and_defections(self):
        for person in PEOPLE:
            key = person["person_id"]
            birth, death = person["birth_range"], person["death_range"]
            with self.subTest(person=key):
                for span in [birth, death, *person["availability"]]:
                    if span is not None:
                        self.assertEqual(len(span), 2)
                        self.assertTrue(all(type(year) is int and year > 0 for year in span))
                        self.assertLessEqual(*span)
                if birth and death:
                    self.assertLessEqual(birth[1], death[0])
                for start, end in person["availability"]:
                    self.assertTrue(birth is None or birth[0] <= start)
                    self.assertTrue(death is None or end <= death[1])
                if person["house_id"]:
                    self.assertIn(person["house_id"], HOUSES)
                for affiliation in person["affiliations"]:
                    self.assertIn(affiliation["faction_id"], FACTIONS)
                    start, end = affiliation["from_year"], affiliation["to_year"]
                    if start is not None and end is not None:
                        self.assertLessEqual(start, end)
                    self.assertTrue(death is None or end is None or end <= death[1], affiliation)
                    self.assertTrue(birth is None or start is None or birth[0] <= start, affiliation)
        people = {person["name_ko"]: person for person in PEOPLE}
        for name, source, target, year in (("연남생", "gog", "tang", 666), ("흑치상지", "baek", "tang", 663), ("대문예", "balhae", "tang", 726)):
            affiliations = people[name]["affiliations"]
            self.assertIn(source, [aff["faction_id"] for aff in affiliations])
            self.assertIn((target, year), [(aff["faction_id"], aff["from_year"]) for aff in affiliations])
        for house in HOUSES.values():
            members = {p["person_id"] for p in PEOPLE if p["house_id"] == house["id"]}
            for link in house["links"]:
                self.assertIn(link["left"], members)
                self.assertIn(link["right"], members)

    def test_nations_growth_graphs_and_scenarios(self):
        self.assertEqual(len(FACTIONS), len(WORLD["factions"]))
        self.assertEqual(len(WORLD["radar_axes"]), 7)
        core = [faction for faction in FACTIONS.values() if faction["kind"] == "core"]
        self.assertEqual(len(core), 5)
        for faction in core:
            self.assertEqual(len(faction["radar"]), 7)
            self.assertTrue(all(0 <= value <= 100 for value in faction["radar"]))
        self.assertEqual(FACTIONS["balhae"]["span"], [698, 926])
        graphs = [faction["government"] for faction in [*core, FACTIONS["balhae"]]]
        for graph in [*graphs, *WORLD["relations"].values()]:
            nodes = {node["id"] for node in graph["nodes"]}
            self.assertEqual(len(nodes), len(graph["nodes"]))
            self.assertGreater(len(nodes), 1)
            for edge in graph["edges"]:
                self.assertTrue({edge["left"], edge["right"]} <= nodes)
        office = next(node for node in FACTIONS["sil"]["government"]["nodes"] if node["id"] == "office")
        self.assertEqual(office["from_year"], 651)
        growth = WORLD["growth"]
        self.assertEqual(growth["ages"], [12, 18, 25, 35, 45, 55, 65, 75])
        self.assertNotIn("매력", growth["series"])
        for values in growth["series"].values():
            self.assertEqual(len(values), len(growth["ages"]))
            self.assertTrue(all(0 <= value <= 100 for value in values))
        self.assertEqual(len({item["id"] for item in SCENARIOS}), len(SCENARIOS))
        self.assertEqual(sorted(item["start_year"] for item in SCENARIOS), [item["start_year"] for item in SCENARIOS])
        self.assertEqual([s["id"] for s in SCENARIOS if s["playable"] == "legacy_645"], ["ansi-645"])
        for item in SCENARIOS:
            self.assertLessEqual(item["start_year"], item["end_year"])
            self.assertTrue(set(item["faction_ids"]) <= FACTIONS.keys())
            self.assertTrue(item["history"] and item["victory"] and item["sources"])
            for source in item["sources"]:
                self.source(source)
            if item["reference_save"]:
                self.assertTrue((ROOT / f'docs/HAEDONG_v1.0/07_GameData/{item["reference_save"]}.json').is_file())

    def test_static_bundle_matches_canonical_json(self):
        subprocess.run([sys.executable, str(ROOT / "scripts/build_history.py"), "--check"], check=True)


if __name__ == "__main__":
    unittest.main()

"""Convert the public-domain Natural Earth 1:50m land archive to map rings."""

import argparse
import json
import struct
from pathlib import Path
from zipfile import ZipFile


def clip(points, axis, bound, sign):
    if not points:
        return []
    result = []
    previous = points[-1]
    for point in points:
        inside = sign * (point[axis] - bound) >= 0
        if inside != (sign * (previous[axis] - bound) >= 0):
            fraction = (bound - previous[axis]) / (point[axis] - previous[axis])
            intersection = tuple(a + fraction * (b - a) for a, b in zip(previous, point))
            result.append(intersection)
        if inside:
            result.append(point)
        previous = point
    return result


def map_rings(data):
    offset = 100
    while offset < len(data):
        _, words = struct.unpack_from(">2i", data, offset)
        record = memoryview(data)[offset + 8:offset + 8 + words * 2]
        offset += 8 + words * 2
        if struct.unpack_from("<i", record)[0] != 5:
            continue
        west, south, east, north, parts, count = struct.unpack_from("<4d2i", record, 4)
        if east < 106 or west > 143 or north < 30 or south > 45:
            continue
        starts = (*struct.unpack_from(f"<{parts}i", record, 44), count)
        coordinates = struct.unpack_from(f"<{2 * count}d", record, 44 + 4 * parts)
        for start, stop in zip(starts, starts[1:]):
            points = list(zip(coordinates[2 * start:2 * stop:2], coordinates[2 * start + 1:2 * stop:2]))
            for axis, bound, sign in ((0, 106, 1), (0, 143, -1), (1, 30, 1), (1, 45, -1)):
                points = clip(points, axis, bound, sign)
            if len(points) >= 3:
                yield [[round(x, 3), round(y, 3)] for x, y in points]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    with ZipFile(args.archive) as archive:
        rings = list(map_rings(archive.read("ne_50m_land.shp")))
    target = Path(__file__).resolve().parents[1] / "scenario-preview" / "coastline.js"
    payload = ",\n".join(json.dumps(ring, separators=(",", ":")) for ring in rings)
    target.write_text("// Natural Earth 1:50m land · public domain\nwindow.haedongCoastline = [\n" + payload + "\n];\n", encoding="utf-8")


if __name__ == "__main__":
    main()

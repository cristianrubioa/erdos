#!/usr/bin/env python3
import argparse
import json
import math
from datetime import datetime, timezone
from itertools import product
from pathlib import Path

try:
    from cypari2 import Pari
    pari = Pari()
except Exception:  # Optional dependency for environments without PARI/GP installed.
    pari = None


def phi(n: int) -> int:
    result = n
    p = 2
    temp = n
    while p * p <= temp:
        if temp % p == 0:
            while temp % p == 0:
                temp //= p
            result -= result // p
        p += 1
    if temp > 1:
        result -= result // temp
    return result


def build_points(m: int, coeff_range: int, radius: float, decimals: int):
    degree = phi(m)
    if pari is not None:
        zeta = complex(pari(f"exp(2*Pi*I/{m})"))
        engine = "cypari2"
    else:
        zeta = complex(math.cos(2 * math.pi / m), math.sin(2 * math.pi / m))
        engine = "cmath"
    basis = [zeta ** i for i in range(degree)]
    coeffs = range(-coeff_range, coeff_range + 1)

    coords = []
    index = {}
    for coeff_tuple in product(coeffs, repeat=degree):
        z = 0j
        for i, c in enumerate(coeff_tuple):
            if c:
                z += c * basis[i]
        if abs(z) > radius:
            continue
        key = (round(z.real, decimals), round(z.imag, decimals))
        if key in index:
            continue
        index[key] = len(coords)
        coords.append(z)

    return zeta, coords, index, engine


def build_edges(coords, index, zeta, m: int, decimals: int):
    directions = [zeta ** k for k in range(m)]
    edges = []
    for i, z in enumerate(coords):
        for d in directions:
            z2 = z + d
            key = (round(z2.real, decimals), round(z2.imag, decimals))
            j = index.get(key)
            if j is None or j <= i:
                continue
            edges.extend([i, j])
    return edges


def main():
    parser = argparse.ArgumentParser(description="Precompute CM dataset using cyclotomic field.")
    parser.add_argument("--m", type=int, default=12, help="Cyclotomic order (default: 12)")
    parser.add_argument("--coeff", type=int, default=2, help="Coefficient range for basis (default: 2)")
    parser.add_argument("--radius", type=float, default=4.0, help="Radius filter (default: 4.0)")
    parser.add_argument("--decimals", type=int, default=9, help="Rounding precision for hashing")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/data/cm.json"),
        help="Output JSON path",
    )
    args = parser.parse_args()

    zeta, coords, index, engine = build_points(args.m, args.coeff, args.radius, args.decimals)
    edges = build_edges(coords, index, zeta, args.m, args.decimals)

    points_flat = []
    for z in coords:
        points_flat.extend([float(z.real), float(z.imag)])

    meta = {
        "name": f"cm-cyclo-m{args.m}",
        "source": "cyclotomic-precompute",
        "engine": engine,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "cyclotomicOrder": args.m,
        "degree": phi(args.m),
        "coeffRange": args.coeff,
        "radius": args.radius,
        "directionCount": args.m,
        "pointCount": len(coords),
        "edgeCount": len(edges) // 2,
    }

    dataset = {"points": points_flat, "edges": edges, "meta": meta}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(dataset, separators=(",", ":")))


if __name__ == "__main__":
    main()

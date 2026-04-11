"""
Rabin-Karp Plagiarism Detection System — Terminal Demo
=======================================================
Pure algorithm, no UI. Run directly to see results.
"""

import re

# ─────────────────────────────────────────────────────────────────────────────
# RABIN-KARP CORE
# ─────────────────────────────────────────────────────────────────────────────

BASE  = 256
PRIME = 101


def compute_hash(text, length):
    h = 0
    for i in range(length):
        h = (h * BASE + ord(text[i])) % PRIME
    return h


def roll_hash(old_hash, old_char, new_char, window):
    high  = pow(BASE, window - 1, PRIME)
    new_h = (BASE * (old_hash - ord(old_char) * high) + ord(new_char)) % PRIME
    return new_h


def rabin_karp_search(pattern, text):
    m, n = len(pattern), len(text)
    matches = []
    spurious = 0
    if m == 0 or m > n:
        return matches, spurious
    p_hash = compute_hash(pattern, m)
    t_hash = compute_hash(text, m)
    for i in range(n - m + 1):
        if p_hash == t_hash:
            if text[i:i + m] == pattern:
                matches.append(i)
            else:
                spurious += 1  # Hash collision — SPURIOUS MATCH
        if i < n - m:
            t_hash = roll_hash(t_hash, text[i], text[i + m], m)
    return matches, spurious


def get_ngram_hashes(text, n):
    hashes = set()
    if len(text) < n:
        return hashes
    h = compute_hash(text, n)
    hashes.add(h)
    for i in range(1, len(text) - n + 1):
        h = roll_hash(h, text[i - 1], text[i + n - 1], n)
        hashes.add(h)
    return hashes


def similarity_score(text1, text2, window=5):
    h1 = get_ngram_hashes(text1, window)
    h2 = get_ngram_hashes(text2, window)
    if not h1 and not h2:
        return 100.0
    if not h1 or not h2:
        return 0.0
    return len(h1 & h2) / len(h1 | h2) * 100


def check_plagiarism(source, suspect, window=5):
    source  = source.lower()
    suspect = suspect.lower()

    score     = similarity_score(source, suspect, window)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', suspect.strip()) if s.strip()]

    matched        = []
    unmatched      = []
    total_spurious = 0

    for s in sentences:
        hits, spurious = rabin_karp_search(s, source)
        total_spurious += spurious
        if hits:
            matched.append(s)
        else:
            unmatched.append(s)

    return {
        "similarity_percent" : round(score, 2),
        "window_size"        : window,
        "total_sentences"    : len(sentences),
        "matched_count"      : len(matched),
        "spurious_count"     : total_spurious,
        "matched_sentences"  : matched,
        "unmatched_sentences": unmatched,
    }


def print_results(result):
    SEP = "=" * 55
    print(SEP)
    print(f"  Similarity Score : {result['similarity_percent']}%")
    print(f"  Window Size      : {result['window_size']}")
    print(f"  Total Sentences  : {result['total_sentences']}")
    print(f"  Matched          : {result['matched_count']}")
    print(SEP)

    if result["matched_sentences"]:
        print("\n[MATCHED — found verbatim in source]")
        for s in result["matched_sentences"]:
            print(f"  > {s}")

    if result["spurious_count"] > 0:
        print(f"\n[SPURIOUS MATCH — hash collision detected: {result['spurious_count']} instance(s)]")

    if result["unmatched_sentences"]:
        print("\n[NOT MATCHED — not found verbatim in source]")
        for s in result["unmatched_sentences"]:
            print(f"  > {s}")

    print()


# ─────────────────────────────────────────────────────────────────────────────
# MANUAL INPUT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 55)
    print("  Rabin-Karp Plagiarism Detection — Terminal")
    print("=" * 55)

    print("\nPaste the SOURCE document (press Enter twice when done):")
    source = []
    while True:
        line = input()
        if line == "":
            break
        source.append(line)
    source = "\n".join(source).strip()

    print("\nPaste the SUSPECT document (press Enter twice when done):")
    suspect = []
    while True:
        line = input()
        if line == "":
            break
        suspect.append(line)
    suspect = "\n".join(suspect).strip()

    win_input = input("\nWindow size [default 5]: ").strip()
    window = int(win_input) if win_input.isdigit() else 5

    print()
    result = check_plagiarism(source, suspect, window)
    print_results(result)
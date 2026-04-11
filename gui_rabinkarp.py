"""
Rabin-Karp Plagiarism Detection System
=======================================
A standard implementation of the Rabin-Karp string-matching algorithm
applied to document plagiarism detection.
"""

import re
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext

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
    # Note: Python's % operator always returns non-negative values,
    # so the h < 0 guard is handled natively by the language.
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
    # FIX 1: CONVERT all characters to lowercase (Step 1 of algorithm)
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


# ─────────────────────────────────────────────────────────────────────────────
# TKINTER GUI
# ─────────────────────────────────────────────────────────────────────────────

def run_analysis():
    source  = src_text.get("1.0", tk.END).strip()
    suspect = sus_text.get("1.0", tk.END).strip()

    if not source or not suspect:
        messagebox.showwarning("Missing Input", "Please enter both source and suspect texts.")
        return

    try:
        win = int(window_entry.get())
    except ValueError:
        messagebox.showerror("Invalid Input", "Window size must be a number.")
        return

    result = check_plagiarism(source, suspect, win)

    result_text.config(state=tk.NORMAL)
    result_text.delete("1.0", tk.END)

    result_text.insert(tk.END, "=" * 55 + "\n")
    result_text.insert(tk.END, f"  Similarity Score : {result['similarity_percent']}%\n")
    result_text.insert(tk.END, f"  Window Size      : {result['window_size']}\n")
    result_text.insert(tk.END, f"  Total Sentences  : {result['total_sentences']}\n")
    result_text.insert(tk.END, f"  Matched          : {result['matched_count']}\n")
    result_text.insert(tk.END, "=" * 55 + "\n\n")

    # FIX 2: Show MATCHED sentences
    if result["matched_sentences"]:
        result_text.insert(tk.END, "[MATCHED - found verbatim in source]\n")
        for s in result["matched_sentences"]:
            result_text.insert(tk.END, f"  > {s}\n")
        result_text.insert(tk.END, "\n")

    # FIX 3: Show SPURIOUS MATCH (hash collision) — aligns Step 5 of algorithm
    if result["spurious_count"] > 0:
        result_text.insert(tk.END, f"[SPURIOUS MATCH - hash collision detected: {result['spurious_count']} instance(s)]\n\n")

    # Show NOT MATCHED sentences
    if result["unmatched_sentences"]:
        result_text.insert(tk.END, "[NOT MATCHED - not found verbatim in source]\n")
        for s in result["unmatched_sentences"]:
            result_text.insert(tk.END, f"  > {s}\n")

    result_text.config(state=tk.DISABLED)


def load_source_file():
    path = filedialog.askopenfilename(filetypes=[("Text files", "*.txt")])
    if path:
        with open(path, encoding="utf-8") as f:
            src_text.delete("1.0", tk.END)
            src_text.insert(tk.END, f.read())


def load_suspect_file():
    path = filedialog.askopenfilename(filetypes=[("Text files", "*.txt")])
    if path:
        with open(path, encoding="utf-8") as f:
            sus_text.delete("1.0", tk.END)
            sus_text.insert(tk.END, f.read())


def clear_all():
    src_text.delete("1.0", tk.END)
    sus_text.delete("1.0", tk.END)
    result_text.config(state=tk.NORMAL)
    result_text.delete("1.0", tk.END)
    result_text.config(state=tk.DISABLED)


# ─────────────────────────────────────────────────────────────────────────────
# BUILD WINDOW
# ─────────────────────────────────────────────────────────────────────────────

root = tk.Tk()
root.title("Rabin-Karp Plagiarism Detection System")
root.geometry("800x620")
root.resizable(True, True)

# Title
tk.Label(root, text="Rabin-Karp Plagiarism Detection System",
        font=("Courier New", 13, "bold")).pack(pady=(12, 2))
tk.Label(root, text="Standard String-Matching Algorithm  |  BASE=256  PRIME=101",
        font=("Courier New", 8)).pack(pady=(0, 10))

tk.Frame(root, height=1, bg="gray").pack(fill="x", padx=10)

# Input frames side by side
input_frame = tk.Frame(root)
input_frame.pack(fill="both", expand=True, padx=10, pady=8)

# Source
src_frame = tk.LabelFrame(input_frame, text="Source Document", font=("Courier New", 9))
src_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
tk.Button(src_frame, text="Load .txt File", font=("Courier New", 8),
        command=load_source_file).pack(anchor="e", padx=4, pady=(4, 0))
src_text = scrolledtext.ScrolledText(src_frame, font=("Courier New", 9),
                                    wrap=tk.WORD, height=10)
src_text.pack(fill="both", expand=True, padx=4, pady=4)

# Suspect
sus_frame = tk.LabelFrame(input_frame, text="Suspect Document", font=("Courier New", 9))
sus_frame.pack(side="left", fill="both", expand=True, padx=(5, 0))
tk.Button(sus_frame, text="Load .txt File", font=("Courier New", 8),
        command=load_suspect_file).pack(anchor="e", padx=4, pady=(4, 0))
sus_text = scrolledtext.ScrolledText(sus_frame, font=("Courier New", 9),
                                    wrap=tk.WORD, height=10)
sus_text.pack(fill="both", expand=True, padx=4, pady=4)

# Controls
ctrl_frame = tk.Frame(root)
ctrl_frame.pack(fill="x", padx=10, pady=4)

tk.Label(ctrl_frame, text="Window Size:", font=("Courier New", 9)).pack(side="left")
window_entry = tk.Entry(ctrl_frame, font=("Courier New", 9), width=4)
window_entry.insert(0, "5")
window_entry.pack(side="left", padx=(4, 16))

tk.Button(ctrl_frame, text="Analyze", font=("Courier New", 9, "bold"),
        command=run_analysis).pack(side="left", padx=(0, 8))
tk.Button(ctrl_frame, text="Clear", font=("Courier New", 9),
        command=clear_all).pack(side="left")

# Results
res_frame = tk.LabelFrame(root, text="Results", font=("Courier New", 9))
res_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))

result_text = scrolledtext.ScrolledText(res_frame, font=("Courier New", 9),
                                        wrap=tk.WORD, height=10, state=tk.DISABLED)
result_text.pack(fill="both", expand=True, padx=4, pady=4)

root.mainloop()
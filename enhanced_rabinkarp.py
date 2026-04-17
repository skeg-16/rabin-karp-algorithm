"""
ENHANCED Rabin-Karp Plagiarism Detection System
=======================================================
Includes Dictionary-Based Normalization and Filipino Stop-Word Removal.
"""

import re
import json
import os

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: BILINGUAL PRE-PROCESSING MODULE
# ─────────────────────────────────────────────────────────────────────────────

def load_json_file(filename):
    """Utility function to load JSON files gracefully."""
    file_path = os.path.join(os.path.dirname(__file__), filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Warning: {filename} not found in the root folder.")
        return None
    except json.JSONDecodeError:
        print(f"Warning: {filename} is empty or invalid.")
        return None

# Load Stop-words (solves SOP #2: Algorithmic Noise)
loaded_stopwords = load_json_file("stopwords.json")
FILIPINO_STOP_WORDS = set(loaded_stopwords) if loaded_stopwords else set()

# Load and Invert Dictionary (solves SOP #1: Semantic Blindness)
# ENHANCEMENT 1: Many-to-One Synonym Mapping
raw_grouped_dict = load_json_file("dictionary.json") or {}
TAGALOG_TO_ENGLISH_DICT = {}

# We invert the dictionary for O(1) lookup speed.
# E.g., From {"student": ["mag-aaral", "estudyante"]} 
# To {"mag-aaral": "student", "estudyante": "student"}
for english_word, tagalog_list in raw_grouped_dict.items():
    if isinstance(tagalog_list, list):
        for tagalog_word in tagalog_list:
            TAGALOG_TO_ENGLISH_DICT[tagalog_word.lower()] = english_word
    else:
        # Fallback safeguard in case some entries are strings instead of lists
        TAGALOG_TO_ENGLISH_DICT[tagalog_list.lower()] = english_word

def normalize_text(text):
    """
    Normalizes text by translating Tagalog terms to English and removing stop words.
    """
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    
    normalized_tokens = []
    for word in words:
        # Stop-Word Filter
        if word in FILIPINO_STOP_WORDS:
            continue
            
        # Dictionary Mapping (Synonyms resolved to English root word)
        translated_word = TAGALOG_TO_ENGLISH_DICT.get(word, word)
        normalized_tokens.append(translated_word)
        
    return " ".join(normalized_tokens)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: RABIN-KARP CORE
# ─────────────────────────────────────────────────────────────────────────────

BASE  = 256
PRIME = 1000000007

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
                spurious += 1
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
    norm_source = normalize_text(source)
    norm_suspect = normalize_text(suspect)

    score = similarity_score(norm_source, norm_suspect, window)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', suspect.strip()) if s.strip()]

    matched        = []
    unmatched      = []
    total_spurious = 0

    for s in sentences:
        norm_s = normalize_text(s)
        if not norm_s:
            continue
            
        hits, spurious = rabin_karp_search(norm_s, norm_source)
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
        "normalized_source": norm_source,     
        "normalized_suspect": norm_suspect    
    }
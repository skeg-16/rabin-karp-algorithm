"""
ENHANCED Rabin-Karp Plagiarism Detection System
=======================================================
Includes Dictionary-Based Normalization and Filipino Stop-Word Removal.
"""

import re
import json
import os
import logging

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
        logging.warning(f"{filename} not found in the root folder.")
        return None
    except json.JSONDecodeError:
        logging.warning(f"{filename} is empty or invalid.")
        return None

# Load Stop-words (solves SOP #2: Algorithmic Noise)
loaded_stopwords = load_json_file("stopwords.json")
FILIPINO_STOP_WORDS = set()
if loaded_stopwords:
    if isinstance(loaded_stopwords, dict):
        for key, values in loaded_stopwords.items():
            # Add the key itself (English word)
            FILIPINO_STOP_WORDS.add(key.lower().strip())
            # Add all synonyms (Tagalog words)
            if isinstance(values, list):
                for v in values:
                    FILIPINO_STOP_WORDS.add(v.lower().strip())
            else:
                FILIPINO_STOP_WORDS.add(values.lower().strip())
    else:
        FILIPINO_STOP_WORDS = set(w.lower().strip() for w in loaded_stopwords)

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
    # ────────────────────────────────────────────────────────────
    # BAGONG SANITIZATION CODE: 
    # Tatanggalin nito ang mga line breaks (\n), tabs, at extra 
    # spaces para maging isang diretsong text na lang bago pa ito 
    # i-process.
    # ────────────────────────────────────────────────────────────
    source = re.sub(r'\s+', ' ', source).strip()
    suspect = re.sub(r'\s+', ' ', suspect).strip()

    # Phase 1: Normalization
    norm_source = normalize_text(source)
    norm_suspect = normalize_text(suspect)

    # Phase 2: Scoring
    score = similarity_score(norm_source, norm_suspect, window)
    
    # Phase 3: Sentence Splitting
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', suspect) if s.strip()]
    
    # Get all hashes from the source for quick lookup
    source_hashes = get_ngram_hashes(norm_source, window)

    matched        = []
    unmatched      = []

    # Phase 4: Flexible N-gram Matcher per sentence
    for s in sentences:
        norm_s = normalize_text(s)
        if not norm_s:
            continue
            
        sentence_hashes = get_ngram_hashes(norm_s, window)
        if not sentence_hashes:
            unmatched.append(s)
            continue
            
        # Count how many fragments of this sentence exist in the source
        overlap = [h for h in sentence_hashes if h in source_hashes]
        
        # THRESHOLD: If more than 30% of the sentence fragments match, mark as plagiarized
        match_ratio = len(overlap) / len(sentence_hashes)
        
        if match_ratio >= 0.3:  # 30% threshold for bilingual detection
            matched.append(s)
        else:
            unmatched.append(s)

    # Note: Spurious matches are computed at the global similarity level now
    # but for individual sentence matching, we use the set-based overlap.
    total_spurious = 0 

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